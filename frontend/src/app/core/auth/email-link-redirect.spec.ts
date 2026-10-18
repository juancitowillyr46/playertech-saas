import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, UrlTree } from '@angular/router';
import { rootRedirect } from './email-link-redirect';

function redirect(queryParams: Record<string, string>): string {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });

    const result = TestBed.runInInjectionContext(() => rootRedirect({ queryParams } as unknown as ActivatedRouteSnapshot));

    return typeof result === 'string' ? result : TestBed.inject(Router).serializeUrl(result as UrlTree);
}

describe('rootRedirect', () => {
    it('sin parámetros de un enlace de correo lleva al inicio', () => {
        expect(redirect({})).toBe('/home');
    });

    it('lleva el error de un enlace vencido al retorno, que lo explica', () => {
        expect(redirect({ error: 'access_denied', error_code: 'otp_expired' })).toBe('/auth/callback?error=access_denied&error_code=otp_expired');
    });

    it('lleva el código de un enlace válido al retorno, que completa el ingreso', () => {
        expect(redirect({ code: 'abc' })).toBe('/auth/callback?code=abc');
    });
});
