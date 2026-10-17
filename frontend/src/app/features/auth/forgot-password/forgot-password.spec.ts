import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ForgotPasswordPage } from './forgot-password';

const CONFIRMATION = 'Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Ábrelo desde este mismo navegador.';

async function setup() {
    const auth = { requestPasswordReset: vi.fn().mockResolvedValue(undefined) };

    await render(ForgotPasswordPage, { providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });

    return { auth, user: userEvent.setup() };
}

async function submit(user: ReturnType<typeof userEvent.setup>, email: string) {
    await user.type(screen.getByLabelText('Correo'), email);
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
}

describe('ForgotPasswordPage', () => {
    it('pide la recuperación y muestra el mensaje único de confirmación', async () => {
        const { auth, user } = await setup();

        await submit(user, 'owner.a@playertech.test');

        expect(auth.requestPasswordReset).toHaveBeenCalledWith('owner.a@playertech.test');
        expect(await screen.findByText(CONFIRMATION)).toBeTruthy();
    });

    it('muestra el mismo mensaje ante un error que revelaría si la cuenta existe (DEC-12)', async () => {
        const { auth, user } = await setup();
        auth.requestPasswordReset.mockRejectedValue(new AppError('unknown'));

        await submit(user, 'nadie@playertech.test');

        expect(await screen.findByText(CONFIRMATION)).toBeTruthy();
    });

    it.each(['rate_limited', 'network'] as const)('muestra el error %s, que no revela la cuenta', async (code) => {
        const { auth, user } = await setup();
        auth.requestPasswordReset.mockRejectedValue(new AppError(code));

        await submit(user, 'owner.a@playertech.test');

        expect(await screen.findByText(new AppError(code).message)).toBeTruthy();
        expect(screen.queryByText(CONFIRMATION)).toBeNull();
    });

    it('valida el correo antes de enviar', async () => {
        const { auth, user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

        expect(auth.requestPasswordReset).not.toHaveBeenCalled();
        expect(screen.getByText('Ingresa tu correo.')).toBeTruthy();
    });
});
