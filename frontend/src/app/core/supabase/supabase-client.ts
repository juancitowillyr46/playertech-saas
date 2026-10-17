import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../config/app-config';
import { Database } from './database.types';

export type PlayerTechSupabaseClient = SupabaseClient<Database>;

/** Cliente único de Supabase. Solo lo usan las implementaciones `supabase-*` (ADR-002). */
export const SUPABASE_CLIENT = new InjectionToken<PlayerTechSupabaseClient>('SUPABASE_CLIENT');

export function createSupabaseClient(config: AppConfig): PlayerTechSupabaseClient {
    return createClient<Database>(config.supabaseUrl, config.supabasePublishableKey, {
        auth: {
            // FE-09: intercambio de código con verificación. El código lo
            // intercambia explícitamente la pantalla /auth/callback (research R4, R7).
            flowType: 'pkce',
            detectSessionInUrl: false,
            persistSession: true,
            autoRefreshToken: true
        }
    });
}
