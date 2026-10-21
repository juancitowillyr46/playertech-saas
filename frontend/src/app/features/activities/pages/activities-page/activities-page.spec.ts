import { CallUpRepository } from '../../../call-ups/data/call-up.repository';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { VenueRepository } from '../../../venues/data/venue.repository';
import { ActivityRepository } from '../../data/activity.repository';
import { ExternalFieldRepository } from '../../data/external-field.repository';
import { Activity } from '../../models/activity.models';
import { ActivitiesPage } from './activities-page';

const place = { kind: 'venue' as const, id: 'v1', name: 'Sede Norte', address: null, city: null, directions: null };
const activity = (id: string, startsAt: string, overrides: Partial<Activity> = {}): Activity => ({
    id,
    type: 'training',
    startsAt,
    endsAt: null,
    callAt: null,
    place,
    notes: null,
    opponent: null,
    tournament: null,
    status: 'scheduled',
    seriesId: null,
    ...overrides
});

const ACTIVITIES = [
    activity('a1', '2030-10-22T21:00:00.000Z'),
    activity('a2', '2030-10-26T14:00:00.000Z', { type: 'competition', opponent: 'Club Norte', tournament: 'Torneo Liga', place: { ...place, kind: 'field', id: 'f1', name: 'Cancha El Salitre' } }),
    activity('a3', '2030-10-26T20:00:00.000Z', { status: 'cancelled' })
];

async function setup(overrides: { list?: ReturnType<typeof vi.fn>; fields?: unknown[]; summaries?: unknown[] } = {}) {
    const repository = {
        list: overrides.list ?? vi.fn().mockResolvedValue(ACTIVITIES),
        get: vi.fn(),
        create: vi.fn().mockResolvedValue(1),
        update: vi.fn(),
        setStatus: vi.fn(),
        delete: vi.fn()
    };
    const fields = {
        list: vi.fn().mockResolvedValue(overrides.fields ?? []),
        create: vi.fn().mockResolvedValue({ id: 'f9', name: 'Cancha Nueva', address: null, city: null, directions: null }),
        update: vi.fn(),
        retire: vi.fn()
    };
    const venues = { listVenues: vi.fn().mockResolvedValue([{ id: 'v1', name: 'Sede Norte', isActive: true }]) };
    const messages = { add: vi.fn() };
    const result = await render(ActivitiesPage, {
        providers: [
            provideRouter([]),
            { provide: ActivityRepository, useValue: repository },
            { provide: CallUpRepository, useValue: { summaries: vi.fn().mockResolvedValue(overrides.summaries ?? []) } },
            { provide: ExternalFieldRepository, useValue: fields },
            { provide: VenueRepository, useValue: venues },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, fields, messages, user: userEvent.setup() };
}

describe('ActivitiesPage', { timeout: 20_000 }, () => {
    it('agrupa las próximas por día con hora, título, lugar y el sello «Cancelada» (CA-001 y CA-002 de HU-006)', async () => {
        await setup();

        const days = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent?.trim());
        expect(days).toEqual(['Martes 22 de octubre de 2030', 'Sábado 26 de octubre de 2030']);
        expect(screen.getByText('Competencia vs. Club Norte')).toBeTruthy();
        expect(screen.getByText(/Cancha El Salitre · Torneo Liga/)).toBeTruthy();
        expect(screen.getByText('9:00 a. m.')).toBeTruthy();
        expect(screen.getByText('Cancelada')).toBeTruthy();
        expect(screen.getAllByText('Por convocar').length).toBeGreaterThan(0);
        expect(screen.getAllByRole('link')[0].getAttribute('href')).toBe('/a1');
    });

    it('cambia a pasadas y vacío con su acción (CA-003 y CA-005 de HU-006)', async () => {
        const list = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]);
        const { user } = await setup({ list });

        expect(screen.getByText('No hay actividades próximas.')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Pasadas' }));

        expect(list).toHaveBeenLastCalledWith('past');
        expect(await screen.findByText('Aún no hay actividades pasadas.')).toBeTruthy();
    });

    it('el formulario exige tipo, fecha, hora y lugar (CA-003 de HU-005)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva actividad' }));
        const dialog = await screen.findByRole('dialog', { name: 'Nueva actividad' });
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(within(dialog).getByText('Elige el tipo de actividad.')).toBeTruthy();
        expect(within(dialog).getByText('Ingresa la fecha.')).toBeTruthy();
        expect(within(dialog).getByText('Ingresa la hora de inicio.')).toBeTruthy();
        expect(within(dialog).getByText('Elige el lugar.')).toBeTruthy();
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('rival y torneo solo aparecen en competencia; «Repetir» muestra los días (CA-002 y CA-006 de HU-005)', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva actividad' }));
        const dialog = await screen.findByRole('dialog', { name: 'Nueva actividad' });
        expect(within(dialog).queryByLabelText(/Rival/)).toBeNull();
        await user.click(within(dialog).getByLabelText('Competencia'));
        expect(within(dialog).getByLabelText(/Rival/)).toBeTruthy();

        await user.click(within(dialog).getByLabelText('Repetir cada semana'));
        expect(within(dialog).getByRole('group', { name: 'Días de la semana' })).toBeTruthy();
        expect(within(dialog).getByRole('button', { name: 'Martes' })).toBeTruthy();
    });

    it('«Nueva cancha» desde el formulario la crea (CA-001 de HU-037)', async () => {
        const { user, fields, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Nueva actividad' }));
        const form = await screen.findByRole('dialog', { name: 'Nueva actividad' });
        await user.click(within(form).getByRole('button', { name: 'Nueva cancha' }));
        const dialog = await screen.findByRole('dialog', { name: 'Nueva cancha' });
        await user.type(within(dialog).getByLabelText('Nombre de la cancha'), 'Cancha Nueva');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(fields.create).toHaveBeenCalledWith({ name: 'Cancha Nueva', address: null, city: null, directions: null });
        expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Cancha creada.' }));
    });

    it('una convocada muestra confirmados sobre convocados (CA-006 de HU-011)', async () => {
        await setup({
            list: vi.fn().mockResolvedValue([{ ...ACTIVITIES[1], hasCallUp: true }]),
            summaries: [
                { activityId: 'a2', callUpId: 'c', listId: 'l1', total: 10, yes: 7, maybe: 1, no: 1, unanswered: 1 },
                { activityId: 'a2', callUpId: 'c', listId: 'l2', total: 7, yes: 5, maybe: 0, no: 0, unanswered: 2 }
            ]
        });

        expect(await screen.findByText('12/17')).toBeTruthy();
        expect(screen.getByLabelText('12 de 17 confirmados')).toBeTruthy();
    });
});
