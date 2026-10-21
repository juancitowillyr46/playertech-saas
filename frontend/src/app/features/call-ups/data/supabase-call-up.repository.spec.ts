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

    it('lee el seguimiento y el historial, y marca lo que ya no cuenta (spec 013)', async () => {
        const mock = supabaseClientMock([
            {
                data: [
                    {
                        list_id: 'l',
                        player_id: 'p',
                        answer: 'no',
                        reason: 'illness',
                        reason_text: null,
                        source: 'guardian',
                        created_at: 't',
                        guardian_name: 'Luz',
                        relationship: 'mother',
                        guardian_link_id: 'gl',
                        link_status: 'pending',
                        device_id: 'd',
                        device_status: 'pending',
                        declared_name: 'Luz',
                        unvalidated: true,
                        phone_match: null
                    }
                ],
                error: null
            },
            {
                data: [
                    { id: 'r2', answer: 'yes', reason: null, reason_text: null, source: 'owner', created_at: 't2', guardian_links: null, guardian_devices: null },
                    {
                        id: 'r1',
                        answer: 'no',
                        reason: null,
                        reason_text: null,
                        source: 'guardian',
                        created_at: 't1',
                        guardian_links: { relationship: 'father', status: 'rejected', guardians: { full_name: 'X' } },
                        guardian_devices: { status: 'revoked', declared_name: 'Luis' }
                    }
                ],
                error: null
            }
        ]);
        TestBed.configureTestingModule({ providers: [SupabaseCallUpRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }, { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a' }) } }] });
        const repository = TestBed.inject(SupabaseCallUpRepository);

        expect(await repository.responses('c')).toEqual([expect.objectContaining({ playerId: 'p', answer: 'no', unvalidated: true, phoneMatch: false, linkStatus: 'pending' })]);
        const history = await repository.history('c', 'p');

        expect(history.map((entry) => entry.counts)).toEqual([true, false]);
        expect(history[1]).toMatchObject({ guardianName: 'X', declaredName: 'Luis' });
    });

    it('los totales no consultan sin actividades y el owner responde con su fuente (spec 013)', async () => {
        const mock = supabaseClientMock([{ data: null, error: null }]);
        TestBed.configureTestingModule({ providers: [SupabaseCallUpRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }, { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a' }) } }] });
        const repository = TestBed.inject(SupabaseCallUpRepository);

        expect(await repository.summaries([])).toEqual([]);
        expect(mock.from).not.toHaveBeenCalled();
        await repository.respondAsOwner('c', 'p', { answer: 'maybe', reason: 'schedule', reasonText: null });
        expect(mock.args('insert', 'call_up_responses')[0][0]).toEqual({ academy_id: 'academy-a', call_up_id: 'c', player_id: 'p', answer: 'maybe', reason: 'schedule', reason_text: null, source: 'owner' });
    });

    it('el jugador que responde él mismo no es su acudiente; su celular cubre la ficha sin celular (spec 013)', async () => {
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
                        {
                            player_id: 'p',
                            players: {
                                first_names: 'Max',
                                last_names: 'J',
                                nickname: null,
                                phone: null,
                                deleted_at: null,
                                is_active: true,
                                guardian_links: [{ status: 'validated', deleted_at: null, relationship: 'self', guardians: { full_name: 'Max J', phone: '3104440015', deleted_at: null } }]
                            }
                        }
                    ]
                }
            ]
        };
        const { repository } = setup(row);

        const callUp = await repository.getByActivity('a');

        expect(callUp?.lists[0].players[0]).toMatchObject({ phone: '3104440015', guardians: [] });
    });
});
