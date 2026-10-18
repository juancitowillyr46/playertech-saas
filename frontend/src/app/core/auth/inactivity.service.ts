import { effect, inject, Injectable, Injector, Signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

const STORAGE_KEY = 'playertech.lastActivityAt';
const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const;
const WRITE_INTERVAL_MS = 5_000;
const CHECK_INTERVAL_MS = 30_000;
const CLOCK_TOLERANCE_MS = 60_000;

/**
 * Cierre de sesión por inactividad (DEC-28, ADR-014, research R2 a R5 de la spec 005).
 *
 * Compara la hora actual con la de la última interacción en lugar de confiar en un
 * temporizador, porque el navegador del celular congela los temporizadores con la
 * pantalla bloqueada. La hora se guarda en `localStorage`, que comparten las pestañas.
 * No conoce `AuthService`: recibe el cierre y la señal de sesión en `start()`.
 */
@Injectable({ providedIn: 'root' })
export class InactivityService {
    private readonly injector = inject(Injector);
    private readonly limitMs = inject(APP_CONFIG).sessionInactivityMinutes * 60_000;
    private memoryValue: number | null = null;
    private lastWrite = 0;
    private expired = false;
    private onExpire: () => void = () => undefined;
    private stopWatching: (() => void) | null = null;

    /** Arranca la vigilancia: activa con sesión, apagada sin ella. */
    start(onExpire: () => void, isAuthenticated: Signal<boolean>): void {
        this.onExpire = onExpire;
        effect(() => (isAuthenticated() ? this.watch() : this.unwatch()), { injector: this.injector });
    }

    /** true si la última interacción guardada ya venció. No modifica nada. */
    isExpired(): boolean {
        const last = this.read();

        if (last === null) {
            return false;
        }

        const now = Date.now();

        // Una hora en el futuro solo es posible con el reloj cambiado: no se le da crédito.
        return now - last > this.limitMs || last > now + CLOCK_TOLERANCE_MS;
    }

    markActivity(): void {
        const now = Date.now();

        this.lastWrite = now;
        this.write(now);
    }

    private watch(): void {
        if (this.stopWatching) {
            return;
        }

        this.expired = false;

        if (this.read() === null) {
            this.markActivity();
        }

        const onInteraction = () => this.onInteraction();
        const check = () => this.check();
        const onVisibility = () => document.visibilityState === 'visible' && this.check();
        const options: AddEventListenerOptions = { passive: true, capture: true };

        INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, onInteraction, options));
        document.addEventListener('scroll', onInteraction, options);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', check);
        window.addEventListener('pageshow', check);
        const interval = setInterval(check, CHECK_INTERVAL_MS);

        this.stopWatching = () => {
            INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, onInteraction, options));
            document.removeEventListener('scroll', onInteraction, options);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', check);
            window.removeEventListener('pageshow', check);
            clearInterval(interval);
        };

        this.check();
    }

    private unwatch(): void {
        this.stopWatching?.();
        this.stopWatching = null;
        this.lastWrite = 0;
        this.remove();
    }

    private onInteraction(): void {
        // Si ya venció (por ejemplo, un toque justo al volver), no se le da una hora más.
        if (this.isExpired()) {
            this.expire();
        } else if (Date.now() - this.lastWrite >= WRITE_INTERVAL_MS) {
            this.markActivity();
        }
    }

    private check(): void {
        if (this.isExpired()) {
            this.expire();
        }
    }

    private expire(): void {
        if (!this.expired) {
            this.expired = true;
            this.onExpire();
        }
    }

    // Sin almacenamiento (navegación privada estricta), el valor vive en memoria.
    private read(): number | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const value = stored === null ? null : Number(stored);

            return value !== null && Number.isFinite(value) ? value : null;
        } catch {
            return this.memoryValue;
        }
    }

    private write(value: number): void {
        this.memoryValue = value;

        try {
            localStorage.setItem(STORAGE_KEY, String(value));
        } catch {
            // Se conserva el valor en memoria.
        }
    }

    private remove(): void {
        this.memoryValue = null;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Nada que borrar fuera de la memoria.
        }
    }
}
