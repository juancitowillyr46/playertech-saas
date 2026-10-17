import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { whenSessionReady } from './when-session-ready';

/** Impide abrir las pantallas públicas con una sesión iniciada (FR-020). */
export const guestGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await whenSessionReady(auth);

    return auth.isAuthenticated() ? router.parseUrl('/home') : true;
};
