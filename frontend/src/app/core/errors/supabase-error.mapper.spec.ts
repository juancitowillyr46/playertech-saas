import { AppError } from './app-error';
import { ERROR_MESSAGES } from './error-messages';
import { mapSupabaseError } from './supabase-error.mapper';

/** Error con la forma de los de Supabase Auth (`AuthApiError`). */
function authError(code: string, name = 'AuthApiError'): Error {
    return Object.assign(new Error(`supabase: ${code}`), { name, code, status: 400 });
}

describe('mapSupabaseError', () => {
    it.each([
        ['invalid_credentials', 'invalid_credentials'],
        ['email_not_confirmed', 'email_not_confirmed'],
        ['weak_password', 'weak_password'],
        ['otp_expired', 'link_invalid'],
        ['bad_code_verifier', 'link_invalid'],
        ['flow_state_expired', 'link_invalid'],
        ['flow_state_not_found', 'other_browser'],
        ['pkce_code_verifier_not_found', 'other_browser'],
        ['over_email_send_rate_limit', 'rate_limited'],
        ['over_request_rate_limit', 'rate_limited']
    ] as const)('traduce el código de Auth %s a %s', (supabaseCode, expected) => {
        const result = mapSupabaseError(authError(supabaseCode));

        expect(result).toBeInstanceOf(AppError);
        expect(result.code).toBe(expected);
        expect(result.message).toBe(ERROR_MESSAGES[result.code]);
    });

    it('traduce el permiso denegado de PostgreSQL (42501) a forbidden', () => {
        const postgrestError = { code: '42501', message: 'new row violates row-level security policy', details: null, hint: null };

        expect(mapSupabaseError(postgrestError).code).toBe('forbidden');
    });

    it.each([
        ['23505', 'duplicate'],
        ['23514', 'rule_violation'],
        ['22023', 'rule_violation'],
        ['PGRST116', 'not_found']
    ] as const)('traduce el código de la base de datos %s a %s (spec 004)', (code, expected) => {
        const result = mapSupabaseError({ code, message: 'postgrest', details: null, hint: null });

        expect(result.code).toBe(expected);
        expect(result.message).toBe(ERROR_MESSAGES[expected]);
    });

    it('traduce un fallo de fetch a network', () => {
        expect(mapSupabaseError(new TypeError('Failed to fetch')).code).toBe('network');
    });

    it('traduce el error reintentable de Auth (sin conexión) a network', () => {
        expect(mapSupabaseError(authError('unexpected_failure', 'AuthRetryableFetchError')).code).toBe('network');
    });

    it('traduce cualquier otro error a unknown', () => {
        expect(mapSupabaseError({ weird: true }).code).toBe('unknown');
        expect(mapSupabaseError('texto').code).toBe('unknown');
        expect(mapSupabaseError(undefined).code).toBe('unknown');
    });

    it('conserva el error original en cause', () => {
        const original = authError('invalid_credentials');

        expect(mapSupabaseError(original).cause).toBe(original);
    });

    it('devuelve el mismo AppError si ya está traducido', () => {
        const appError = new AppError('forbidden');

        expect(mapSupabaseError(appError)).toBe(appError);
    });
});
