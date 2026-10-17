import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { CallbackPage } from './callback';

async function setup(queryParams: Record<string, string>, completeEmailLink = vi.fn().mockResolvedValue(undefined)) {
    // La pantalla navega al iniciarse: el espía debe existir antes de renderizar.
    const navigate = vi.spyOn(Router.prototype, 'navigateByUrl').mockResolvedValue(true);
    const { fixture } = await render(CallbackPage, {
        providers: [
            provideRouter([]),
            { provide: AuthService, useValue: { completeEmailLink } },
            { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
        ]
    });
    await fixture.whenStable();

    return { completeEmailLink, navigate, fixture };
}

describe('CallbackPage', () => {
    afterEach(() => vi.restoreAllMocks());

    it('con un código válido inicia la sesión y navega al inicio sin dejar el código en la URL', async () => {
        const { completeEmailLink, navigate } = await setup({ code: 'abc' });

        expect(completeEmailLink).toHaveBeenCalledWith('abc');
        expect(navigate).toHaveBeenCalledWith('/home', { replaceUrl: true });
    });

    it('con next a la nueva contraseña navega a esa pantalla', async () => {
        const { navigate } = await setup({ code: 'abc', next: '/auth/reset-password' });

        expect(navigate).toHaveBeenCalledWith('/auth/reset-password', { replaceUrl: true });
    });

    it.each(['https://malicioso.com', '//malicioso.com', '/settings'])('ignora next=%s y navega al inicio', async (next) => {
        const { navigate } = await setup({ code: 'abc', next });

        expect(navigate).toHaveBeenCalledWith('/home', { replaceUrl: true });
    });

    it('con error en la URL muestra que el enlace no es válido sin intentar el intercambio', async () => {
        const { completeEmailLink } = await setup({ error: 'access_denied', error_code: 'otp_expired' });

        expect(completeEmailLink).not.toHaveBeenCalled();
        expect(screen.getByText(ERROR_MESSAGES.link_invalid)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' }).getAttribute('href')).toBe('/auth/login');
    });

    it('sin parámetros muestra que el enlace no es válido', async () => {
        await setup({});

        expect(screen.getByText(ERROR_MESSAGES.link_invalid)).toBeTruthy();
    });

    it('si el enlace se abrió en otro navegador lo explica con enlaces a iniciar sesión y recuperar', async () => {
        await setup({ code: 'abc' }, vi.fn().mockRejectedValue(new AppError('other_browser')));

        expect(await screen.findByText(ERROR_MESSAGES.other_browser)).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Solicitar un enlace nuevo' }).getAttribute('href')).toBe('/auth/forgot-password');
    });

    it('si el código fue rechazado muestra que el enlace no es válido', async () => {
        await setup({ code: 'abc' }, vi.fn().mockRejectedValue(new AppError('link_invalid')));

        expect(await screen.findByText(ERROR_MESSAGES.link_invalid)).toBeTruthy();
    });
});
