import { MessageService } from 'primeng/api';
import { GuardianRepository } from '../../../players/data/guardian.repository';
import { noticesMock } from '../../../../testing/notices-mock';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AcademyContextService } from '../../../../core/academy-context/academy-context.service';
import { AppError } from '../../../../core/errors/app-error';
import { FileStorageRepository } from '../../../../core/storage/data/file-storage.repository';
import { HomeSummaryRepository } from '../../data/home-summary.repository';
import { HomeSummaryData } from '../../models/home-summary.models';
import { HomePage } from './home-page';

const SUMMARY: HomeSummaryData = { planName: 'Free', primaryVenue: { name: 'Sede Chapinero', city: 'Bogotá', address: null }, logo: null, contact: { phone: null, address: null } };
const LOGO = { id: 'file-1', bucket: 'public-assets', storageKey: 'a/academy/a/file-1.png', mimeType: 'image/png', sizeBytes: 900 } as const;
const COMPLETE: HomeSummaryData = { ...SUMMARY, primaryVenue: { name: 'Sede Chapinero', city: 'Bogotá', address: 'Calle 1' }, logo: LOGO, contact: { phone: '300', address: 'Carrera 7' } };

async function setup(loadSummary: () => Promise<HomeSummaryData> = () => Promise.resolve(SUMMARY)) {
    const load = vi.fn(loadSummary);
    const result = await render(HomePage, {
        providers: [
            provideRouter([]),
            { provide: AcademyContextService, useValue: { academy: signal({ id: 'a', name: 'Academia Los Andes', logoFileId: null }) } },
            noticesMock(),
            { provide: MessageService, useValue: { add: vi.fn() } },
            { provide: GuardianRepository, useValue: { pendingByAcademy: vi.fn().mockResolvedValue([]), review: vi.fn() } },
            { provide: HomeSummaryRepository, useValue: { loadSummary: load } },
            { provide: FileStorageRepository, useValue: { getUrl: vi.fn() } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, load, user: userEvent.setup() };
}

describe('HomePage', () => {
    it('muestra el resumen real: academia con sus iniciales, plan y sede principal', async () => {
        await setup();

        expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeTruthy();
        expect(screen.getByRole('heading', { level: 2, name: 'Academia Los Andes' })).toBeTruthy();
        expect(screen.getByText('AL')).toBeTruthy();
        expect(screen.getByText('Free')).toBeTruthy();
        expect(screen.getByText('Sede Chapinero', { exact: false })).toBeTruthy();
    });

    it('sin sede principal ofrece ir a Sedes', async () => {
        await setup(() => Promise.resolve({ ...SUMMARY, primaryVenue: null }));

        expect(screen.getByText('Sin sede principal')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Ver sedes' }).getAttribute('href')).toBe('/settings/venues');
    });

    it('ante un error muestra el mensaje y reintenta', async () => {
        const failing = vi.fn<() => Promise<HomeSummaryData>>().mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce(SUMMARY);
        const { user, load, fixture, detectChanges } = await setup(failing);

        expect(screen.getByText('No pudimos cargar el resumen', { exact: false })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Reintentar' }));
        await fixture.whenStable();
        detectChanges();

        expect(load).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Free')).toBeTruthy();
    });

    it('«Completa tu academia» muestra el progreso y el estado de cada tarea (HU-032 CA-002)', async () => {
        await setup();

        const section = screen.getByRole('region', { name: 'Completa tu academia' });
        expect(within(section).getByText('1 de 4')).toBeTruthy();
        expect(within(section).getByText('Completa')).toBeTruthy();
        expect(within(section).getAllByText('Pendiente')).toHaveLength(3);
    });

    it('solo las tareas pendientes enlazan con la pantalla donde se completan (HU-032 CA-003)', async () => {
        await setup(() => Promise.resolve({ ...SUMMARY, logo: LOGO }));

        const section = screen.getByRole('region', { name: 'Completa tu academia' });
        const links = within(section).getAllByRole('link');
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/settings/venues', '/settings/academy']);
        expect(within(section).getByRole('link', { name: /Dirección de la sede principal/ })).toBeTruthy();
        expect(within(section).getByText('2 de 4')).toBeTruthy();
    });

    it('con las cuatro tareas completas no muestra la tarjeta (HU-032 CA-004)', async () => {
        await setup(() => Promise.resolve(COMPLETE));

        expect(screen.queryByRole('region', { name: 'Completa tu academia' })).toBeNull();
    });
});
