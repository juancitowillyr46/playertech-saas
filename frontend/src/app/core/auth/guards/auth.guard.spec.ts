import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { authGuard } from './auth.guard';

function setup(authenticated: boolean, ready = true) {
    const auth = { ready: signal(ready), isAuthenticated: signal(authenticated) };

    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });

    const run = (url: string) => TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)) as Promise<boolean | UrlTree>;

    return { auth, run, router: TestBed.inject(Router) };
}

describe('authGuard', () => {
    it('sin sesión dirige al inicio de sesión conservando la ruta solicitada', async () => {
        const { run, router } = setup(false);

        const result = await run('/settings/venues');

        expect(router.serializeUrl(result as UrlTree)).toBe('/auth/login?returnUrl=%2Fsettings%2Fvenues');
    });

    it('con sesión permite el acceso', async () => {
        const { run } = setup(true);

        await expect(run('/home')).resolves.toBe(true);
    });

    it('espera a que la sesión esté restaurada antes de decidir', async () => {
        const { auth, run } = setup(true, false);
        let settled = false;

        const result = run('/home').then((value) => {
            settled = true;

            return value;
        });

        await Promise.resolve();
        expect(settled).toBe(false);

        auth.ready.set(true);
        TestBed.tick();

        await expect(result).resolves.toBe(true);
    });
});
