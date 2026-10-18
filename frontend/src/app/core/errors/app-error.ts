import { ERROR_MESSAGES } from './error-messages';

/** Categorías estables de error de la aplicación (contracts/app-errors.md). */
export type AppErrorCode =
    | 'invalid_credentials'
    | 'email_not_confirmed'
    | 'weak_password'
    | 'link_invalid'
    | 'other_browser'
    | 'rate_limited'
    | 'network'
    | 'forbidden'
    | 'duplicate'
    | 'rule_violation'
    | 'not_found'
    | 'unknown';

/**
 * Error que ven los servicios y las pantallas. `message` está en español y es
 * apto para mostrarse; `cause` conserva el error original solo para registro.
 */
export class AppError extends Error {
    constructor(
        readonly code: AppErrorCode,
        options?: { cause?: unknown }
    ) {
        super(ERROR_MESSAGES[code], options);
        this.name = 'AppError';
    }
}
