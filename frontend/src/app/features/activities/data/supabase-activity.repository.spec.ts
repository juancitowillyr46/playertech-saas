import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { MockResult, pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { ActivityInput } from '../models/activity.models';
import { SupabaseActivityRepository } from './supabase-activity.repository';

const PLACE = { id: 'v1', name: 'Sede Norte', address: 'Calle 1', city: 'Bogotá', directions: null };
const ROW = {
    id: 'a1',
    type: 'competition',
    starts_at: '2026-10-24T14:00:00+00:00',
    ends_at: null,
    call_at: null,
    notes: null,
    opponent: 'Club Norte',
    tournament: null,
    status: 'scheduled',
    series_id: null,
    venues: null,
    external_fields: { ...PLACE, id: 'f1', name: 'Cancha El Salitre' }
};
const TRAINING: ActivityInput = {
    type: 'training',
    startsAt: '2026-10-20T21:00:00.000Z',
    endsAt: null,
    callAt: null,
    place: { kind: 'venue', id: 'v1' },
    notes: null,
    opponent: 'No aplica',
    tournament: null
};

function setup(results: MockResult[], academyId: string | null = 'academy-a') {
    const mock = supabaseClientMock(results);

    TestBed.configureTestingModule({
        providers: [
            SupabaseActivityRepository,
            { provide: SUPABASE_CLIENT, useValue: mock.client },
            { provide: AcademyContextService, useValue: { academy: signal(academyId ? { id: academyId, name: 'A', logoFileId: null } : undefined) } }
        ]
    });

    return { repository: TestBed.inject(SupabaseActivityRepository), ...mock };
}

describe('SupabaseActivityRepository', () => {
    it('list: próximas desde ahora en orden ascendente, con el lugar embebido y sin eliminadas', async () => {
        const { repository, args } = setup([{ data: [ROW], error: null }]);

        const [activity] = await repository.list('upcoming');

        expect(args('gte')[0][0]).toBe('starts_at');
        expect(args('order')[0]).toEqual(['starts_at', { ascending: true }]);
        expect(args('is')).toContainEqual(['deleted_at', null]);
        expect(activity.place).toEqual({ kind: 'field', id: 'f1', name: 'Cancha El Salitre', address: 'Calle 1', city: 'Bogotá', directions: null });
        expect(activity.opponent).toBe('Club Norte');
    });

    it('list: pasadas antes de ahora, de la más reciente a la más antigua', async () => {
        const { repository, args } = setup([{ data: [], error: null }]);

        await repository.list('past');

        expect(args('lt')[0][0]).toBe('starts_at');
        expect(args('order')[0]).toEqual(['starts_at', { ascending: false }]);
    });

    it('create: un solo insert con la academia y la serie; sin rival en entrenamiento', async () => {
        const { repository, args } = setup([{ data: [{ id: 'a1' }, { id: 'a2' }], error: null }]);

        expect(await repository.create([TRAINING, { ...TRAINING, startsAt: '2026-10-22T21:00:00.000Z' }], 'serie-1')).toBe(2);
        const rows = args('insert')[0][0] as Record<string, unknown>[];
        expect(args('insert')).toHaveLength(1);
        expect(rows[0]).toEqual({
            academy_id: 'academy-a',
            series_id: 'serie-1',
            type: 'training',
            starts_at: '2026-10-20T21:00:00.000Z',
            ends_at: null,
            call_at: null,
            venue_id: 'v1',
            external_field_id: null,
            notes: null,
            opponent: null,
            tournament: null
        });
    });

    it('create: sin academia rechaza con forbidden; una regla violada, con rule_violation', async () => {
        const noAcademy = setup([], null);
        await expect(noAcademy.repository.create([TRAINING], null)).rejects.toMatchObject({ code: 'forbidden' });

        TestBed.resetTestingModule();
        const { repository } = setup([{ data: null, error: pgError('23514') }]);
        await expect(repository.create([TRAINING], null)).rejects.toMatchObject({ code: 'rule_violation' });
    });

    it('setStatus y delete actualizan una no eliminada; si ya no existe, not_found', async () => {
        const { repository, args } = setup([{ data: { id: 'a1' }, error: null }, { data: { id: 'a1' }, error: null }, { data: null, error: pgError('PGRST116') }]);

        await repository.setStatus('a1', 'cancelled');
        await repository.delete('a1');

        expect(args('update')[0][0]).toEqual({ status: 'cancelled' });
        expect(Object.keys(args('update')[1][0] as object)).toEqual(['deleted_at']);
        await expect(repository.update('a1', TRAINING)).rejects.toMatchObject({ code: 'not_found' });
    });
});
