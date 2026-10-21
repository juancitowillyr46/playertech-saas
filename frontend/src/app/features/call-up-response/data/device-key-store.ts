import { Injectable } from '@angular/core';

const STORAGE_KEY = 'playertech.devices';
const MAX_KEYS = 10;

/**
 * Llaves del dispositivo del acudiente, una por academia en la que se identificó (research R2).
 * Viven en `localStorage`; si el navegador no permite guardar (modo privado, datos borrados),
 * la lista queda vacía y la persona se identifica de nuevo.
 */
@Injectable({ providedIn: 'root' })
export class DeviceKeyStore {
    keys(): string[] {
        try {
            const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

            return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : [];
        } catch {
            return [];
        }
    }

    /** La llave más reciente va primero; se conservan hasta 10. */
    remember(key: string): void {
        const keys = [key, ...this.keys().filter((existing) => existing !== key)].slice(0, MAX_KEYS);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
        } catch {
            // Sin almacenamiento disponible: la persona volverá a identificarse.
        }
    }
}
