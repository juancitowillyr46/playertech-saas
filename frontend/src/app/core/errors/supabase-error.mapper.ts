import { AppError, AppErrorCode } from './app-error';

/** Códigos de Supabase Auth y de PostgreSQL con su error de aplicación (contracts/app-errors.md). */
const CODE_MAP: Readonly<Record<string, AppErrorCode>> = {
    invalid_credentials: 'invalid_credentials',
    email_not_confirmed: 'email_not_confirmed',
    weak_password: 'weak_password',
    otp_expired: 'link_invalid',
    bad_code_verifier: 'link_invalid',
    flow_state_expired: 'link_invalid',
    flow_state_not_found: 'other_browser',
    pkce_code_verifier_not_found: 'other_browser',
    over_email_send_rate_limit: 'rate_limited',
    over_request_rate_limit: 'rate_limited',
    '42501': 'forbidden',
    // Reglas de la base de datos (spec 004): índice único, check y ninguna fila afectada.
    '23505': 'duplicate',
    '23514': 'rule_violation',
    PGRST116: 'not_found'
};

/**
 * Convierte cualquier error del proveedor en un `AppError` estable. Solo lo usan
 * las implementaciones `supabase-*`; el resto de la aplicación nunca ve errores
 * del proveedor (FR-015).
 */
export function mapSupabaseError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    return new AppError(classify(error), { cause: error });
}

function classify(error: unknown): AppErrorCode {
    if (error instanceof TypeError || readString(error, 'name') === 'AuthRetryableFetchError') {
        return 'network';
    }

    const code = readString(error, 'code');

    return (code && CODE_MAP[code]) || 'unknown';
}

function readString(value: unknown, key: string): string | undefined {
    if (typeof value !== 'object' || value === null || !(key in value)) {
        return undefined;
    }

    const field = (value as Record<string, unknown>)[key];

    return typeof field === 'string' ? field : undefined;
}
