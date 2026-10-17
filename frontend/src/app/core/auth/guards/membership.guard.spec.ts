import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AcademyContextService } from '../../academy-context/academy-context.service';
import { AcademyContextStatus } from '../../academy-context/models/academy-context.models';
import { AuthService } from '../auth.service';
import { membershipGuard } from './membership.guard';

function setup(status: AcademyContextStatus, authenticated = true) {
    const context = { status: signal(status), load: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            { provide: AcademyContextService, useValue: context },
            { provide: AuthService, useValue: { ready: signal(true), isAuthenticated: signal(authenticated) } }
        ]
    });

    const run = () => TestBed.runInInjectionContext(() => membershipGuard({} as ActivatedRouteSnapshot, { url: '/home' } as RouterStateSnapshot)) as Promise<boolean | UrlTree>;

    return { context, run, router: TestBed.inject(Router) };
}

describe('membershipGuard', () => {
    it('carga el contexto antes de decidir', async () => {
        const { context, run } = setup('active');

        await run();

        expect(context.load).toHaveBeenCalled();
    });

    it('sin sesión no consulta el contexto y deja decidir a authGuard', async () => {
        const { context, run } = setup('loading', false);

        await expect(run()).resolves.toBe(true);
        expect(context.load).not.toHaveBeenCalled();
    });

    it('con academia activa permite el acceso', async () => {
        const { run } = setup('active');

        await expect(run()).resolves.toBe(true);
    });

    it.each([
        ['none', '/auth/access-denied'],
        ['suspended', '/auth/suspended'],
        ['error', '/error']
    ] as const)('con situación %s dirige a %s', async (status, expected) => {
        const { run, router } = setup(status);

        expect(router.serializeUrl((await run()) as UrlTree)).toBe(expected);
    });
});
