import type { AppErrorCode } from './app-error';

/** Mensajes en español de cada error (contracts/app-errors.md). */
export const ERROR_MESSAGES: Readonly<Record<AppErrorCode, string>> = {
    invalid_credentials: 'El correo o la contraseña no son correctos.',
    email_not_confirmed: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
    weak_password: 'La contraseña debe tener al menos 8 caracteres.',
    link_invalid: 'El enlace venció o ya fue usado.',
    other_browser: 'Abriste el enlace en otro navegador. Si estabas verificando tu correo, ya puedes iniciar sesión. Si estabas recuperando tu contraseña, solicita un enlace nuevo desde el navegador donde lo pediste.',
    rate_limited: 'Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
    network: 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
    forbidden: 'No tienes permiso para realizar esta acción.',
    // Gestiones de datos (spec 004, contracts/app-errors.md).
    duplicate: 'Ya existe un registro con ese nombre.',
    rule_violation: 'Esta acción no cumple las reglas de la academia.',
    not_found: 'El registro ya no existe o cambió. Actualizamos la información.',
    unknown: 'Ocurrió un error inesperado. Inténtalo de nuevo.'
};
