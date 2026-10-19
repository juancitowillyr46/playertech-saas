import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter, Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { GroupRepository } from '../../data/group.repository';
import { GroupDetail } from '../../models/group.models';
import { GroupPage } from './group-page';

const member = (playerId: string, firstNames: string, isActive = true) => ({ playerId, firstNames, lastNames: 'Vargas', nickname: null, isActive });
const GROUP: GroupDetail = { id: 'g1', name: 'Sub-12', activePlayerCount: 1, members: [member('p3', 'Andrés', false), member('p1', 'Samuel')] };

async function setup() {
    const repository = {
        listGroups: vi.fn().mockResolvedValue([{ id: 'g1', name: 'Sub-12', activePlayerCount: 1 }]),
        getGroup: vi.fn().mockResolvedValue(GROUP),
        listActivePlayers: vi.fn().mockResolvedValue([member('p1', 'Samuel'), member('p2', 'Tomás'), member('p4', 'Juan')]),
        renameGroup: vi.fn().mockResolvedValue(undefined),
        deleteGroup: vi.fn().mockResolvedValue(undefined),
        addMembers: vi.fn().mockResolvedValue(undefined),
        removeMember: vi.fn().mockResolvedValue(undefined)
    };
    const messages = { add: vi.fn() };
    const result = await render(GroupPage, {
        inputs: { id: 'g1' },
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

async function chooseMenuItem(user: ReturnType<typeof userEvent.setup>, name: string) {
    const item = within(await screen.findByRole('menu')).getByRole('menuitem', { name });
    await user.click((item.querySelector('a, [data-pc-section="itemcontent"]') as HTMLElement | null) ?? item);
}

describe('GroupPage', { timeout: 20_000 }, () => {
    it('muestra los integrantes, con el sello «Inactivo» en los inactivos (CA-004 de HU-004)', async () => {
        await setup();

        expect(screen.getByRole('heading', { level: 1, name: 'Sub-12' })).toBeTruthy();
        expect(screen.getByText('1 jugador activo')).toBeTruthy();
        const items = within(screen.getByRole('list', { name: 'Integrantes del grupo' })).getAllByRole('listitem');
        expect(items[0].textContent).toContain('Inactivo');
        expect(items[1].textContent).not.toContain('Inactivo');
    });

    it('agrega varios jugadores con el buscador; solo ofrece los que no están (CA-004 de HU-004, SC-004)', async () => {
        const { user, repository, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Agregar jugadores' }));
        const dialog = await screen.findByRole('dialog', { name: 'Agregar jugadores' });
        expect(within(dialog).queryByText(/Samuel/)).toBeNull();

        await user.type(within(dialog).getByRole('searchbox', { name: 'Buscar jugador' }), 'tomas');
        await user.click(within(dialog).getByLabelText('Tomás Vargas'));
        await user.clear(within(dialog).getByRole('searchbox', { name: 'Buscar jugador' }));
        await user.click(within(dialog).getByLabelText('Juan Vargas'));
        await user.click(within(dialog).getByRole('button', { name: 'Agregar 2 jugadores' }));

        expect(repository.addMembers).toHaveBeenCalledWith('g1', ['p2', 'p4']);
        expect(messages.add).toHaveBeenCalledWith(expect.objectContaining({ summary: '2 jugadores agregados.' }));
    });

    it('quita a un integrante sin confirmación', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Quitar a Samuel Vargas' }));

        expect(repository.removeMember).toHaveBeenCalledWith('g1', 'p1');
    });

    it('renombra el grupo (CA-002 de HU-004)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Más acciones del grupo' }));
        await chooseMenuItem(user, 'Renombrar');
        const dialog = await screen.findByRole('dialog', { name: 'Renombrar grupo' });
        await user.clear(within(dialog).getByLabelText('Nombre del grupo'));
        await user.type(within(dialog).getByLabelText('Nombre del grupo'), 'Sub-13');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(repository.renameGroup).toHaveBeenCalledWith('g1', 'Sub-13');
    });

    it('elimina con confirmación de que los jugadores siguen registrados (CA-006 de HU-004)', async () => {
        const { user, repository, fixture } = await setup();
        const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigate').mockResolvedValue(true);

        await user.click(screen.getByRole('button', { name: 'Más acciones del grupo' }));
        await chooseMenuItem(user, 'Eliminar grupo');
        expect(await screen.findByText(/Sus jugadores siguen registrados/)).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(repository.deleteGroup).toHaveBeenCalledWith('g1');
        expect(navigate).toHaveBeenCalledWith(['/players/groups']);
    });
});
