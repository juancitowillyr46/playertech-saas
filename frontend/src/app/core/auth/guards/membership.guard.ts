import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AcademyContextService } from '../../academy-context/academy-context.service';
import { AuthService } from '../auth.service';
import { whenSessionReady } from './when-session-ready';

/** Destino según la situación de la academia (contracts/routes.md). */
const REDIRECTS: Readonly<Record<string, string>> = {
    none: '/auth/access-denied',
    suspended: '/auth/suspended',
    error: '/error'
};

/**
 * Exige una membresía activa en una academia activa. Angular ejecuta los guards
 * de una ruta en paralelo: sin sesión no consulta nada y deja que `authGuard`
 * dirija al inicio de sesión.
 */
export const membershipGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const context = inject(AcademyContextService);
    const router = inject(Router);

    await whenSessionReady(auth);

    if (!auth.isAuthenticated()) {
        return true;
    }

    await context.load();

    const redirect = REDIRECTS[context.status()];

    return redirect ? router.parseUrl(redirect) : true;
};
