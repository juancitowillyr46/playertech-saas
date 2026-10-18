import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { FileStorageRepository } from '../../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../../core/storage/models/storage.models';
import { AcademyProfileRepository } from '../data/academy-profile.repository';
import { PREPARE_LOGO_IMAGE } from '../data/logo-image';
import { AcademyProfileData } from '../models/academy-profile.models';
import { AcademyProfileService } from './academy-profile.service';

const OLD_LOGO: StoredFile = { id: 'file-old', bucket: 'public-assets', storageKey: 'a/academy/a/file-old.png', mimeType: 'image/png', sizeBytes: 900 };
const NEW_LOGO: StoredFile = { id: 'file-new', bucket: 'public-assets', storageKey: 'a/academy/a/file-new.png', mimeType: 'image/png', sizeBytes: 400 };
const DATA: AcademyProfileData = {
    academy: { id: 'academy-a', name: 'Academia A', contactEmail: null, contactPhone: null, address: null, city: null, logoFileId: 'file-old' },
    planName: 'Free',
    logo: OLD_LOGO
};
const PNG_FILE = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', { type: 'image/png' });

async function setup() {
    const repository = {
        getProfile: vi.fn().mockResolvedValue(DATA),
        updateProfile: vi.fn(async (input) => ({ ...DATA.academy, ...input })),
        setLogo: vi.fn().mockResolvedValue(undefined)
    };
    const storage = {
        upload: vi.fn().mockResolvedValue(NEW_LOGO),
        purge: vi.fn().mockResolvedValue(undefined),
        getUrl: vi.fn(async (file: StoredFile) => `http://storage/${file.id}`)
    };
    const academyContext = { applyAcademyChanges: vi.fn() };
    const prepared = new File(['comprimido'], 'logo.png', { type: 'image/png' });
    const prepare = vi.fn().mockResolvedValue(prepared);

    TestBed.configureTestingModule({
        providers: [
            AcademyProfileService,
            { provide: AcademyProfileRepository, useValue: repository },
            { provide: FileStorageRepository, useValue: storage },
            { provide: AcademyContextService, useValue: academyContext },
            { provide: PREPARE_LOGO_IMAGE, useValue: prepare }
        ]
    });

    const service = TestBed.inject(AcademyProfileService);
    await service.load();

    return { service, repository, storage, academyContext, prepare, prepared };
}

describe('AcademyProfileService', () => {
    it('carga el perfil con la URL del logo', async () => {
        const { service } = await setup();

        expect(service.status()).toBe('ready');
        expect(service.profile()?.logoUrl).toBe('http://storage/file-old');
    });

    it('si falla la carga queda en error', async () => {
        const { service, repository } = await setup();
        repository.getProfile.mockRejectedValue(new AppError('network'));

        await service.load();

        expect(service.status()).toBe('error');
    });

    it('guarda los datos limpios y actualiza el nombre en el contexto (CA-002)', async () => {
        const { service, repository, academyContext } = await setup();

        await service.save({ name: '  Academia Norte ', contactEmail: ' ', contactPhone: ' 300 ', address: '', city: null });

        expect(repository.updateProfile).toHaveBeenCalledWith({ name: 'Academia Norte', contactEmail: null, contactPhone: '300', address: null, city: null });
        expect(service.profile()?.academy.name).toBe('Academia Norte');
        expect(academyContext.applyAcademyChanges).toHaveBeenCalledWith({ name: 'Academia Norte' });
    });

    it('ignora una segunda operación mientras la primera está en curso', async () => {
        const { service, repository } = await setup();
        repository.updateProfile.mockReturnValue(new Promise(() => undefined));
        const input = { name: 'A', contactEmail: null, contactPhone: null, address: null, city: null };

        void service.save(input);
        await service.save(input);

        expect(repository.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('ante not_found relee el perfil y rechaza', async () => {
        const { service, repository } = await setup();
        repository.updateProfile.mockRejectedValue(new AppError('not_found'));

        await expect(service.save({ name: 'A', contactEmail: null, contactPhone: null, address: null, city: null })).rejects.toMatchObject({ code: 'not_found' });
        expect(repository.getProfile).toHaveBeenCalledTimes(2);
    });

    it('reemplaza el logo: prepara, sube, asigna y purga el anterior, en ese orden (CA-006)', async () => {
        const { service, repository, storage, academyContext, prepare, prepared } = await setup();

        await expect(service.replaceLogo(PNG_FILE)).resolves.toBeNull();

        expect(prepare).toHaveBeenCalledWith(PNG_FILE);
        expect(storage.upload).toHaveBeenCalledWith({ file: prepared, bucket: 'public-assets', module: 'academy', entityId: 'academy-a' });
        expect(repository.setLogo).toHaveBeenCalledWith('file-new');
        expect(storage.purge).toHaveBeenCalledWith(OLD_LOGO);
        expect(repository.setLogo.mock.invocationCallOrder[0]).toBeLessThan(storage.purge.mock.invocationCallOrder[0]);
        expect(service.profile()?.logoUrl).toBe('http://storage/file-new');
        expect(academyContext.applyAcademyChanges).toHaveBeenCalledWith({ logoFileId: 'file-new' });
    });

    it('si falla la asignación, purga el logo nuevo y conserva el anterior', async () => {
        const { service, repository, storage } = await setup();
        repository.setLogo.mockRejectedValue(new AppError('network'));

        await expect(service.replaceLogo(PNG_FILE)).rejects.toMatchObject({ code: 'network' });

        expect(storage.purge).toHaveBeenCalledWith(NEW_LOGO);
        expect(storage.purge).not.toHaveBeenCalledWith(OLD_LOGO);
        expect(service.profile()?.logo).toEqual(OLD_LOGO);
    });

    it('un archivo inválido devuelve el problema y no sube nada (CA-007)', async () => {
        const { service, storage } = await setup();

        await expect(service.replaceLogo(new File(['texto'], 'falso.png', { type: 'image/png' }))).resolves.toBe('type');
        expect(storage.upload).not.toHaveBeenCalled();
    });

    it('retira el logo: asigna null y purga el anterior (CA-008)', async () => {
        const { service, repository, storage, academyContext } = await setup();

        await service.removeLogo();

        expect(repository.setLogo).toHaveBeenCalledWith(null);
        expect(storage.purge).toHaveBeenCalledWith(OLD_LOGO);
        expect(service.profile()?.logo).toBeNull();
        expect(service.profile()?.logoUrl).toBeNull();
        expect(academyContext.applyAcademyChanges).toHaveBeenCalledWith({ logoFileId: null });
    });
});
