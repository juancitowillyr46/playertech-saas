import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { GroupRepository } from '../data/group.repository';
import { GroupDetail } from '../models/group.models';
import { GroupsService } from './groups.service';

const member = (playerId: string, firstNames: string, isActive = true) => ({ playerId, firstNames, lastNames: 'Vargas', nickname: null, isActive });
const GROUP: GroupDetail = { id: 'g1', name: 'Sub-12', activePlayerCount: 1, members: [member('p1', 'Samuel')] };

function setup(overrides: Partial<Record<keyof GroupRepository, ReturnType<typeof vi.fn>>> = {}) {
    const repository = {
        listGroups: vi.fn().mockResolvedValue([{ id: 'g1', name: 'Sub-12', activePlayerCount: 1 }]),
        getGroup: vi.fn().mockResolvedValue(GROUP),
        listActivePlayers: vi.fn().mockResolvedValue([member('p1', 'Samuel'), member('p2', 'Tomás')]),
        createGroup: vi.fn().mockResolvedValue(undefined),
        renameGroup: vi.fn().mockResolvedValue(undefined),
        deleteGroup: vi.fn().mockResolvedValue(undefined),
        addMembers: vi.fn().mockResolvedValue(undefined),
        removeMember: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };

    TestBed.configureTestingModule({ providers: [GroupsService, { provide: GroupRepository, useValue: repository }] });

    return { service: TestBed.inject(GroupsService), repository };
}

describe('GroupsService', () => {
    it('listado: ready con grupos, empty sin ellos', async () => {
        const { service, repository } = setup();

        await service.load();
        expect(service.status()).toBe('ready');

        repository.listGroups.mockResolvedValue([]);
        await service.load();
        expect(service.status()).toBe('empty');
    });

    it('isNameTaken sin distinguir mayúsculas ni espacios, excluyendo el grupo indicado', async () => {
        const { service } = setup();
        await service.load();

        expect(service.isNameTaken('  sub-12 ')).toBe(true);
        expect(service.isNameTaken('Sub-12', 'g1')).toBe(false);
        expect(service.isNameTaken('Sub-10')).toBe(false);
    });

    it('create recorta el nombre y relee el listado', async () => {
        const { service, repository } = setup();
        await service.load();

        await service.create('  Sub-10 ');

        expect(repository.createGroup).toHaveBeenCalledWith('Sub-10');
        expect(repository.listGroups).toHaveBeenCalledTimes(2);
    });

    it('grupo: carga integrantes; candidatos son los activos que no están; agregar y quitar releen el grupo', async () => {
        const { service, repository } = setup();
        await service.loadGroup('g1');

        expect(service.group()).toEqual(GROUP);
        expect((await service.candidates()).map((player) => player.playerId)).toEqual(['p2']);

        await service.addMembers(['p2']);
        await service.removeMember('p1');

        expect(repository.addMembers).toHaveBeenCalledWith('g1', ['p2']);
        expect(repository.removeMember).toHaveBeenCalledWith('g1', 'p1');
        expect(repository.getGroup).toHaveBeenCalledTimes(3);
    });

    it('un grupo inexistente pasa a not_found', async () => {
        const { service } = setup({ getGroup: vi.fn().mockRejectedValue(new AppError('not_found')) });

        await service.loadGroup('x');

        expect(service.status()).toBe('not_found');
    });

    it('remove no relee (la página vuelve al listado)', async () => {
        const { service, repository } = setup();
        await service.loadGroup('g1');

        await service.remove('g1');

        expect(repository.deleteGroup).toHaveBeenCalledWith('g1');
        expect(repository.getGroup).toHaveBeenCalledTimes(1);
    });
});
