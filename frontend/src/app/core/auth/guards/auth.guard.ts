import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { whenSessionReady } from './when-session-ready';

/**
 * Exige una sesión; si no existe, dirige al inicio de sesión conservando la ruta
 * solicitada. Mejora la experiencia, pero no protege datos: eso lo hace RLS.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await whenSessionReady(auth);

    return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
