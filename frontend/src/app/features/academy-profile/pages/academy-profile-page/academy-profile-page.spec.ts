import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { AcademyContextService } from '../../../../core/academy-context/academy-context.service';
import { FileStorageRepository } from '../../../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../../../core/storage/models/storage.models';
import { AcademyProfileRepository } from '../../data/academy-profile.repository';
import { PREPARE_LOGO_IMAGE } from '../../data/logo-image';
import { AcademyProfileData } from '../../models/academy-profile.models';
import { AcademyProfilePage } from './academy-profile-page';

const LOGO: StoredFile = { id: 'file-1', bucket: 'public-assets', storageKey: 'a/academy/a/file-1.png', mimeType: 'image/png', sizeBytes: 900 };
const DATA: AcademyProfileData = {
    academy: { id: 'academy-a', name: 'Academia Norte', contactEmail: 'contacto@norte.test', contactPhone: '300 111 2222', address: 'Calle 1', city: 'Bogotá', logoFileId: 'file-1' },
    planName: 'Free',
    logo: LOGO
};

async function setup(data: AcademyProfileData = DATA) {
    const repository = {
        getProfile: vi.fn().mockResolvedValue(data),
        updateProfile: vi.fn(async (input) => ({ ...data.academy, ...input })),
        setLogo: vi.fn().mockResolvedValue(undefined)
    };
    const storage = { upload: vi.fn(), purge: vi.fn().mockResolvedValue(undefined), getUrl: vi.fn().mockResolvedValue('http://storage/logo.png') };
    const messages = { add: vi.fn() };
    const result = await render(AcademyProfilePage, {
        providers: [
            provideRouter([]),
            { provide: AcademyProfileRepository, useValue: repository },
            { provide: FileStorageRepository, useValue: storage },
            { provide: AcademyContextService, useValue: { academy: signal(undefined), applyAcademyChanges: vi.fn() } },
            { provide: PREPARE_LOGO_IMAGE, useValue: vi.fn() },
            { provide: MessageService, useValue: messages }
        ]
    });

    await screen.findByLabelText('Nombre de la academia');

    return { ...result, repository, storage, messages, user: userEvent.setup() };
}

const toasts = (messages: { add: ReturnType<typeof vi.fn> }) => messages.add.mock.calls.map(([message]) => message.summary as string);

describe('AcademyProfilePage', () => {
    it('muestra los datos, el plan y el logo (HU-017 CA-001)', async () => {
        await setup();

        expect((screen.getByLabelText('Nombre de la academia') as HTMLInputElement).value).toBe('Academia Norte');
        expect((screen.getByLabelText(/Teléfono/) as HTMLInputElement).value).toBe('300 111 2222');
        expect((screen.getByLabelText(/Correo de contacto/) as HTMLInputElement).value).toBe('contacto@norte.test');
        expect((screen.getByLabelText(/Dirección/) as HTMLInputElement).value).toBe('Calle 1');
        expect((screen.getByLabelText(/Ciudad/) as HTMLInputElement).value).toBe('Bogotá');
        expect(screen.getByText('Free')).toBeTruthy();
        expect(screen.getByRole('img', { name: 'Logo de Academia Norte' })).toBeTruthy();
        expect(screen.getByText('No cambia el correo con el que inicias sesión.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Sedes' }).getAttribute('href')).toBe('/settings/venues');
    });

    it('guarda los cambios y avisa (CA-002)', async () => {
        const { user, repository, messages } = await setup();

        await user.clear(screen.getByLabelText(/Ciudad/));
        await user.type(screen.getByLabelText(/Ciudad/), 'Medellín');
        await user.click(screen.getByRole('button', { name: 'Guardar' }));

        expect(repository.updateProfile).toHaveBeenCalledWith({ name: 'Academia Norte', contactEmail: 'contacto@norte.test', contactPhone: '300 111 2222', address: 'Calle 1', city: 'Medellín' });
        expect(toasts(messages)).toContain('Cambios guardados.');
    });

    it('exige el nombre aunque se escriban solo espacios (CA-003)', async () => {
        const { user, repository } = await setup();

        await user.clear(screen.getByLabelText('Nombre de la academia'));
        await user.type(screen.getByLabelText('Nombre de la academia'), '   ');
        await user.click(screen.getByRole('button', { name: 'Guardar' }));

        expect(screen.getByText('Ingresa el nombre de la academia.')).toBeTruthy();
        expect(screen.getByLabelText('Nombre de la academia').getAttribute('aria-invalid')).toBe('true');
        expect(repository.updateProfile).not.toHaveBeenCalled();
    });

    it('rechaza un correo de contacto inválido (CA-004)', async () => {
        const { user, repository } = await setup();

        await user.clear(screen.getByLabelText(/Correo de contacto/));
        await user.type(screen.getByLabelText(/Correo de contacto/), 'no-es-correo');
        await user.click(screen.getByRole('button', { name: 'Guardar' }));

        expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
        expect(repository.updateProfile).not.toHaveBeenCalled();
    });

    it('sin cambios deja salir; con cambios pide confirmación y respeta la respuesta (FR-008)', async () => {
        const { user, fixture } = await setup();
        const page = fixture.componentInstance;

        expect(page.canLeave()).toBe(true);

        await user.type(screen.getByLabelText(/Ciudad/), ' Sur');
        const stay = page.canLeave() as Promise<boolean>;
        await user.click(await screen.findByRole('button', { name: 'Seguir editando' }));
        await expect(stay).resolves.toBe(false);

        const leave = page.canLeave() as Promise<boolean>;
        await user.click(await screen.findByRole('button', { name: 'Descartar' }));
        await expect(leave).resolves.toBe(true);
    });

    it('un archivo inválido muestra el problema junto al logo y no sube nada (CA-007)', async () => {
        const { user, storage, container } = await setup();
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;

        await user.upload(input, new File(['texto'], 'falso.png', { type: 'image/png' }));

        expect(await screen.findByText('Usa una imagen JPG o PNG.')).toBeTruthy();
        expect(storage.upload).not.toHaveBeenCalled();
    });

    it('retirar el logo pide confirmación y, al aceptar, lo retira (CA-008)', async () => {
        const { user, repository, storage, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Retirar logo' }));
        expect(await screen.findByText('¿Retirar el logo?')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Retirar' }));

        await vi.waitFor(() => expect(repository.setLogo).toHaveBeenCalledWith(null));
        expect(storage.purge).toHaveBeenCalledWith(LOGO);
        await vi.waitFor(() => expect(toasts(messages)).toContain('Logo retirado.'));
    });

    it('sin logo muestra las iniciales y el botón Subir logo', async () => {
        await setup({ ...DATA, academy: { ...DATA.academy, logoFileId: null }, logo: null });

        expect(screen.getByText('AN')).toBeTruthy();
        expect(screen.getByRole('button', { name: /Subir logo/ })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Retirar logo' })).toBeNull();
    });
});
