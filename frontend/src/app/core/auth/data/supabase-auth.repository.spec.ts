import { TestBed } from '@angular/core/testing';
import { AppError } from '../../errors/app-error';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { SupabaseAuthRepository } from './supabase-auth.repository';

const supabaseSession = {
    access_token: 'token',
    expires_at: 1_800_000_000,
    user: { id: 'user-1', email: 'owner@playertech.test', email_confirmed_at: '2026-10-16T00:00:00Z' }
};

function authError(code: string): Error {
    return Object.assign(new Error(code), { name: 'AuthApiError', code, status: 400 });
}

function createAuthMock() {
    return {
        signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { session: supabaseSession }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
        resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: supabaseSession }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    };
}

describe('SupabaseAuthRepository', () => {
    let auth: ReturnType<typeof createAuthMock>;
    let repository: SupabaseAuthRepository;

    beforeEach(() => {
        auth = createAuthMock();
        TestBed.configureTestingModule({
            providers: [SupabaseAuthRepository, { provide: SUPABASE_CLIENT, useValue: { auth } }]
        });
        repository = TestBed.inject(SupabaseAuthRepository);
    });

    it('registra con los metadatos del contrato de la spec 001 y el retorno a /auth/callback', async () => {
        await repository.signUp({
            email: 'owner@playertech.test',
            password: 'Segura-2026',
            academyName: 'Academia Norte',
            fullName: 'Ana Pérez',
            legalAcceptances: { terms: '2026-10-v1', privacyPolicy: '2026-10-v1' }
        });

        expect(auth.signUp).toHaveBeenCalledWith({
            email: 'owner@playertech.test',
            password: 'Segura-2026',
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    academy_name: 'Academia Norte',
                    full_name: 'Ana Pérez',
                    legal_acceptances: { terms: '2026-10-v1', privacy_policy: '2026-10-v1' }
                }
            }
        });
    });

    it('pide la recuperación con retorno a /auth/callback y next a la pantalla de nueva contraseña', async () => {
        await repository.requestPasswordReset('owner@playertech.test');

        expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('owner@playertech.test', {
            redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`
        });
    });

    it('resuelve la recuperación aunque Supabase informe un error que revelaría la cuenta (DEC-12)', async () => {
        auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: authError('user_not_found') });

        await expect(repository.requestPasswordReset('nadie@playertech.test')).resolves.toBeUndefined();
    });

    it('rechaza la recuperación si hay demasiados intentos', async () => {
        auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: authError('over_email_send_rate_limit') });

        await expect(repository.requestPasswordReset('owner@playertech.test')).rejects.toMatchObject({ code: 'rate_limited' });
    });

    describe('con un correo ya registrado (HU-014 CA-005)', () => {
        const input = { email: 'owner@playertech.test', password: 'Segura-2026', academyName: 'A', fullName: 'B', legalAcceptances: { terms: 'v1', privacyPolicy: 'v1' } };

        it('traduce el error de Auth a email_taken', async () => {
            auth.signUp.mockResolvedValue({ data: {}, error: authError('user_already_exists') });

            await expect(repository.signUp(input)).rejects.toMatchObject({ code: 'email_taken' });
        });

        it('detecta la cuenta sin identidades que Auth devuelve con la verificación activa', async () => {
            auth.signUp.mockResolvedValue({ data: { user: { id: 'x', identities: [] } }, error: null });

            await expect(repository.signUp(input)).rejects.toMatchObject({ code: 'email_taken' });
        });

        it('un registro nuevo (con identidades) resuelve sin error', async () => {
            auth.signUp.mockResolvedValue({ data: { user: { id: 'x', identities: [{ id: 'i' }] } }, error: null });

            await expect(repository.signUp(input)).resolves.toBeUndefined();
        });
    });

    it('reenvía la verificación con retorno a /auth/callback', async () => {
        await repository.resendVerification('owner@playertech.test');

        expect(auth.resend).toHaveBeenCalledWith({
            type: 'signup',
            email: 'owner@playertech.test',
            options: { emailRedirectTo: `${location.origin}/auth/callback` }
        });
    });

    it('resuelve el reenvío aunque Supabase informe un error que revelaría la cuenta (DEC-12)', async () => {
        auth.resend.mockResolvedValue({ data: null, error: authError('email_address_invalid') });

        await expect(repository.resendVerification('nadie@playertech.test')).resolves.toBeUndefined();
    });

    it('rechaza el reenvío si hay demasiados intentos', async () => {
        auth.resend.mockResolvedValue({ data: null, error: authError('over_email_send_rate_limit') });

        await expect(repository.resendVerification('owner@playertech.test')).rejects.toMatchObject({ code: 'rate_limited' });
    });

    it('convierte la sesión de Supabase en el modelo de dominio al iniciar sesión', async () => {
        const session = await repository.signIn('owner@playertech.test', 'Segura-2026');

        expect(session).toEqual({
            user: { id: 'user-1', email: 'owner@playertech.test', emailConfirmed: true },
            expiresAt: new Date(1_800_000_000 * 1000)
        });
    });

    it('traduce las credenciales inválidas a AppError', async () => {
        auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: authError('invalid_credentials') });

        const result = repository.signIn('owner@playertech.test', 'mala');

        await expect(result).rejects.toBeInstanceOf(AppError);
        await expect(result).rejects.toMatchObject({ code: 'invalid_credentials' });
    });

    it.each([
        ['pkce_code_verifier_not_found', 'other_browser'],
        ['flow_state_not_found', 'other_browser'],
        ['otp_expired', 'link_invalid']
    ] as const)('al intercambiar el código traduce %s a %s', async (supabaseCode, expected) => {
        auth.exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: authError(supabaseCode) });

        await expect(repository.exchangeCodeForSession('code')).rejects.toMatchObject({ code: expected });
    });

    it('devuelve null si no hay sesión guardada', async () => {
        await expect(repository.getSession()).resolves.toBeNull();
    });

    it('notifica los cambios de sesión y permite cancelar la suscripción', () => {
        const listener = vi.fn();
        const unsubscribe = repository.onSessionChange(listener);
        const callback = auth.onAuthStateChange.mock.calls[0][0];

        callback('SIGNED_OUT', null);
        expect(listener).toHaveBeenCalledWith(null);

        unsubscribe();
        expect(auth.onAuthStateChange.mock.results[0].value.data.subscription.unsubscribe).toHaveBeenCalled();
    });

    it('cierra la sesión solo en este navegador, sin cerrar los otros dispositivos (HU-015)', async () => {
        await repository.signOut();

        expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });
});
