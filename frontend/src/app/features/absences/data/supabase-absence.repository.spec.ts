import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { AbsenceRuleError } from '../models/absence.models';
import { SupabaseAbsenceRepository } from './supabase-absence.repository';

function setup(data: unknown, error: unknown = null) {
    const mock = supabaseClientMock([{ data, error }]);
    TestBed.configureTestingModule({ providers: [SupabaseAbsenceRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }] });

    return { repository: TestBed.inject(SupabaseAbsenceRepository), ...mock };
}

describe('SupabaseAbsenceRepository', () => {
    it('lee las ausencias con el nombre del jugador y deja fuera las desmarcadas sin aviso', async () => {
        const { repository, args } = setup([
            { player_id: 'p1', marked_at: 'm1', notified_at: null, deleted_at: null, players: { first_names: 'Samuel', last_names: 'Gómez', nickname: 'Samu' } },
            { player_id: 'p2', marked_at: 'm2', notified_at: 'n2', deleted_at: 'd2', players: { first_names: 'Mateo', last_names: 'Rodas', nickname: null } },
            { player_id: 'p3', marked_at: 'm3', notified_at: null, deleted_at: 'd3', players: { first_names: 'Tomás', last_names: 'Arango', nickname: null } }
        ]);

        expect(await repository.list('a1')).toEqual([
            { playerId: 'p1', fullName: 'Samuel Gómez · Samu', markedAt: 'm1', notifiedAt: null, active: true },
            { playerId: 'p2', fullName: 'Mateo Rodas', markedAt: 'm2', notifiedAt: 'n2', active: false }
        ]);
        expect(args('eq')[0]).toEqual(['activity_id', 'a1']);
    });

    it('marca, desmarca y registra el aviso con su hora', async () => {
        const { repository, rpc } = setup('2026-10-24T21:12:00Z');

        expect(await repository.markNotified('a1', 'p1')).toBe('2026-10-24T21:12:00Z');
        await repository.setAbsent('a1', 'p1', false);
        expect(rpc).toHaveBeenCalledWith('mark_absence_notified', { p_activity_id: 'a1', p_player_id: 'p1' });
        expect(rpc).toHaveBeenCalledWith('set_absence', { p_activity_id: 'a1', p_player_id: 'p1', p_absent: false });
    });

    it('traduce el plazo vencido y los demás errores', async () => {
        const closed = setup(null, { code: '23514', message: 'absence_window_closed' });
        await expect(closed.repository.setAbsent('a1', 'p1', true)).rejects.toBeInstanceOf(AbsenceRuleError);

        TestBed.resetTestingModule();
        const forbidden = setup(null, pgError('42501'));
        await expect(forbidden.repository.setAbsent('a1', 'p1', true)).rejects.toMatchObject({ code: 'forbidden' });
    });
});
