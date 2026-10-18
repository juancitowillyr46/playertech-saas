import { inject } from '@angular/core';
import { RedirectFunction, Router } from '@angular/router';

/** Parámetros con los que Auth vuelve de un enlace de correo. */
const EMAIL_LINK_PARAMS = ['code', 'error', 'error_code'];

/**
 * Redirección de la raíz. Si Auth no acepta la dirección de retorno pedida, vuelve a la
 * dirección del sitio (la raíz) con el código o el error del enlace. Esos parámetros se
 * llevan a `/auth/callback`, que completa el ingreso o explica que el enlace no es válido,
 * en lugar de perderlos camino al inicio (spec 006).
 */
export const rootRedirect: RedirectFunction = ({ queryParams }) => {
    const fromEmailLink = EMAIL_LINK_PARAMS.some((param) => param in queryParams);

    return fromEmailLink ? inject(Router).createUrlTree(['/auth/callback'], { queryParams }) : '/home';
};
