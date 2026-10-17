import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../core/academy-context/academy-context.service';
import { CurrentAcademy } from '../../core/academy-context/models/academy-context.models';
import { AppError } from '../../core/errors/app-error';
import { FileStorageRepository } from '../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../core/storage/models/storage.models';
import { HomeSummaryRepository } from './data/home-summary.repository';
import { HomeSummaryService } from './home-summary.service';

const LOGO: StoredFile = { id: 'file-1', bucket: 'public-assets', storageKey: 'a/academy/a/file-1.png', mimeType: 'image/png', sizeBytes: 1200 };

function setup(options: { academy?: CurrentAcademy; loadSummary?: () => Promise<unknown>; getUrl?: () => Promise<string> }) {
    const loadSummary = vi.fn(options.loadSummary ?? (() => Promise.resolve({ planName: 'Free', primaryVenue: { name: 'Sede Principal', city: 'Bogotá' }, logo: null })));
    const getUrl = vi.fn(options.getUrl ?? (() => Promise.resolve('https://example.test/logo.png')));

    TestBed.configureTestingModule({
        providers: [
            HomeSummaryService,
            { provide: AcademyContextService, useValue: { academy: signal(options.academy ?? { id: 'a', name: 'Academia Los Andes FC', logoFileId: null }) } },
            { provide: HomeSummaryRepository, useValue: { loadSummary } },
            { provide: FileStorageRepository, useValue: { getUrl } }
        ]
    });

    return { service: TestBed.inject(HomeSummaryService), loadSummary, getUrl };
}

describe('HomeSummaryService', () => {
    it('combina el contexto y el resumen; sin logo usa las iniciales', async () => {
        const { service, loadSummary, getUrl } = setup({});

        expect(service.status()).toBe('loading');
        await service.load();

        expect(service.status()).toBe('ready');
        expect(service.summary()).toEqual({
            academyName: 'Academia Los Andes FC',
            initials: 'AL',
            logoUrl: null,
            planName: 'Free',
            primaryVenue: { name: 'Sede Principal', city: 'Bogotá' }
        });
        expect(loadSummary).toHaveBeenCalledWith(null);
        expect(getUrl).not.toHaveBeenCalled();
    });

    it('con logo obtiene su URL', async () => {
        const { service, getUrl } = setup({
            academy: { id: 'a', name: 'Tigres', logoFileId: 'file-1' },
            loadSummary: () => Promise.resolve({ planName: 'Free', primaryVenue: null, logo: LOGO })
        });

        await service.load();

        expect(getUrl).toHaveBeenCalledWith(LOGO);
        expect(service.summary()?.logoUrl).toBe('https://example.test/logo.png');
        expect(service.summary()?.initials).toBe('T');
    });

    it('si la URL del logo falla, muestra las iniciales sin poner la página en error', async () => {
        const { service } = setup({
            academy: { id: 'a', name: 'Tigres', logoFileId: 'file-1' },
            loadSummary: () => Promise.resolve({ planName: 'Free', primaryVenue: null, logo: LOGO }),
            getUrl: () => Promise.reject(new AppError('network'))
        });

        await service.load();

        expect(service.status()).toBe('ready');
        expect(service.summary()?.logoUrl).toBeNull();
    });

    it('si el resumen falla queda en error', async () => {
        const { service } = setup({ loadSummary: () => Promise.reject(new AppError('network')) });

        await service.load();

        expect(service.status()).toBe('error');
        expect(service.summary()).toBeNull();
    });
});
