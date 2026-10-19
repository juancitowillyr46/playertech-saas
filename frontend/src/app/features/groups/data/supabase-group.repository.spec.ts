import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { MockResult, pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { SupabaseGroupRepository } from './supabase-group.repository';

const player = (id: string, first_names: string, is_active = true, deleted_at: string | null = null) => ({ id, first_names, last_names: 'Vargas', nickname: null, is_active, deleted_at });

const GROUP = {
    id: 'g1',
    name: 'Sub-12',
    group_members: [{ players: player('p2', 'Tomás') }, { players: player('p1', 'Samuel') }, { players: player('p3', 'Inactivo', false) }, { players: player('p4', 'Eliminado', true, '2026-10-01T00:00:00Z') }]
};

function setup(results: MockResult[]) {
    const mock = supabaseClientMock(results);

    TestBed.configureTestingModule({
        providers: [
            SupabaseGroupRepository,
            { provide: SUPABASE_CLIENT, useValue: mock.client },
            { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a', name: 'A', logoFileId: null }) } }
        ]
    });

    return { repository: TestBed.inject(SupabaseGroupRepository), ...mock };
}

describe('SupabaseGroupRepository', () => {
    it('listGroups: no eliminados, ordenados, con el conteo de activos no eliminados', async () => {
        const { repository, args } = setup([{ data: [{ ...GROUP, id: 'g2', name: 'Sub-10', group_members: [] }, GROUP], error: null }]);

        expect(await repository.listGroups()).toEqual([
            { id: 'g2', name: 'Sub-10', activePlayerCount: 0 },
            { id: 'g1', name: 'Sub-12', activePlayerCount: 2 }
        ]);
        expect(args('is')).toContainEqual(['deleted_at', null]);
    });

    it('getGroup: integrantes no eliminados, con su estado, ordenados por nombre', async () => {
        const { repository } = setup([{ data: GROUP, error: null }]);

        const group = await repository.getGroup('g1');

        expect(group.members.map((member) => [member.firstNames, member.isActive])).toEqual([
            ['Inactivo', false],
            ['Samuel', true],
            ['Tomás', true]
        ]);
    });

    it('createGroup con la academia del contexto; nombre repetido rechaza con duplicate', async () => {
        const { repository, args } = setup([
            { data: null, error: null },
            { data: null, error: pgError('23505') }
        ]);

        await repository.createGroup('Sub-12');

        expect(args('insert')[0][0]).toEqual({ academy_id: 'academy-a', name: 'Sub-12' });
        await expect(repository.createGroup('sub-12')).rejects.toMatchObject({ code: 'duplicate' });
    });

    it('deleteGroup: solo deleted_at (la base de datos quita los integrantes)', async () => {
        const { repository, args, from } = setup([{ data: { id: 'g1' }, error: null }]);

        await repository.deleteGroup('g1');

        expect(Object.keys(args('update')[0][0] as object)).toEqual(['deleted_at']);
        expect(from).not.toHaveBeenCalledWith('group_members');
    });

    it('addMembers y removeMember sobre group_members', async () => {
        const { repository, args } = setup([
            { data: null, error: null },
            { data: null, error: null }
        ]);

        await repository.addMembers('g1', ['p1', 'p2']);
        await repository.removeMember('g1', 'p1');

        expect(args('insert', 'group_members')[0][0]).toEqual([
            { academy_id: 'academy-a', group_id: 'g1', player_id: 'p1' },
            { academy_id: 'academy-a', group_id: 'g1', player_id: 'p2' }
        ]);
        expect(args('delete', 'group_members')).toHaveLength(1);
        expect(args('eq', 'group_members')).toEqual([
            ['group_id', 'g1'],
            ['player_id', 'p1']
        ]);
    });

    it('listActivePlayers: solo activos y no eliminados', async () => {
        const { repository, args } = setup([{ data: [player('p1', 'Samuel')], error: null }]);

        expect(await repository.listActivePlayers()).toHaveLength(1);
        expect(args('eq')).toContainEqual(['is_active', true]);
        expect(args('is')).toContainEqual(['deleted_at', null]);
    });
});
