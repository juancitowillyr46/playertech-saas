import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { CurrentAcademy } from '../../../core/academy-context/models/academy-context.models';
import { AppError } from '../../../core/errors/app-error';
import { FileStorageRepository } from '../../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../../core/storage/models/storage.models';
import { HomeSummaryRepository } from '../data/home-summary.repository';
import { HomeSummaryData } from '../models/home-summary.models';
import { HomeSummaryService } from './home-summary.service';

const LOGO: StoredFile = { id: 'file-1', bucket: 'public-assets', storageKey: 'a/academy/a/file-1.png', mimeType: 'image/png', sizeBytes: 1200 };
const DATA: HomeSummaryData = { planName: 'Free', primaryVenue: { name: 'Sede Principal', city: 'Bogotá', address: null }, logo: null, contact: { phone: null, address: null } };

function setup(options: { academy?: CurrentAcademy; loadSummary?: () => Promise<unknown>; getUrl?: () => Promise<string> }) {
    const loadSummary = vi.fn(options.loadSummary ?? (() => Promise.resolve(DATA)));
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
        expect(service.summary()).toMatchObject({
            academyName: 'Academia Los Andes FC',
            initials: 'AL',
            logoUrl: null,
            planName: 'Free',
            primaryVenue: { name: 'Sede Principal', city: 'Bogotá', address: null },
            completedCount: 1
        });
        expect(loadSummary).toHaveBeenCalledWith(null);
        expect(getUrl).not.toHaveBeenCalled();
    });

    it.each([
        ['una academia recién registrada', DATA, [true, false, false, false]],
        ['con dirección de la sede principal', { ...DATA, primaryVenue: { name: 'Sede', city: null, address: 'Calle 1' } }, [true, true, false, false]],
        ['con ciudad pero sin dirección de la sede (sigue pendiente)', { ...DATA, primaryVenue: { name: 'Sede', city: 'Cali', address: '  ' } }, [true, false, false, false]],
        ['con logo', { ...DATA, logo: LOGO }, [true, false, true, false]],
        ['con teléfono pero sin dirección de la academia', { ...DATA, contact: { phone: '300', address: null } }, [true, false, false, false]],
        ['con todo completo', { ...DATA, primaryVenue: { name: 'Sede', city: null, address: 'Calle 1' }, logo: LOGO, contact: { phone: '300', address: 'Carrera 7' } }, [true, true, true, true]]
    ] as const)('calcula las tareas de «Completa tu academia»: %s (HU-032 CA-002)', async (_case, data, done) => {
        const { service } = setup({ loadSummary: () => Promise.resolve(data) });

        await service.load();

        expect(service.summary()?.tasks.map((task) => task.done)).toEqual(done);
        expect(service.summary()?.completedCount).toBe(done.filter(Boolean).length);
    });

    it('cada tarea pendiente lleva a donde se completa (HU-032 CA-003)', async () => {
        const { service } = setup({});

        await service.load();

        expect(service.summary()?.tasks.map((task) => [task.label, task.route])).toEqual([
            ['Academia creada', null],
            ['Dirección de la sede principal', '/settings/venues'],
            ['Logo de la academia', '/settings/academy'],
            ['Teléfono y dirección de la academia', '/settings/academy']
        ]);
    });

    it('con logo obtiene su URL', async () => {
        const { service, getUrl } = setup({
            academy: { id: 'a', name: 'Tigres', logoFileId: 'file-1' },
            loadSummary: () => Promise.resolve({ ...DATA, primaryVenue: null, logo: LOGO })
        });

        await service.load();

        expect(getUrl).toHaveBeenCalledWith(LOGO);
        expect(service.summary()?.logoUrl).toBe('https://example.test/logo.png');
        expect(service.summary()?.initials).toBe('T');
    });

    it('si la URL del logo falla, muestra las iniciales sin poner la página en error', async () => {
        const { service } = setup({
            academy: { id: 'a', name: 'Tigres', logoFileId: 'file-1' },
            loadSummary: () => Promise.resolve({ ...DATA, primaryVenue: null, logo: LOGO }),
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
