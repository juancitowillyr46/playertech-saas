import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { MockResult, pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { SupabaseGuardianRepository } from './supabase-guardian.repository';

const player = (first_names: string, last_names: string, is_active = true, deleted_at: string | null = null) => ({ first_names, last_names, is_active, deleted_at });

const LINK = {
    id: 'l1',
    relationship: 'father',
    guardians: {
        id: 'gd1',
        full_name: 'Carlos Vargas',
        phone: '3157779876',
        guardian_links: [
            { player_id: 'p1', deleted_at: null, players: player('Samuel', 'Vargas') },
            { player_id: 'p2', deleted_at: null, players: player('Tomás', 'vargas') },
            { player_id: 'p3', deleted_at: null, players: player('Inactivo', 'X', false) },
            { player_id: 'p4', deleted_at: '2026-10-01T00:00:00Z', players: player('Retirado', 'Y') }
        ]
    }
};

function setup(results: MockResult[]) {
    const mock = supabaseClientMock(results);

    TestBed.configureTestingModule({ providers: [SupabaseGuardianRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }] });

    return { repository: TestBed.inject(SupabaseGuardianRepository), ...mock };
}

describe('SupabaseGuardianRepository', () => {
    it('listByPlayer: vínculos validados y no retirados, con los otros jugadores activos que acompaña', async () => {
        const { repository, args } = setup([{ data: [LINK], error: null }]);

        const guardians = await repository.listByPlayer('p1');

        expect(args('eq')).toEqual([
            ['player_id', 'p1'],
            ['status', 'validated']
        ]);
        expect(args('is')).toContainEqual(['deleted_at', null]);
        expect(guardians).toEqual([{ linkId: 'l1', guardianId: 'gd1', fullName: 'Carlos Vargas', phone: '3157779876', relationship: 'father', otherPlayers: ['Tomás V.'] }]);
    });

    it('findByPhone: el acudiente no eliminado con ese celular, o null', async () => {
        const { repository, args } = setup([
            { data: { id: 'gd1', full_name: 'Carlos Vargas' }, error: null },
            { data: null, error: null }
        ]);

        expect(await repository.findByPhone('3157779876')).toEqual({ guardianId: 'gd1', fullName: 'Carlos Vargas' });
        expect(await repository.findByPhone('3000000000')).toBeNull();
        expect(args('is')).toContainEqual(['deleted_at', null]);
    });

    it('addToPlayer: llama a add_player_guardian con la autorización y traduce la respuesta', async () => {
        const { repository, rpc } = setup([{ data: [{ guardian_id: 'gd1', link_id: 'l2', guardian_existed: true, guardian_name: 'Carlos Vargas' }], error: null }]);

        const result = await repository.addToPlayer('p2', { fullName: 'Carlos', phone: '3157779876', relationship: 'father' });

        expect(rpc).toHaveBeenCalledWith('add_player_guardian', { p_player_id: 'p2', p_full_name: 'Carlos', p_phone: '3157779876', p_relationship: 'father', p_consent: true });
        expect(result).toEqual({ guardianExisted: true, guardianName: 'Carlos Vargas' });
    });

    it('addToPlayer: vínculo repetido rechaza con duplicate; sin autorización, con rule_violation', async () => {
        const { repository } = setup([
            { data: null, error: pgError('23505') },
            { data: null, error: pgError('22023') }
        ]);
        const input = { fullName: 'Carlos', phone: '3157779876', relationship: 'father' } as const;

        await expect(repository.addToPlayer('p1', input)).rejects.toMatchObject({ code: 'duplicate' });
        await expect(repository.addToPlayer('p1', input)).rejects.toMatchObject({ code: 'rule_violation' });
    });

    it('editar y retirar: solo sus columnas, sobre filas no eliminadas; si ya no existe, not_found', async () => {
        const ok = { data: { id: 'x' }, error: null };
        const { repository, args } = setup([ok, ok, ok, { data: null, error: pgError('PGRST116') }]);

        await repository.updateGuardian('gd1', { fullName: 'Carlos V.', phone: '3157779876' });
        await repository.updateRelationship('l1', 'other');
        await repository.removeFromPlayer('l1');

        expect(args('update', 'guardians')[0][0]).toEqual({ full_name: 'Carlos V.', phone: '3157779876' });
        expect(args('update', 'guardian_links')[0][0]).toEqual({ relationship: 'other' });
        expect(Object.keys(args('update', 'guardian_links')[1][0] as object)).toEqual(['deleted_at']);
        expect(args('is', 'guardian_links')).toContainEqual(['deleted_at', null]);
        await expect(repository.removeFromPlayer('l1')).rejects.toMatchObject({ code: 'not_found' });
    });

    it('listGuardians: acudientes no eliminados con los jugadores activos que acompañan (DEC-43)', async () => {
        const row = {
            id: 'gd1',
            full_name: 'Carlos Vargas',
            phone: '3157779876',
            guardian_links: [
                { player_id: 'p1', relationship: 'father', deleted_at: null, players: player('Samuel', 'Vargas') },
                { player_id: 'p2', relationship: 'father', deleted_at: '2026-10-01T00:00:00Z', players: player('Retirado', 'Y') },
                { player_id: 'p3', relationship: 'other', deleted_at: null, players: player('Inactivo', 'X', false) }
            ]
        };
        const { repository, from, args } = setup([{ data: [row], error: null }]);

        expect(await repository.listGuardians()).toEqual([{ guardianId: 'gd1', fullName: 'Carlos Vargas', phone: '3157779876', players: [{ playerId: 'p1', name: 'Samuel V.', relationship: 'father' }] }]);
        expect(from).toHaveBeenCalledWith('guardians');
        expect(args('is')).toContainEqual(['deleted_at', null]);
    });

    it('assign: llama a assign_guardians y devuelve cuántos asignó; 42501 se traduce a not_found', async () => {
        const { repository, rpc } = setup([
            { data: 2, error: null },
            { data: null, error: pgError('42501') }
        ]);
        const assignments = [
            { guardianId: 'gd1', relationship: 'mother' },
            { guardianId: 'gd2', relationship: 'father' }
        ] as const;

        expect(await repository.assign('p2', assignments)).toBe(2);
        expect(rpc).toHaveBeenCalledWith('assign_guardians', {
            p_player_id: 'p2',
            p_assignments: [
                { guardian_id: 'gd1', relationship: 'mother' },
                { guardian_id: 'gd2', relationship: 'father' }
            ]
        });
        await expect(repository.assign('p2', assignments)).rejects.toMatchObject({ code: 'not_found' });
    });

    it('pending: un vínculo pendiente con su dispositivo y el dispositivo nuevo de un vínculo validado (spec 013)', async () => {
        const device = (id: string, status: string, created_at: string, declared_name: string) => ({ id, status, declared_name, declared_relationship: 'father', created_at });
        const { repository } = setup([
            {
                data: [
                    {
                        id: 'gl1',
                        relationship: 'father',
                        status: 'pending',
                        created_at: '2030-01-02',
                        guardians: { full_name: 'Luis', phone: '3001110001', created_at: '2030-01-02', guardian_devices: [device('d1', 'pending', '2030-01-02', 'Luis')] }
                    },
                    {
                        id: 'gl2',
                        relationship: 'mother',
                        status: 'validated',
                        created_at: '2029-01-01',
                        guardians: { full_name: 'Claudia', phone: '3009990001', created_at: '2029-01-01', guardian_devices: [device('d2', 'trusted', '2029-02-01', 'Claudia'), device('d3', 'pending', '2030-01-03', 'Otra')] }
                    }
                ],
                error: null
            }
        ]);

        const pending = await repository.pending('p1');

        expect(pending).toEqual([
            expect.objectContaining({ linkId: null, deviceId: 'd3', guardianName: 'Claudia', declaredName: 'Otra', phoneMatch: true }),
            expect.objectContaining({ linkId: 'gl1', deviceId: 'd1', guardianName: 'Luis', phoneMatch: false })
        ]);
    });

    it('review llama a la función con los dos ids (spec 013)', async () => {
        const { repository, rpc } = setup([{ data: null, error: null }]);

        await repository.review(null, 'd3', 'reject');

        expect(rpc).toHaveBeenCalledWith('review_guardian', { p_link_id: null, p_device_id: 'd3', p_decision: 'reject' });
    });

    it('listGuardians: no ofrece a quien responde por sí mismo (spec 013)', async () => {
        const row = (id: string, relationship: string) => ({ id, full_name: id, phone: '3000000000', guardian_links: [{ player_id: 'p', relationship, deleted_at: null, players: player('Max', 'J') }] });
        const { repository } = setup([{ data: [row('jugador', 'self'), row('papa', 'father')], error: null }]);

        expect((await repository.listGuardians()).map((option) => option.guardianId)).toEqual(['papa']);
    });
});
