import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AppError } from '../../../core/errors/app-error';
import { RegistrationService } from '../services/registration.service';
import { VerifyEmailPage } from './verify-email';

const CONFIRMATION = 'Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador. Si ya la verificaste, inicia sesión.';

async function setup(email?: string) {
    const registration = { resendVerification: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await render(VerifyEmailPage, {
        providers: [
            provideRouter([]),
            { provide: RegistrationService, useValue: registration },
            { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(email ? { email } : {}) } } }
        ]
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const wait = async (seconds: number) => {
        vi.advanceTimersByTime(seconds * 1000);
        fixture.detectChanges();
        await fixture.whenStable();
    };

    return { registration, user, wait };
}

const resendButton = () => screen.getByRole('button', { name: /Reenviar/ });

describe('VerifyEmailPage', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('muestra el correo del registro', async () => {
        await setup('owner@playertech.test');

        expect(screen.getByText('owner@playertech.test')).toBeTruthy();
        expect(screen.queryByLabelText('Correo')).toBeNull();
    });

    it('orienta a quien ya tenía cuenta sin revelarlo (HU-014 CA-005)', async () => {
        await setup('owner@playertech.test');

        expect(screen.getByText('¿Ya tienes una cuenta con este correo?')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/auth/login');
        expect(screen.getByRole('link', { name: 'Recuperar mi contraseña' }).getAttribute('href')).toBe('/auth/forgot-password');
    });

    it('al llegar desde el registro espera 60 s antes de permitir el reenvío (FR-008)', async () => {
        const { wait } = await setup('owner@playertech.test');

        expect(resendButton().textContent).toContain('Reenviar en 1:00');
        expect(resendButton().hasAttribute('disabled')).toBe(true);

        await wait(59);
        expect(resendButton().textContent).toContain('Reenviar en 0:01');

        await wait(1);
        expect(resendButton().textContent).toContain('Reenviar correo');
        expect(resendButton().hasAttribute('disabled')).toBe(false);
    });

    it('reenvía al correo conocido, muestra el mensaje genérico y vuelve a esperar', async () => {
        const { registration, user, wait } = await setup('owner@playertech.test');
        await wait(60);

        await user.click(resendButton());

        expect(registration.resendVerification).toHaveBeenCalledWith('owner@playertech.test');
        expect(await screen.findByText(CONFIRMATION)).toBeTruthy();
        expect(resendButton().textContent).toContain('Reenviar en 1:00');
    });

    it('un doble toque envía una sola vez', async () => {
        const { registration, user, wait } = await setup('owner@playertech.test');
        await wait(60);

        await user.dblClick(resendButton());

        expect(registration.resendVerification).toHaveBeenCalledTimes(1);
    });

    it('muestra el error de demasiados intentos sin el mensaje de confirmación', async () => {
        const { registration, user, wait } = await setup('owner@playertech.test');
        registration.resendVerification.mockRejectedValue(new AppError('rate_limited'));
        await wait(60);

        await user.click(resendButton());

        expect(await screen.findByText(new AppError('rate_limited').message)).toBeTruthy();
        expect(screen.queryByText(CONFIRMATION)).toBeNull();
    });

    it('sin correo conocido lo pide, lo valida y reenvía al correo escrito', async () => {
        const { registration, user } = await setup();

        expect(resendButton().textContent).toContain('Reenviar correo');
        await user.click(resendButton());
        expect(screen.getByText('Ingresa tu correo.')).toBeTruthy();

        await user.type(screen.getByLabelText('Correo'), 'no-es-correo');
        expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
        expect(registration.resendVerification).not.toHaveBeenCalled();

        await user.clear(screen.getByLabelText('Correo'));
        await user.type(screen.getByLabelText('Correo'), ' nueva@playertech.test ');
        await user.click(resendButton());

        expect(registration.resendVerification).toHaveBeenCalledWith('nueva@playertech.test');
    });
});
