import { TestBed } from '@angular/core/testing';
import { PlayerRepository } from '../../players/data/player.repository';
import { CallUpRepository } from '../data/call-up.repository';
import { Activity } from '../../activities/models/activity.models';
import { CallUp } from '../models/call-up.models';
import { CallUpService } from './call-up.service';
const activity: Pick<Activity, 'id' | 'startsAt'> = { id: 'a', startsAt: '2030-10-26T14:00:00.000Z' };
const callUp: CallUp = { id: 'c', activityId: 'a', deadline: null, closedAt: null, lists: [] };
describe('CallUpService', () => {
    it('carga, calcula apertura y refresca tras crear', async () => {
        const repository = { getByActivity: vi.fn().mockResolvedValue(callUp), create: vi.fn().mockResolvedValue(undefined) };
        TestBed.configureTestingModule({
            providers: [CallUpService, { provide: CallUpRepository, useValue: repository }, { provide: PlayerRepository, useValue: { listPlayers: vi.fn().mockResolvedValue([{ isActive: true }, { isActive: false }]) } }]
        });
        const service = TestBed.inject(CallUpService);
        await service.load(activity as Activity);
        expect(service.isOpen()).toBe(true);
        expect(await service.candidates()).toHaveLength(1);
        await service.create(null, [{ groupId: null, playerIds: ['p'] }]);
        expect(repository.getByActivity).toHaveBeenCalledTimes(2);
    });
    it('isOpen considera fecha límite, inicio y cierre manual', async () => {
        const repository = { getByActivity: vi.fn().mockResolvedValue(callUp) };
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [CallUpService, { provide: CallUpRepository, useValue: repository }, { provide: PlayerRepository, useValue: { listPlayers: vi.fn() } }] });
        const service = TestBed.inject(CallUpService);
        await service.load({ ...activity, startsAt: '2030-10-26T14:00:00.000Z' } as Activity);
        expect(service.isOpen()).toBe(true);
        repository.getByActivity.mockResolvedValue({ ...callUp, deadline: '2020-01-01T00:00:00.000Z' });
        await service.load(activity as Activity);
        expect(service.isOpen()).toBe(false);
        repository.getByActivity.mockResolvedValue({ ...callUp, closedAt: '2029-01-01T00:00:00.000Z' });
        await service.load(activity as Activity);
        expect(service.isOpen()).toBe(false);
    });

    it('adjust aplica quitar, mover, sumar y la fecha límite en una sola operación (CA-002 y CA-003 de HU-008)', async () => {
        const repository = {
            getByActivity: vi.fn().mockResolvedValue(callUp),
            removePlayer: vi.fn().mockResolvedValue(undefined),
            movePlayer: vi.fn().mockResolvedValue(undefined),
            addPlayers: vi.fn().mockResolvedValue(undefined),
            setDeadline: vi.fn().mockResolvedValue(undefined)
        };
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [CallUpService, { provide: CallUpRepository, useValue: repository }, { provide: PlayerRepository, useValue: { listPlayers: vi.fn() } }] });
        const service = TestBed.inject(CallUpService);
        await service.load(activity as Activity);

        await service.adjust({ removed: ['p1'], moved: [{ playerId: 'p2', listId: 'l2' }], added: [{ listId: 'l1', playerIds: ['p3'] }], deadline: null });

        expect(repository.removePlayer).toHaveBeenCalledWith('c', 'p1');
        expect(repository.movePlayer).toHaveBeenCalledWith('c', 'p2', 'l2');
        expect(repository.addPlayers).toHaveBeenCalledWith(callUp, 'l1', ['p3']);
        expect(repository.setDeadline).toHaveBeenCalledWith('c', null);
        expect(repository.getByActivity).toHaveBeenCalledTimes(2);
    });

    it('deadlineConflicts: un nuevo inicio en o antes de la fecha límite abierta', async () => {
        const repository = { getByActivity: vi.fn().mockResolvedValue({ ...callUp, deadline: '2030-10-25T23:00:00.000Z' }) };
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [CallUpService, { provide: CallUpRepository, useValue: repository }, { provide: PlayerRepository, useValue: { listPlayers: vi.fn() } }] });
        const service = TestBed.inject(CallUpService);
        await service.load(activity as Activity);

        expect(service.deadlineConflicts('2030-10-25T22:00:00.000Z')).toBe(true);
        expect(service.deadlineConflicts('2030-10-26T15:00:00.000Z')).toBe(false);
    });
});
