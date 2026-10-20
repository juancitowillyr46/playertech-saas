import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { SupabaseCallUpRepository } from './supabase-call-up.repository';
function setup(result: unknown, error: unknown = null) {
    const mock = supabaseClientMock([{ data: result, error }]);
    TestBed.configureTestingModule({ providers: [SupabaseCallUpRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }, { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a' }) } }] });
    return { repository: TestBed.inject(SupabaseCallUpRepository), ...mock };
}
describe('SupabaseCallUpRepository', () => {
    it('getByActivity usa una consulta y descarta jugadores retirados o inactivos', async () => {
        const row = {
            id: 'c',
            activity_id: 'a',
            deadline: null,
            closed_at: null,
            call_up_lists: [
                {
                    id: 'l',
                    group_id: null,
                    token: 't',
                    intro: null,
                    position: 0,
                    groups: null,
                    call_up_players: [
                        { player_id: 'p', players: { first_names: 'Ana', last_names: 'Ríos', nickname: null, phone: null, deleted_at: null, is_active: true, guardian_links: [] } },
                        { player_id: 'x', players: { first_names: 'X', last_names: 'X', nickname: null, phone: null, deleted_at: null, is_active: false, guardian_links: [] } }
                    ]
                }
            ]
        };
        const { repository, from } = setup(row);
        const callUp = await repository.getByActivity('a');
        expect(from).toHaveBeenCalledTimes(1);
        expect(callUp?.lists[0].players).toHaveLength(1);
    });
    it('escribe, mueve, cierra, guarda texto y quita la lista vacía', async () => {
        const mock = supabaseClientMock([
            { data: null, error: null },
            { data: { list_id: 'l' }, error: null },
            { data: [], error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null }
        ]);
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [SupabaseCallUpRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }, { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a' }) } }] });
        const repository = TestBed.inject(SupabaseCallUpRepository);
        const callUp = { id: 'c', activityId: 'a', deadline: null, closedAt: null, lists: [] };
        await repository.addPlayers(callUp, 'l', ['p']);
        await repository.removePlayer('c', 'p');
        await repository.movePlayer('c', 'p', 'l2');
        await repository.setDeadline('c', null);
        await repository.close('c');
        await repository.saveIntro('l', 'Hola');
        expect(mock.args('insert', 'call_up_players')).toHaveLength(1);
        expect(mock.args('delete', 'call_up_lists')).toHaveLength(1);
        expect(mock.args('update')).toHaveLength(4);
    });
    it('create usa la RPC y los errores se traducen', async () => {
        const ok = setup(null);
        await ok.repository.create('a', null, [{ groupId: null, playerIds: ['p'] }]);
        expect(ok.rpc).toHaveBeenCalledWith('create_call_up', expect.any(Object));
        TestBed.resetTestingModule();
        const bad = setup(null, pgError('23505'));
        await expect(bad.repository.getByActivity('a')).rejects.toMatchObject({ code: 'duplicate' });
    });
});
