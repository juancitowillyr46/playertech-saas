import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { FileStorageRepository } from '../../../core/storage/data/file-storage.repository';
import { HomeSummaryRepository } from '../data/home-summary.repository';
import { HomeSummaryData } from '../models/home-summary.models';
import { HomePage } from './home-page';

const SUMMARY: HomeSummaryData = { planName: 'Free', primaryVenue: { name: 'Sede Chapinero', city: 'Bogotá' }, logo: null };

async function setup(loadSummary: () => Promise<HomeSummaryData> = () => Promise.resolve(SUMMARY)) {
    const load = vi.fn(loadSummary);
    const result = await render(HomePage, {
        providers: [
            provideRouter([]),
            { provide: AcademyContextService, useValue: { academy: signal({ id: 'a', name: 'Academia Los Andes', logoFileId: null }) } },
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

    it('«Completa tu academia» lista tres tareas con su enlace y sin contador', async () => {
        await setup();

        const section = screen.getByRole('region', { name: 'Completa tu academia' });
        const links = within(section).getAllByRole('link');
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/settings/academy', '/settings/academy', '/settings/venues']);
        expect(within(section).queryByText(/de 3/)).toBeNull();
    });
});
