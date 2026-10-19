import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { MockResult, pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { PlayerInput } from '../models/player.models';
import { GroupsNotSavedError } from './player.repository';
import { SupabasePlayerRepository } from './supabase-player.repository';

const ROW = {
    id: 'p1',
    first_names: 'Samuel',
    last_names: 'Vargas',
    nickname: 'Samu',
    birth_date: '2014-05-10',
    phone: '3001234567',
    is_active: true,
    group_members: [{ groups: { id: 'g2', name: 'Torneo' } }, { groups: { id: 'g1', name: 'Sub-12' } }],
    guardian_links: [
        { status: 'validated', deleted_at: null },
        { status: 'validated', deleted_at: '2026-10-01T00:00:00Z' },
        { status: 'pending', deleted_at: null }
    ]
};
const INPUT: PlayerInput = { firstNames: 'Samuel', lastNames: 'Vargas', nickname: null, birthDate: '2014-05-10', phone: null, groupIds: ['g1', 'g3'] };
const OK = { data: { id: 'p1' }, error: null };

function setup(results: MockResult[], academyId: string | null = 'academy-a') {
    const mock = supabaseClientMock(results);

    TestBed.configureTestingModule({
        providers: [
            SupabasePlayerRepository,
            { provide: SUPABASE_CLIENT, useValue: mock.client },
            { provide: AcademyContextService, useValue: { academy: signal(academyId ? { id: academyId, name: 'A', logoFileId: null } : undefined) } }
        ]
    });

    return { repository: TestBed.inject(SupabasePlayerRepository), ...mock };
}

describe('SupabasePlayerRepository', () => {
    it('listPlayers: una consulta con grupos y acudientes, sin eliminados ni filtro de academia (RLS)', async () => {
        const { repository, from, args } = setup([{ data: [ROW], error: null }]);

        const [player] = await repository.listPlayers();

        expect(from).toHaveBeenCalledTimes(1);
        expect(String(args('select')[0][0])).toContain('group_members(groups(id, name))');
        expect(args('is')).toContainEqual(['deleted_at', null]);
        expect(args('eq')).toHaveLength(0);
        expect(player).toEqual({
            id: 'p1',
            firstNames: 'Samuel',
            lastNames: 'Vargas',
            nickname: 'Samu',
            birthDate: '2014-05-10',
            phone: '3001234567',
            isActive: true,
            groups: [
                { id: 'g1', name: 'Sub-12' },
                { id: 'g2', name: 'Torneo' }
            ],
            guardianCount: 1
        });
    });

    it('getPlayer: el jugador inexistente rechaza con not_found', async () => {
        const { repository } = setup([{ data: null, error: pgError('PGRST116') }]);

        await expect(repository.getPlayer('x')).rejects.toMatchObject({ code: 'not_found' });
    });

    it('findByIdentity: llama a la función y devuelve el id o null', async () => {
        const { repository, rpc } = setup([
            { data: [{ id: 'p1' }], error: null },
            { data: [], error: null }
        ]);

        expect(await repository.findByIdentity('Samuel', 'Vargas', '2014-05-10')).toBe('p1');
        expect(await repository.findByIdentity('Otro', 'Vargas', '2014-05-10')).toBeNull();
        expect(rpc).toHaveBeenCalledWith('find_player_by_identity', { p_first_names: 'Samuel', p_last_names: 'Vargas', p_birth_date: '2014-05-10' });
    });

    it('createPlayer: inserta con la academia del contexto, sin created_by, y luego sus grupos', async () => {
        const { repository, args } = setup([OK, { data: null, error: null }]);

        expect(await repository.createPlayer(INPUT)).toBe('p1');
        expect(args('insert', 'players')[0][0]).toEqual({ academy_id: 'academy-a', first_names: 'Samuel', last_names: 'Vargas', nickname: null, birth_date: '2014-05-10', phone: null });
        expect(args('insert', 'group_members')[0][0]).toEqual([
            { academy_id: 'academy-a', group_id: 'g1', player_id: 'p1' },
            { academy_id: 'academy-a', group_id: 'g3', player_id: 'p1' }
        ]);
    });

    it('createPlayer: sin academia en el contexto rechaza con forbidden sin llamar a Supabase', async () => {
        const { repository, from } = setup([], null);

        await expect(repository.createPlayer(INPUT)).rejects.toMatchObject({ code: 'forbidden' });
        expect(from).not.toHaveBeenCalled();
    });

    it('createPlayer: el duplicado (23505) rechaza con duplicate', async () => {
        const { repository } = setup([{ data: null, error: pgError('23505') }]);

        await expect(repository.createPlayer(INPUT)).rejects.toMatchObject({ code: 'duplicate' });
    });

    it('createPlayer: si fallan los grupos, rechaza con GroupsNotSavedError', async () => {
        const { repository } = setup([OK, { data: null, error: pgError('42501') }]);

        await expect(repository.createPlayer(INPUT)).rejects.toBeInstanceOf(GroupsNotSavedError);
    });

    it('updatePlayer: actualiza el no eliminado e inserta y quita grupos según lo elegido', async () => {
        const { repository, args } = setup([OK, { data: [{ group_id: 'g1' }, { group_id: 'g2' }], error: null }, { data: null, error: null }, { data: null, error: null }]);

        await repository.updatePlayer('p1', INPUT);

        expect(args('eq', 'players')).toContainEqual(['id', 'p1']);
        expect(args('is', 'players')).toContainEqual(['deleted_at', null]);
        expect(args('insert', 'group_members')[0][0]).toEqual([{ academy_id: 'academy-a', group_id: 'g3', player_id: 'p1' }]);
        expect(args('in', 'group_members')[0]).toEqual(['group_id', ['g2']]);
    });

    it('setActive y deletePlayer envían solo su columna; el formato o la regla violada rechaza con rule_violation', async () => {
        const { repository, args } = setup([OK, OK, { data: null, error: pgError('23514') }]);

        await repository.setActive('p1', false);
        await repository.deletePlayer('p1');

        expect(args('update', 'players')[0][0]).toEqual({ is_active: false });
        expect(Object.keys(args('update', 'players')[1][0] as object)).toEqual(['deleted_at']);
        await expect(repository.setActive('p1', true)).rejects.toMatchObject({ code: 'rule_violation' });
    });
});
