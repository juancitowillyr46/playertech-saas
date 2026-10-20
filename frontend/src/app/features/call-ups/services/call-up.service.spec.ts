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
});
