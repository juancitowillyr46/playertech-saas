import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ResetPasswordPage } from './reset-password';

async function setup(authenticated = true) {
    const auth = { isAuthenticated: signal(authenticated), updatePassword: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await render(ResetPasswordPage, { providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
    const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigateByUrl').mockResolvedValue(true);

    return { auth, navigate, user: userEvent.setup() };
}

async function submit(user: ReturnType<typeof userEvent.setup>, password: string, confirmation: string) {
    await user.type(screen.getByLabelText('Nueva contraseña'), password);
    await user.type(screen.getByLabelText('Confirmar contraseña'), confirmation);
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
}

describe('ResetPasswordPage', () => {
    it('cambia la contraseña y navega al inicio', async () => {
        const { auth, navigate, user } = await setup();

        await submit(user, 'Nueva-2026', 'Nueva-2026');

        expect(auth.updatePassword).toHaveBeenCalledWith('Nueva-2026');
        expect(navigate).toHaveBeenCalledWith('/home');
    });

    it('exige al menos 8 caracteres y que la confirmación coincida', async () => {
        const { auth, user } = await setup();

        await submit(user, 'Corta12', 'Otra1234');

        expect(auth.updatePassword).not.toHaveBeenCalled();
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();
        expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    });

    it('muestra el error del cambio', async () => {
        const { auth, user } = await setup();
        auth.updatePassword.mockRejectedValue(new AppError('network'));

        await submit(user, 'Nueva-2026', 'Nueva-2026');

        expect(await screen.findByText('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.')).toBeTruthy();
    });

    it('sin sesión de recuperación indica que el enlace ya no es válido', async () => {
        await setup(false);

        expect(screen.getByText('El enlace de recuperación ya no es válido.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Solicitar un enlace nuevo' }).getAttribute('href')).toBe('/auth/forgot-password');
        expect(screen.queryByLabelText('Nueva contraseña')).toBeNull();
    });
});
