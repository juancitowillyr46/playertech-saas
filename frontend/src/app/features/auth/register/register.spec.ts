import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { LegalDocumentsRepository } from '../../../core/legal/data/legal-documents.repository';
import { LegalTextRepository } from '../../../core/legal/data/legal-text.repository';
import { RegisterPage } from './register';

const LEGAL = {
    terms: { type: 'terms', version: '2026-10-v2', url: '/legal/terms/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' },
    privacyPolicy: { type: 'privacy_policy', version: '2026-10-v2', url: '/legal/privacy_policy/2026-10-v2.html', publishedAt: '2026-10-25T05:00:00Z' }
} as const;

async function setup(getCurrent = vi.fn().mockResolvedValue(LEGAL)) {
    const auth = { signUp: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await render(RegisterPage, {
        providers: [
            provideRouter([]),
            { provide: AuthService, useValue: auth },
            { provide: LegalDocumentsRepository, useValue: { getCurrent } },
            { provide: LegalTextRepository, useValue: { getText: vi.fn((url: string) => Promise.resolve(`<h1>Doc</h1><p>Texto de ${url}</p>`)) } }
        ]
    });
    const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigateByUrl').mockResolvedValue(true);

    return { auth, getCurrent, navigate, user: userEvent.setup() };
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText('Nombre de la academia'), 'Academia Norte');
    await user.type(screen.getByLabelText('Tu nombre'), 'Ana Pérez');
    await user.type(screen.getByLabelText('Correo'), 'ana@playertech.test');
    await user.type(screen.getByLabelText('Contraseña'), 'Segura-2026');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Segura-2026');
    await user.click(screen.getByRole('checkbox', { name: /Términos y Condiciones/ }));
    await user.click(screen.getByRole('checkbox', { name: /Política de Tratamiento de Datos/ }));
}

describe('RegisterPage', { timeout: 20_000 }, () => {
    it('abre cada documento en un dialog sin marcar la casilla ni perder lo escrito (CA-001 y CA-002 de HU-043)', async () => {
        const { user } = await setup();
        await user.type(await screen.findByLabelText('Nombre de la academia'), 'Academia Norte');

        // El nombre del documento va separado del texto de la casilla.
        const sentence = (name: string) => screen.getByRole('button', { name }).parentElement?.textContent?.replace(/\s+/g, ' ').trim();
        expect(sentence('Términos y Condiciones')).toBe('Acepto los Términos y Condiciones');
        expect(sentence('Política de Tratamiento de Datos')).toBe('Acepto la Política de Tratamiento de Datos');

        await user.click(screen.getByRole('button', { name: 'Términos y Condiciones' }));
        expect(await screen.findByRole('dialog', { name: 'Términos y Condiciones' })).toBeTruthy();
        expect(await screen.findByText(`Texto de ${LEGAL.terms.url}`)).toBeTruthy();
        expect(screen.getByText('Versión 2026-10-v2 · publicada el 25 de octubre de 2026')).toBeTruthy();
        const close = screen.getAllByRole('button', { name: 'Cerrar' });
        await user.click(close[close.length - 1]);

        await user.click(screen.getByRole('button', { name: 'Política de Tratamiento de Datos' }));
        expect(await screen.findByText(`Texto de ${LEGAL.privacyPolicy.url}`)).toBeTruthy();

        expect((screen.getByRole('checkbox', { name: /Términos y Condiciones/ }) as HTMLInputElement).checked).toBe(false);
        expect((screen.getByRole('checkbox', { name: /Política de Tratamiento de Datos/ }) as HTMLInputElement).checked).toBe(false);
        expect((screen.getByLabelText('Nombre de la academia') as HTMLInputElement).value).toBe('Academia Norte');
    });

    it('exige todos los campos y ambas aceptaciones', async () => {
        const { auth, user } = await setup();

        await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }));

        expect(auth.signUp).not.toHaveBeenCalled();
        expect(screen.getByText('Ingresa el nombre de la academia.')).toBeTruthy();
        expect(screen.getByText('Ingresa tu nombre.')).toBeTruthy();
        expect(screen.getByText('Ingresa tu correo.')).toBeTruthy();
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();
        expect(screen.getByText('Debes aceptar los Términos y Condiciones.')).toBeTruthy();
        expect(screen.getByText('Debes aceptar la Política de Tratamiento de Datos.')).toBeTruthy();
    });

    it('asocia los errores de la confirmación y de las aceptaciones a su campo', async () => {
        const { user } = await setup();

        await user.type(await screen.findByLabelText('Contraseña'), 'Segura-2026');
        await user.type(screen.getByLabelText('Confirmar contraseña'), 'Distinta-2026');
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        const describedBy = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;
        const confirmation = screen.getByLabelText('Confirmar contraseña');
        const terms = screen.getByRole('checkbox', { name: /Términos y Condiciones/ });

        expect(confirmation.getAttribute('aria-invalid')).toBe('true');
        expect(describedBy(confirmation)).toContain('Las contraseñas no coinciden.');
        expect(terms.getAttribute('aria-invalid')).toBe('true');
        expect(describedBy(terms)).toContain('Debes aceptar los Términos y Condiciones.');
    });

    it('rechaza una contraseña de menos de 8 caracteres y una confirmación distinta', async () => {
        const { auth, user } = await setup();

        await user.type(await screen.findByLabelText('Contraseña'), 'Corta12');
        await user.type(screen.getByLabelText('Confirmar contraseña'), 'Distinta');
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(auth.signUp).not.toHaveBeenCalled();
        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeTruthy();
        expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    });

    it('registra con las versiones vigentes y navega a verificar el correo', async () => {
        const { auth, navigate, user } = await setup();

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(auth.signUp).toHaveBeenCalledWith({
            email: 'ana@playertech.test',
            password: 'Segura-2026',
            academyName: 'Academia Norte',
            fullName: 'Ana Pérez',
            legalAcceptances: { terms: '2026-10-v2', privacyPolicy: '2026-10-v2' }
        });
        expect(navigate).toHaveBeenCalledWith('/auth/verify-email?email=ana%40playertech.test');
    });

    it('con un correo ya registrado lo indica junto al campo y ofrece ingresar o recuperar (HU-014 CA-005)', async () => {
        const { auth, navigate, user } = await setup();
        auth.signUp.mockRejectedValue(new AppError('email_taken'));

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(await screen.findByText('Ya existe una cuenta con este correo.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/auth/login');
        expect(screen.getByRole('link', { name: 'Recuperar mi contraseña' }).getAttribute('href')).toBe('/auth/forgot-password');
        expect(screen.getByLabelText('Correo').getAttribute('aria-invalid')).toBe('true');
        expect(navigate).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText('Correo'), 'x');
        expect(screen.queryByText('Ya existe una cuenta con este correo.')).toBeNull();
    });

    it('un doble toque en Crear cuenta registra una sola vez', async () => {
        const { auth, user } = await setup();
        auth.signUp.mockReturnValue(new Promise(() => undefined));

        await fillValidForm(user);
        await user.dblClick(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(auth.signUp).toHaveBeenCalledTimes(1);
    });

    it('muestra el error del registro', async () => {
        const { auth, user } = await setup();
        auth.signUp.mockRejectedValue(new AppError('weak_password'));

        await fillValidForm(user);
        await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.getAllByText('La contraseña debe tener al menos 8 caracteres.').length).toBeGreaterThan(0);
    });

    it('si no carga los documentos legales, muestra el error con Reintentar y no muestra el formulario', async () => {
        const getCurrent = vi.fn().mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce(LEGAL);
        const { user } = await setup(getCurrent);

        expect(await screen.findByText('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.')).toBeTruthy();
        expect(screen.queryByLabelText('Nombre de la academia')).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Reintentar' }));

        expect(await screen.findByLabelText('Nombre de la academia')).toBeTruthy();
        expect(getCurrent).toHaveBeenCalledTimes(2);
    });
});
