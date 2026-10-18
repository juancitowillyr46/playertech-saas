import { inject, Injectable } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { AuthSession, SignUpInput } from '../models/auth.models';
import { AuthRepository } from './auth.repository';

const CALLBACK_PATH = '/auth/callback';
const RESET_PASSWORD_PATH = '/auth/reset-password';

/** Errores de la recuperación que sí se muestran: no revelan si la cuenta existe. */
const VISIBLE_RESET_ERRORS = new Set(['rate_limited', 'network']);

@Injectable()
export class SupabaseAuthRepository extends AuthRepository {
    private readonly auth = inject(SUPABASE_CLIENT).auth;

    async signUp(input: SignUpInput): Promise<void> {
        const { error } = await this.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                emailRedirectTo: `${location.origin}${CALLBACK_PATH}`,
                data: {
                    academy_name: input.academyName,
                    full_name: input.fullName,
                    legal_acceptances: {
                        terms: input.legalAcceptances.terms,
                        privacy_policy: input.legalAcceptances.privacyPolicy
                    }
                }
            }
        });

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    async signIn(email: string, password: string): Promise<AuthSession> {
        const { data, error } = await this.auth.signInWithPassword({ email, password });

        return this.toSessionOrThrow(data.session, error);
    }

    async signOut(): Promise<void> {
        // Solo este navegador: cerrar sesión no cierra los otros dispositivos (HU-015).
        const { error } = await this.auth.signOut({ scope: 'local' });

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    async requestPasswordReset(email: string): Promise<void> {
        const { error } = await this.auth.resetPasswordForEmail(email, {
            redirectTo: `${location.origin}${CALLBACK_PATH}?next=${RESET_PASSWORD_PATH}`
        });

        if (error) {
            const appError = mapSupabaseError(error);

            if (VISIBLE_RESET_ERRORS.has(appError.code)) {
                throw appError;
            }
        }
    }

    async updatePassword(newPassword: string): Promise<void> {
        const { error } = await this.auth.updateUser({ password: newPassword });

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    async exchangeCodeForSession(code: string): Promise<AuthSession> {
        const { data, error } = await this.auth.exchangeCodeForSession(code);

        return this.toSessionOrThrow(data.session, error);
    }

    async getSession(): Promise<AuthSession | null> {
        const { data, error } = await this.auth.getSession();

        if (error) {
            throw mapSupabaseError(error);
        }

        return data.session ? toAuthSession(data.session) : null;
    }

    onSessionChange(listener: (session: AuthSession | null) => void): () => void {
        const { data } = this.auth.onAuthStateChange((_event, session) => listener(session ? toAuthSession(session) : null));

        return () => data.subscription.unsubscribe();
    }

    private toSessionOrThrow(session: Session | null, error: unknown): AuthSession {
        if (error || !session) {
            throw mapSupabaseError(error);
        }

        return toAuthSession(session);
    }
}

function toAuthSession(session: Session): AuthSession {
    return {
        user: {
            id: session.user.id,
            email: session.user.email ?? '',
            emailConfirmed: Boolean(session.user.email_confirmed_at)
        },
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null
    };
}
