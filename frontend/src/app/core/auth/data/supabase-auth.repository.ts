import { inject, Injectable } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { AppError } from '../../errors/app-error';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { AuthSession, SignUpInput } from '../models/auth.models';
import { AuthRepository } from './auth.repository';

const CALLBACK_PATH = '/auth/callback';
const RESET_PASSWORD_PATH = '/auth/reset-password';

/** Errores de la recuperación y del reenvío que sí se muestran: no revelan si la cuenta existe. */
const VISIBLE_EMAIL_ERRORS = new Set(['rate_limited', 'network']);

@Injectable()
export class SupabaseAuthRepository extends AuthRepository {
    private readonly auth = inject(SUPABASE_CLIENT).auth;

    async signUp(input: SignUpInput): Promise<void> {
        const { data, error } = await this.auth.signUp({
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

        // Correo ya registrado (HU-014 CA-005, excepción a DEC-12 del 2026-10-18). Auth lo informa
        // como error o, con la verificación de correo activa, como una cuenta sin identidades.
        if ((error as { code?: string } | null)?.code === 'user_already_exists' || data?.user?.identities?.length === 0) {
            throw new AppError('email_taken');
        }

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

        throwIfVisible(error);
    }

    async resendVerification(email: string): Promise<void> {
        const { error } = await this.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}${CALLBACK_PATH}` } });

        throwIfVisible(error);
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

/** Solo lanza los errores que no revelan si la cuenta existe (DEC-12); los demás se resuelven como éxito. */
function throwIfVisible(error: Parameters<typeof mapSupabaseError>[0] | null): void {
    if (error) {
        const appError = mapSupabaseError(error);

        if (VISIBLE_EMAIL_ERRORS.has(appError.code)) {
            throw appError;
        }
    }
}
