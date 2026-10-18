import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, AppConfig } from '../config/app-config';
import { InactivityService } from './inactivity.service';

const KEY = 'playertech.lastActivityAt';
const MINUTE = 60_000;
const START = new Date('2026-10-17T10:00:00Z').getTime();

function createService(): InactivityService {
    TestBed.configureTestingModule({
        providers: [{ provide: APP_CONFIG, useValue: { sessionInactivityMinutes: 60 } as AppConfig }]
    });

    return TestBed.inject(InactivityService);
}

function setup() {
    const service = createService();
    const onExpire = vi.fn();
    const authenticated = signal(true);

    service.start(onExpire, authenticated);
    TestBed.tick();

    return { service, onExpire, authenticated };
}

const advance = (ms: number) => vi.advanceTimersByTime(ms);
const interact = () => window.dispatchEvent(new Event('pointerdown'));

describe('InactivityService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.setSystemTime(START);
    });

    afterEach(() => {
        vi.useRealTimers();
        localStorage.clear();
    });

    it('cierra la sesión a los 60 minutos sin interacción (HU-015 CA-003)', () => {
        const { onExpire } = setup();

        advance(60 * MINUTE);
        expect(onExpire).not.toHaveBeenCalled();

        advance(MINUTE);
        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('cada interacción reinicia el tiempo (HU-015 CA-004)', () => {
        const { onExpire } = setup();

        advance(50 * MINUTE);
        interact();
        advance(50 * MINUTE);

        expect(onExpire).not.toHaveBeenCalled();
    });

    it('registra la hora como mucho una vez cada 5 s', () => {
        setup();
        const setItem = vi.spyOn(Storage.prototype, 'setItem');

        advance(10_000);
        interact();
        advance(1_000);
        interact();
        interact();

        expect(setItem).toHaveBeenCalledTimes(1);
        setItem.mockRestore();
    });

    it('al volver de segundo plano con el tiempo vencido cierra la sesión', () => {
        const { onExpire } = setup();

        // El celular congela los temporizadores: el reloj avanza sin que se disparen.
        vi.setSystemTime(START + 2 * 60 * MINUTE);
        document.dispatchEvent(new Event('visibilitychange'));

        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('la interacción en otra pestaña mantiene la sesión (FR-004)', () => {
        const { onExpire } = setup();

        advance(50 * MINUTE);
        localStorage.setItem(KEY, String(Date.now()));
        advance(50 * MINUTE);

        expect(onExpire).not.toHaveBeenCalled();
    });

    it('una interacción después de vencer cierra en lugar de reiniciar el tiempo', () => {
        const { onExpire } = setup();

        vi.setSystemTime(START + 61 * MINUTE);
        interact();

        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('considera vencida una hora guardada en el futuro (reloj cambiado)', () => {
        const service = createService();

        localStorage.setItem(KEY, String(START + 10 * MINUTE));

        expect(service.isExpired()).toBe(true);
    });

    it('sin hora guardada la sesión está vigente', () => {
        expect(createService().isExpired()).toBe(false);
    });

    it('sin sesión deja de vigilar y borra la hora guardada', () => {
        const { onExpire, authenticated } = setup();

        authenticated.set(false);
        TestBed.tick();
        advance(2 * 60 * MINUTE);

        expect(localStorage.getItem(KEY)).toBeNull();
        expect(onExpire).not.toHaveBeenCalled();
    });

    it('solo cierra una vez aunque haya varias comprobaciones vencidas', () => {
        const { onExpire } = setup();

        advance(3 * 60 * MINUTE);
        window.dispatchEvent(new Event('focus'));

        expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('sin almacenamiento disponible sigue funcionando en memoria', () => {
        const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('bloqueado');
        });
        const { onExpire } = setup();

        advance(61 * MINUTE);

        expect(onExpire).toHaveBeenCalledTimes(1);
        getItem.mockRestore();
        setItem.mockRestore();
    });
});
