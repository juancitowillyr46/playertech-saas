import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { GroupRepository } from '../../data/group.repository';
import { GroupsPage } from './groups-page';

async function setup(overrides: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
    const repository = {
        listGroups: vi.fn().mockResolvedValue([
            { id: 'g1', name: 'Sub-12', activePlayerCount: 15 },
            { id: 'g2', name: 'Veteranos', activePlayerCount: 1 }
        ]),
        createGroup: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
    const messages = { add: vi.fn() };
    const result = await render(GroupsPage, {
        providers: [
            provideRouter([]),
            { provide: GroupRepository, useValue: repository },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

describe('GroupsPage', { timeout: 20_000 }, () => {
    it('lista los grupos con su número de jugadores activos (CA-003 de HU-004)', async () => {
        await setup();

        const links = within(screen.getByRole('list', { name: 'Grupos de la academia' })).getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(within(links[0]).getByText('Sub-12')).toBeTruthy();
        expect(links[0].textContent).toContain('15 jugadores');
        expect(links[1].textContent).toContain('1 jugador');
    });

    it('sin grupos muestra el estado vacío (CA-007 de HU-004)', async () => {
        await setup({ listGroups: vi.fn().mockResolvedValue([]) });

        expect(screen.getByText('Aún no hay grupos.')).toBeTruthy();
    });

    it('crea un grupo; el nombre repetido se avisa junto al campo (CA-001 y CA-005 de HU-004)', async () => {
        const { user, repository, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Crear grupo' }));
        const dialog = await screen.findByRole('dialog', { name: 'Crear grupo' });
        await user.type(within(dialog).getByLabelText('Nombre del grupo'), ' sub-12 ');
        await user.click(within(dialog).getByRole('button', { name: 'Crear grupo' }));
        expect(within(dialog).getByText('Ya existe un grupo con ese nombre.')).toBeTruthy();
        expect(repository.createGroup).not.toHaveBeenCalled();

        await user.clear(within(dialog).getByLabelText('Nombre del grupo'));
        await user.type(within(dialog).getByLabelText('Nombre del grupo'), 'Sub-10');
        await user.click(within(dialog).getByRole('button', { name: 'Crear grupo' }));

        expect(repository.createGroup).toHaveBeenCalledWith('Sub-10');
        expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Grupo creado.' }));
    });

    it('si la base de datos rechaza el nombre por repetido, lo marca en el campo', async () => {
        const { user } = await setup({ createGroup: vi.fn().mockRejectedValue(new AppError('duplicate')) });

        await user.click(screen.getByRole('button', { name: 'Crear grupo' }));
        const dialog = await screen.findByRole('dialog', { name: 'Crear grupo' });
        await user.type(within(dialog).getByLabelText('Nombre del grupo'), 'Torneo');
        await user.click(within(dialog).getByRole('button', { name: 'Crear grupo' }));

        expect(within(dialog).getByText('Ya existe un grupo con ese nombre.')).toBeTruthy();
    });
});
