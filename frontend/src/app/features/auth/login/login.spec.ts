import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { LoginPage } from './login';

async function setup(queryParams: Record<string, string> = {}) {
    const auth = { signIn: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await render(LoginPage, {
        providers: [
            provideRouter([]),
            { provide: AuthService, useValue: auth },
            { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
        ]
    });
    const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigateByUrl').mockResolvedValue(true);

    return { auth, navigate, user: userEvent.setup() };
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
    await user.type(screen.getByLabelText('Correo'), email);
    await user.type(screen.getByLabelText('Contraseña'), password);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('LoginPage', () => {
    it('exige correo y contraseña antes de enviar', async () => {
        const { auth, user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

        expect(auth.signIn).not.toHaveBeenCalled();
        expect(screen.getByText('Ingresa tu correo.')).toBeTruthy();
        expect(screen.getByText('Ingresa tu contraseña.')).toBeTruthy();
    });

    it('asocia cada error a su campo para los lectores de pantalla', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

        const email = screen.getByLabelText('Correo');
        const password = screen.getByLabelText('Contraseña');

        expect(email.getAttribute('aria-invalid')).toBe('true');
        expect(document.getElementById(email.getAttribute('aria-describedby') ?? '')?.textContent).toContain('Ingresa tu correo.');
        expect(password.getAttribute('aria-invalid')).toBe('true');
        expect(document.getElementById(password.getAttribute('aria-describedby') ?? '')?.textContent).toContain('Ingresa tu contraseña.');
    });

    it('no marca los campos como inválidos antes de intentar enviar', async () => {
        await setup();

        expect(screen.getByLabelText('Correo').getAttribute('aria-invalid')).toBeNull();
        expect(screen.getByLabelText('Contraseña').getAttribute('aria-describedby')).toBeNull();
    });

    it('valida el formato del correo', async () => {
        const { auth, user } = await setup();

        await fillAndSubmit(user, 'no-es-correo', 'Segura-2026');

        expect(auth.signIn).not.toHaveBeenCalled();
        expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
    });

    it('inicia sesión y navega al inicio', async () => {
        const { auth, navigate, user } = await setup();

        await fillAndSubmit(user, 'owner.a@playertech.test', 'Segura-2026');

        expect(auth.signIn).toHaveBeenCalledWith('owner.a@playertech.test', 'Segura-2026');
        expect(navigate).toHaveBeenCalledWith('/home');
    });

    it('vuelve a la ruta solicitada (returnUrl) si es interna', async () => {
        const { navigate, user } = await setup({ returnUrl: '/settings/venues' });

        await fillAndSubmit(user, 'owner.a@playertech.test', 'Segura-2026');

        expect(navigate).toHaveBeenCalledWith('/settings/venues');
    });

    it.each(['//malicioso.com', 'https://malicioso.com'])('ignora el returnUrl externo %s', async (returnUrl) => {
        const { navigate, user } = await setup({ returnUrl });

        await fillAndSubmit(user, 'owner.a@playertech.test', 'Segura-2026');

        expect(navigate).toHaveBeenCalledWith('/home');
    });

    it('muestra el mensaje del error', async () => {
        const { auth, user } = await setup();
        auth.signIn.mockRejectedValue(new AppError('invalid_credentials'));

        await fillAndSubmit(user, 'owner.a@playertech.test', 'mala-clave');

        expect(await screen.findByText('El correo o la contraseña no son correctos.')).toBeTruthy();
    });

    it('deshabilita el botón mientras se envía', async () => {
        const { auth, user } = await setup();
        auth.signIn.mockReturnValue(new Promise(() => undefined));

        await fillAndSubmit(user, 'owner.a@playertech.test', 'Segura-2026');

        expect(screen.getByRole('button', { name: /Iniciar sesión/ }).hasAttribute('disabled')).toBe(true);
    });
});
