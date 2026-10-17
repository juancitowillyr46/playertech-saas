import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { guestGuard } from './guest.guard';

function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: AuthService, useValue: { ready: signal(true), isAuthenticated: signal(authenticated) } }]
    });

    const run = () => TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, { url: '/auth/login' } as RouterStateSnapshot)) as Promise<boolean | UrlTree>;

    return { run, router: TestBed.inject(Router) };
}

describe('guestGuard', () => {
    it('sin sesión permite abrir la pantalla pública', async () => {
        await expect(setup(false).run()).resolves.toBe(true);
    });

    it('con sesión dirige al inicio', async () => {
        const { run, router } = setup(true);

        expect(router.serializeUrl((await run()) as UrlTree)).toBe('/home');
    });
});
