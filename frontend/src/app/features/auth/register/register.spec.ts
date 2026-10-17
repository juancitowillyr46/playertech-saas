import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { LegalDocumentsRepository } from '../../../core/legal/data/legal-documents.repository';
import { RegisterPage } from './register';

const LEGAL = {
    terms: { type: 'terms', version: '2026-10-v1', url: 'https://playertech.app/legal/terms/2026-10-v1' },
    privacyPolicy: { type: 'privacy_policy', version: '2026-10-v1', url: 'https://playertech.app/legal/privacy_policy/2026-10-v1' }
} as const;

async function setup(getCurrent = vi.fn().mockResolvedValue(LEGAL)) {
    const auth = { signUp: vi.fn().mockResolvedValue(undefined) };
    const { fixture } = await render(RegisterPage, {
        providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: LegalDocumentsRepository, useValue: { getCurrent } }]
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

describe('RegisterPage', () => {
    it('muestra los enlaces a las versiones vigentes de los documentos legales', async () => {
        await setup();

        expect((await screen.findByRole('link', { name: 'Términos y Condiciones' })).getAttribute('href')).toBe(LEGAL.terms.url);
        expect(screen.getByRole('link', { name: 'Política de Tratamiento de Datos' }).getAttribute('href')).toBe(LEGAL.privacyPolicy.url);
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
            legalAcceptances: { terms: '2026-10-v1', privacyPolicy: '2026-10-v1' }
        });
        expect(navigate).toHaveBeenCalledWith('/auth/verify-email?email=ana%40playertech.test');
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
