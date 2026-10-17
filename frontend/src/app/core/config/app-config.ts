import { InjectionToken } from '@angular/core';

/** Configuración pública de la aplicación por entorno (ADR-015, FE-03). */
export interface AppConfig {
    readonly production: boolean;
    readonly supabaseUrl: string;
    readonly supabasePublishableKey: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

const INCOMPLETE_CONFIG_MESSAGE = 'Configuración de Supabase incompleta: revisa src/environments';

/**
 * Falla al iniciar si la conexión con Supabase falta o es inválida (FR-007),
 * en lugar de producir errores dispersos más adelante.
 */
export function validateAppConfig(config: AppConfig): AppConfig {
    if (!config.supabasePublishableKey.trim() || !isHttpUrl(config.supabaseUrl)) {
        throw new Error(INCOMPLETE_CONFIG_MESSAGE);
    }

    return config;
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);

        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
