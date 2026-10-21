import { TestBed } from '@angular/core/testing';
import { DeviceKeyStore } from '../data/device-key-store';
import { PublicCallUpRepository } from '../data/public-call-up.repository';
import { MyPlayer, PublicCallUp, PublicCallUpError } from '../models/public-call-up.models';
import { CallUpResponseService } from './call-up-response.service';

const SAMUEL: MyPlayer = { playerId: 'p1', name: 'Samuel V.', nickname: 'Samu', removed: false, answer: null, reason: null, reasonText: null, changesLeft: 3 };
const callUp = (overrides: Partial<PublicCallUp> = {}): PublicCallUp => ({
    status: 'open',
    academy: 'Academia C',
    activity: null,
    deadline: null,
    roster: [{ playerId: 'p1', name: 'Samuel V.', nickname: 'Samu' }],
    mine: [],
    deviceKey: null,
    ...overrides
});

function setup(loads: PublicCallUp[], keys: string[] = []) {
    const repository = {
        load: vi.fn(),
        identify: vi.fn().mockResolvedValue('llave-nueva'),
        respond: vi.fn().mockResolvedValue({ answer: 'no', changesLeft: 2 })
    };
    loads.forEach((value) => repository.load.mockResolvedValueOnce(value));
    const store = { keys: vi.fn(() => keys), remember: vi.fn() };
    TestBed.configureTestingModule({ providers: [CallUpResponseService, { provide: PublicCallUpRepository, useValue: repository }, { provide: DeviceKeyStore, useValue: store }] });

    return { service: TestBed.inject(CallUpResponseService), repository, store };
}

describe('CallUpResponseService', () => {
    it('elige el estado según el enlace y el dispositivo', async () => {
        const cases: [PublicCallUp, string][] = [
            [callUp(), 'choose'],
            [callUp({ mine: [SAMUEL], deviceKey: 'k' }), 'respond'],
            [callUp({ status: 'closed', roster: [] }), 'readonly'],
            [callUp({ status: 'cancelled', roster: [] }), 'readonly'],
            [callUp({ status: 'not_found', roster: [] }), 'not_found']
        ];

        for (const [value, state] of cases) {
            TestBed.resetTestingModule();
            const { service } = setup([value]);
            await service.load('t');
            expect(service.state()).toBe(state);
        }
    });

    it('al identificarse guarda la llave y recarga para responder', async () => {
        const { service, repository, store } = setup([callUp(), callUp({ mine: [SAMUEL], deviceKey: 'llave-nueva' })], []);
        await service.load('t');
        service.choose(callUp().roster[0]);
        expect(service.state()).toBe('identify');

        await service.identify({ playerId: 'p1', fullName: 'Carlos', phone: '3001112233', relationship: 'father', consent: true });

        expect(repository.identify).toHaveBeenCalledWith('t', expect.objectContaining({ playerId: 'p1' }), null);
        expect(store.remember).toHaveBeenCalledWith('llave-nueva');
        expect(service.state()).toBe('respond');
    });

    it('responde con la llave reconocida y actualiza solo ese jugador', async () => {
        const { service, repository } = setup([callUp({ mine: [SAMUEL], deviceKey: 'k' })], ['k']);
        await service.load('t');

        const updated = await service.respond('p1', { answer: 'no', reason: 'illness', reasonText: null });

        expect(repository.respond).toHaveBeenCalledWith('t', 'k', 'p1', { answer: 'no', reason: 'illness', reasonText: null });
        expect(updated).toMatchObject({ answer: 'no', reason: 'illness', changesLeft: 2 });
        expect(repository.load).toHaveBeenCalledTimes(1);
    });

    it('«¿Respondes por alguien más?» vuelve a la lista y conserva la llave', async () => {
        const { service, repository } = setup([callUp({ mine: [SAMUEL], deviceKey: 'k' }), callUp({ mine: [SAMUEL], deviceKey: 'k' })], ['k']);
        await service.load('t');

        service.addSomeone();
        expect(service.state()).toBe('choose');
        service.choose({ playerId: 'p2', name: 'Tomás V.', nickname: null });
        await service.identify({ playerId: 'p2', fullName: null, phone: null, relationship: 'father', consent: false });

        expect(repository.identify).toHaveBeenCalledWith('t', expect.objectContaining({ playerId: 'p2' }), 'k');
    });

    it('si la convocatoria cerró al responder, recarga en solo lectura y avisa', async () => {
        const { service, repository } = setup([callUp({ mine: [SAMUEL], deviceKey: 'k' }), callUp({ status: 'closed', mine: [SAMUEL], deviceKey: 'k', roster: [] })], ['k']);
        repository.respond.mockRejectedValueOnce(new PublicCallUpError('call_up_closed'));
        await service.load('t');

        await expect(service.respond('p1', { answer: 'yes', reason: null, reasonText: null })).rejects.toBeInstanceOf(PublicCallUpError);
        expect(service.state()).toBe('readonly');
    });
});
