import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter, Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { CallUpRepository } from '../../../call-ups/data/call-up.repository';
import { CallUp } from '../../../call-ups/models/call-up.models';
import { PlayerRepository } from '../../../players/data/player.repository';
import { VenueRepository } from '../../../venues/data/venue.repository';
import { ActivityRepository } from '../../data/activity.repository';
import { ExternalFieldRepository } from '../../data/external-field.repository';
import { Activity } from '../../models/activity.models';
import { ActivityPage } from './activity-page';

const UPCOMING: Activity = {
    id: 'a1',
    type: 'competition',
    startsAt: '2030-10-26T14:00:00.000Z',
    endsAt: '2030-10-26T15:30:00.000Z',
    callAt: '2030-10-26T13:15:00.000Z',
    place: { kind: 'field', id: 'f1', name: 'Cancha El Salitre', address: 'Calle 63', city: 'Bogotá', directions: 'Puerta 4' },
    notes: 'Uniforme azul',
    opponent: 'Club Norte',
    tournament: 'Torneo Liga',
    status: 'scheduled',
    seriesId: null
};

async function setup(activity: Activity | Error = UPCOMING, callUp: CallUp | null = null) {
    const repository = {
        list: vi.fn().mockResolvedValue([]),
        get: activity instanceof Error ? vi.fn().mockRejectedValue(activity) : vi.fn().mockResolvedValue(activity),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        setStatus: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
    };
    const messages = { add: vi.fn() };
    const result = await render(ActivityPage, {
        inputs: { id: 'a1' },
        providers: [
            provideRouter([]),
            { provide: ActivityRepository, useValue: repository },
            { provide: ExternalFieldRepository, useValue: { list: vi.fn().mockResolvedValue([]) } },
            { provide: VenueRepository, useValue: { listVenues: vi.fn().mockResolvedValue([]) } },
            { provide: CallUpRepository, useValue: { getByActivity: vi.fn().mockResolvedValue(callUp) } },
            { provide: PlayerRepository, useValue: { listPlayers: vi.fn().mockResolvedValue([]), listGroups: vi.fn().mockResolvedValue([]) } },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

async function chooseMenuItem(user: ReturnType<typeof userEvent.setup>, name: string) {
    const item = within(await screen.findByRole('menu')).getByRole('menuitem', { name });
    await user.click((item.querySelector('a, [data-pc-section="itemcontent"]') as HTMLElement | null) ?? item);
}

describe('ActivityPage', { timeout: 20_000 }, () => {
    it('muestra todos los datos, con las indicaciones del lugar (CA-004 de HU-006)', async () => {
        await setup();

        expect(screen.getByRole('heading', { level: 1, name: 'Competencia vs. Club Norte' })).toBeTruthy();
        expect(screen.getByText('8:15 a. m.')).toBeTruthy();
        expect(screen.getByText(/9:00 a\. m\. – 10:30 a\. m\./)).toBeTruthy();
        expect(screen.getByText('Calle 63 · Bogotá · Puerta 4')).toBeTruthy();
        expect(screen.getByText('Torneo Liga')).toBeTruthy();
    });

    it('cancela con confirmación y luego permite reactivar (CA-002 de HU-036)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Cancelar actividad' }));
        expect(await screen.findByText('¿Cancelar la actividad?')).toBeTruthy();
        repository.get.mockResolvedValue({ ...UPCOMING, status: 'cancelled' });
        await user.click(screen.getAllByRole('button', { name: 'Cancelar actividad' }).at(-1)!);

        expect(repository.setStatus).toHaveBeenCalledWith('a1', 'cancelled');
        expect(await screen.findByRole('button', { name: 'Reactivar' })).toBeTruthy();
    });

    it('una pasada no se edita ni se cancela; solo se elimina (CA-003 y CA-006 de HU-036)', async () => {
        const { user, repository, fixture } = await setup({ ...UPCOMING, startsAt: '2020-01-01T14:00:00.000Z', endsAt: null, callAt: null });
        const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigate').mockResolvedValue(true);

        expect(screen.getByText('Esta actividad ya pasó: no se puede modificar.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancelar actividad' })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Más acciones de la actividad' }));
        await chooseMenuItem(user, 'Eliminar actividad');
        expect(await screen.findByText(/¿Eliminar «Competencia vs\. Club Norte»\?/)).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(repository.delete).toHaveBeenCalledWith('a1');
        expect(navigate).toHaveBeenCalledWith(['/activities']);
    });

    it('editar abre el formulario con sus datos y sin «Repetir» (CA-001 de HU-036)', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Editar' }));
        const dialog = await screen.findByRole('dialog', { name: 'Editar actividad' });

        expect((within(dialog).getByLabelText(/Rival/) as HTMLInputElement).value).toBe('Club Norte');
        expect(within(dialog).queryByLabelText('Repetir cada semana')).toBeNull();
    });

    it('una actividad que ya no existe muestra el aviso', async () => {
        await setup(new AppError('not_found'));

        expect(screen.getByText('Esta actividad ya no existe.')).toBeTruthy();
    });

    it('cancelar con la convocatoria abierta ofrece el aviso de cancelación (CA-001 de HU-038)', async () => {
        const callUp: CallUp = {
            id: 'c1',
            activityId: 'a1',
            deadline: null,
            closedAt: null,
            lists: [{ id: 'l1', groupId: 'g1', groupName: '2017', token: 'abc123', intro: null, players: [{ playerId: 'p1', firstNames: 'Juan', lastNames: 'Pérez', nickname: null, phone: null, guardians: [] }] }]
        };
        const { user } = await setup(UPCOMING, callUp);

        expect(await screen.findByText('Abierta')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Cancelar actividad' }));
        await user.click(screen.getAllByRole('button', { name: 'Cancelar actividad' }).at(-1)!);

        const dialog = await screen.findByRole('dialog', { name: 'Avisar a los convocados' });
        expect(within(dialog).getByText(/Se cancela el partido contra Club Norte/)).toBeTruthy();
        expect(within(dialog).queryByText(/\/c\/abc123/)).toBeNull();
    });
});
