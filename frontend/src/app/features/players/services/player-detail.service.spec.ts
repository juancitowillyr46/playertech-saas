import { noticesMock } from '../../../testing/notices-mock';
import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { LegalDocumentsRepository } from '../../../core/legal/data/legal-documents.repository';
import { GuardianRepository } from '../data/guardian.repository';
import { PlayerRepository } from '../data/player.repository';
import { Guardian, PlayerSummary } from '../models/player.models';
import { PlayerDetailService } from './player-detail.service';

const PLAYER: PlayerSummary = { id: 'p1', firstNames: 'Samuel', lastNames: 'Vargas', nickname: null, birthDate: '2014-05-10', phone: null, isActive: true, groups: [], guardianCount: 1 };
const GUARDIAN: Guardian = { linkId: 'l1', guardianId: 'gd1', fullName: 'Carlos Vargas', phone: '3157779876', relationship: 'father', otherPlayers: [] };

function setup(player: Partial<Record<keyof PlayerRepository, ReturnType<typeof vi.fn>>> = {}) {
    const players = {
        getPlayer: vi.fn().mockResolvedValue(PLAYER),
        listGroups: vi.fn().mockResolvedValue([]),
        listPlayers: vi.fn().mockResolvedValue([PLAYER, { ...PLAYER, id: 'p2', guardianCount: 2 }, { ...PLAYER, id: 'p3', guardianCount: 0 }]),
        updatePlayer: vi.fn().mockResolvedValue(undefined),
        setActive: vi.fn().mockResolvedValue(undefined),
        deletePlayer: vi.fn().mockResolvedValue(undefined),
        ...player
    };
    const guardians = {
        listByPlayer: vi.fn().mockResolvedValue([GUARDIAN]),
        findByPhone: vi.fn().mockResolvedValue(null),
        addToPlayer: vi.fn().mockResolvedValue({ guardianExisted: false, guardianName: 'Diana' }),
        updateGuardian: vi.fn().mockResolvedValue(undefined),
        updateRelationship: vi.fn().mockResolvedValue(undefined),
        removeFromPlayer: vi.fn().mockResolvedValue(undefined),
        listGuardians: vi.fn().mockResolvedValue([
            { guardianId: 'gd1', fullName: 'Carlos Vargas', phone: '3157779876', players: [{ playerId: 'p1', name: 'Samuel V.', relationship: 'father' }] },
            { guardianId: 'gd2', fullName: 'Diana Gómez', phone: '3105551234', players: [] }
        ]),
        assign: vi.fn().mockResolvedValue(2),
        pending: vi.fn().mockResolvedValue([]),
        review: vi.fn().mockResolvedValue(undefined)
    };

    TestBed.configureTestingModule({
        providers: [
            PlayerDetailService,
            { provide: PlayerRepository, useValue: players },
            noticesMock(),
            { provide: GuardianRepository, useValue: guardians },
            {
                provide: LegalDocumentsRepository,
                useValue: { getCurrent: vi.fn().mockResolvedValue({ privacyPolicy: { type: 'privacy_policy', version: '2026-10-v2', url: '/legal/privacy_policy/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' } }) }
            }
        ]
    });

    return { service: TestBed.inject(PlayerDetailService), players, guardians };
}

describe('PlayerDetailService', () => {
    it('carga el jugador, sus acudientes y los grupos', async () => {
        const { service } = setup();

        await service.load('p1');

        expect(service.status()).toBe('ready');
        expect(service.player()).toEqual(PLAYER);
        expect(service.guardians()).toEqual([GUARDIAN]);
    });

    it('un jugador inexistente pasa a not_found', async () => {
        const { service } = setup({ getPlayer: vi.fn().mockRejectedValue(new AppError('not_found')) });

        await service.load('x');

        expect(service.status()).toBe('not_found');
    });

    it('update limpia lo escrito y relee la ficha', async () => {
        const { service, players } = setup();
        await service.load('p1');

        await service.update({ firstNames: ' Samuel ', lastNames: 'Vargas', nickname: '', birthDate: '2014-05-10', phone: '', groupIds: [] });

        expect(players.updatePlayer).toHaveBeenCalledWith('p1', { firstNames: 'Samuel', lastNames: 'Vargas', nickname: null, birthDate: '2014-05-10', phone: null, groupIds: [] });
        expect(players.getPlayer).toHaveBeenCalledTimes(2);
    });

    it('remove no relee la ficha (la página vuelve al listado)', async () => {
        const { service, players } = setup();
        await service.load('p1');

        await service.remove();

        expect(players.deletePlayer).toHaveBeenCalledWith('p1');
        expect(players.getPlayer).toHaveBeenCalledTimes(1);
    });

    it('addGuardian normaliza el celular; findGuardianByPhone también', async () => {
        const { service, guardians } = setup();
        await service.load('p1');

        await service.addGuardian({ fullName: ' Diana ', phone: '310 555 1234', relationship: 'mother' });
        await service.findGuardianByPhone('310-555-1234');

        expect(guardians.addToPlayer).toHaveBeenCalledWith('p1', { fullName: 'Diana', phone: '3105551234', relationship: 'mother' });
        expect(guardians.findByPhone).toHaveBeenCalledWith('3105551234');
    });

    it('updateGuardian solo envía lo que cambió', async () => {
        const { service, guardians } = setup();
        await service.load('p1');

        await service.updateGuardian(GUARDIAN, { fullName: 'Carlos Vargas', phone: '3157779876', relationship: 'other' });

        expect(guardians.updateGuardian).not.toHaveBeenCalled();
        expect(guardians.updateRelationship).toHaveBeenCalledWith('l1', 'other');
    });

    it('si el jugador desapareció durante una operación, pasa a not_found y propaga el error', async () => {
        const { service, players } = setup();
        await service.load('p1');
        players.setActive.mockRejectedValue(new AppError('not_found'));
        players.getPlayer.mockRejectedValue(new AppError('not_found'));

        await expect(service.setActive(false)).rejects.toMatchObject({ code: 'not_found' });
        expect(service.status()).toBe('not_found');
    });

    it('privacyPolicy devuelve la política vigente', async () => {
        const { service } = setup();

        expect((await service.privacyPolicy())?.url).toBe('/legal/privacy_policy/2026-10-v2.html');
    });

    it('guardianOptions marca los que ya son de este jugador (CA-004 de HU-035)', async () => {
        const { service } = setup();
        await service.load('p1');

        expect((await service.guardianOptions()).map((option) => [option.guardianId, option.alreadyLinked])).toEqual([
            ['gd1', true],
            ['gd2', false]
        ]);
    });

    it('siblings: otros jugadores con acudientes', async () => {
        const { service } = setup();
        await service.load('p1');

        expect((await service.siblings()).map((player) => player.id)).toEqual(['p2']);
    });

    it('assignGuardians asigna, relee la ficha y devuelve cuántos', async () => {
        const { service, guardians } = setup();
        await service.load('p1');

        expect(await service.assignGuardians([{ guardianId: 'gd2', relationship: 'mother' }])).toBe(2);
        expect(guardians.assign).toHaveBeenCalledWith('p1', [{ guardianId: 'gd2', relationship: 'mother' }]);
        expect(guardians.listByPlayer).toHaveBeenCalledTimes(2);
    });
});
