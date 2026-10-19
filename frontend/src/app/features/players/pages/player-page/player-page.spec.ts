import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter, Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { LegalDocumentsRepository } from '../../../../core/legal/data/legal-documents.repository';
import { GuardianRepository } from '../../data/guardian.repository';
import { PlayerRepository } from '../../data/player.repository';
import { Guardian, PlayerSummary } from '../../models/player.models';
import { PlayerPage } from './player-page';

const SAMUEL: PlayerSummary = {
    id: 'p1',
    firstNames: 'Samuel',
    lastNames: 'Vargas',
    nickname: 'Samu',
    birthDate: '2014-05-10',
    phone: '3001234567',
    isActive: true,
    groups: [{ id: 'g1', name: 'Sub-12' }],
    guardianCount: 1
};
const CARLOS: Guardian = { linkId: 'l1', guardianId: 'gd1', fullName: 'Carlos Vargas', phone: '3157779876', relationship: 'father', otherPlayers: ['Tomás V.'] };

async function setup(options: { player?: Partial<Record<string, ReturnType<typeof vi.fn>>>; guardian?: Partial<Record<string, ReturnType<typeof vi.fn>>> } = {}) {
    const players = {
        getPlayer: vi.fn().mockResolvedValue(SAMUEL),
        listGroups: vi.fn().mockResolvedValue([{ id: 'g1', name: 'Sub-12' }]),
        updatePlayer: vi.fn().mockResolvedValue(undefined),
        setActive: vi.fn().mockResolvedValue(undefined),
        deletePlayer: vi.fn().mockResolvedValue(undefined),
        ...options.player
    };
    const guardians = {
        listByPlayer: vi.fn().mockResolvedValue([CARLOS]),
        findByPhone: vi.fn().mockResolvedValue(null),
        addToPlayer: vi.fn().mockResolvedValue({ guardianExisted: false, guardianName: 'Diana Gómez' }),
        updateGuardian: vi.fn().mockResolvedValue(undefined),
        updateRelationship: vi.fn().mockResolvedValue(undefined),
        removeFromPlayer: vi.fn().mockResolvedValue(undefined),
        ...options.guardian
    };
    const messages = { add: vi.fn() };
    const result = await render(PlayerPage, {
        inputs: { id: 'p1' },
        providers: [
            provideRouter([]),
            { provide: PlayerRepository, useValue: players },
            { provide: GuardianRepository, useValue: guardians },
            { provide: LegalDocumentsRepository, useValue: { getCurrent: vi.fn().mockResolvedValue({ privacyPolicy: { url: 'https://legal/privacy', version: '1', type: 'privacy_policy' } }) } },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, players, guardians, messages, user: userEvent.setup() };
}

const toasts = (messages: { add: ReturnType<typeof vi.fn> }) => messages.add.mock.calls.map(([message]) => message.summary);

async function chooseMenuItem(user: ReturnType<typeof userEvent.setup>, name: string) {
    const item = within(await screen.findByRole('menu')).getByRole('menuitem', { name });
    await user.click((item.querySelector('a, [data-pc-section="itemcontent"]') as HTMLElement | null) ?? item);
}

/** Llena el drawer de acudiente esperando el aviso anticipado del celular (300 ms). */
async function fillGuardian(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, phone: string, name?: string) {
    await user.type(within(dialog).getByLabelText('Celular'), phone);
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (name) {
        await user.type(within(dialog).getByLabelText('Nombre completo'), name);
    }

    await user.click(within(dialog).getByLabelText('Mamá'));
}

describe('PlayerPage', { timeout: 20_000 }, () => {
    it('muestra la ficha con datos, grupos, estado y acudientes (CA-001 de HU-033)', async () => {
        await setup();

        expect(screen.getByRole('heading', { level: 1, name: 'Samuel Vargas' })).toBeTruthy();
        expect(screen.getByText(/Nació el 10\/05\/2014 · Celular 3001234567/)).toBeTruthy();
        expect(screen.getByText('Sub-12')).toBeTruthy();
        const guardians = screen.getByRole('list', { name: 'Acudientes del jugador' });
        expect(within(guardians).getByText(/Papá · 3157779876 · También de Tomás V\./)).toBeTruthy();
    });

    it('un jugador que ya no existe muestra el aviso', async () => {
        await setup({ player: { getPlayer: vi.fn().mockRejectedValue(new AppError('not_found')) } });

        expect(screen.getByText('Este jugador ya no está registrado.')).toBeTruthy();
    });

    it('desactiva sin confirmación (CA-003 de HU-033)', async () => {
        const { user, players, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Desactivar' }));

        expect(players.setActive).toHaveBeenCalledWith('p1', false);
        expect(toasts(messages)).toContain('Jugador desactivado.');
    });

    it('edita los grupos en el drawer (CA-002 de HU-033)', async () => {
        const { user, players } = await setup();

        await user.click(screen.getByRole('button', { name: 'Editar' }));
        const dialog = await screen.findByRole('dialog', { name: 'Editar jugador' });
        expect((within(dialog).getByLabelText('Nombres') as HTMLInputElement).value).toBe('Samuel');
        await user.clear(within(dialog).getByLabelText(/Apodo/));
        await user.type(within(dialog).getByLabelText(/Apodo/), 'Sami');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(players.updatePlayer).toHaveBeenCalledWith('p1', expect.objectContaining({ nickname: 'Sami', groupIds: ['g1'] }));
    });

    it('elimina tras una confirmación que lo nombra y vuelve al listado (CA-004 de HU-033)', async () => {
        const { user, players, fixture } = await setup();
        const navigate = vi.spyOn(fixture.debugElement.injector.get(Router), 'navigate').mockResolvedValue(true);

        await user.click(screen.getByRole('button', { name: 'Más acciones del jugador' }));
        await chooseMenuItem(user, 'Eliminar jugador');
        expect(await screen.findByText('¿Eliminar a Samuel Vargas?')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(players.deletePlayer).toHaveBeenCalledWith('p1');
        expect(navigate).toHaveBeenCalledWith(['/players']);
    });

    it('agrega un acudiente solo con la autorización marcada (CA-001, CA-002 y CA-006 de HU-034)', async () => {
        const { user, guardians, messages } = await setup();

        await user.click(screen.getByRole('button', { name: 'Agregar acudiente' }));
        const dialog = await screen.findByRole('dialog', { name: 'Agregar acudiente de Samuel' });
        expect(within(dialog).getByRole('link', { name: 'Política de Tratamiento de Datos' }).getAttribute('href')).toBe('https://legal/privacy');

        await fillGuardian(user, dialog, '310 555 1234', 'Diana Gómez');
        await user.click(within(dialog).getByRole('button', { name: 'Agregar acudiente' }));
        expect(within(dialog).getByText('Confirma que el acudiente autorizó el tratamiento de sus datos.')).toBeTruthy();
        expect(guardians.addToPlayer).not.toHaveBeenCalled();

        await user.click(within(dialog).getByLabelText(/El acudiente autoriza/));
        await user.click(within(dialog).getByRole('button', { name: 'Agregar acudiente' }));

        expect(guardians.addToPlayer).toHaveBeenCalledWith('p1', { fullName: 'Diana Gómez', phone: '3105551234', relationship: 'mother' });
        expect(toasts(messages)).toContain('Acudiente agregado.');
    });

    it('celular ya registrado: avisa y vincula a la misma persona (CA-003 de HU-034)', async () => {
        const { user, guardians } = await setup({
            guardian: {
                findByPhone: vi.fn().mockResolvedValue({ guardianId: 'gd1', fullName: 'Carlos Vargas' }),
                addToPlayer: vi.fn().mockResolvedValue({ guardianExisted: true, guardianName: 'Carlos Vargas' })
            }
        });

        await user.click(screen.getByRole('button', { name: 'Agregar acudiente' }));
        const dialog = await screen.findByRole('dialog', { name: 'Agregar acudiente de Samuel' });
        await fillGuardian(user, dialog, '3157779876');

        expect(within(dialog).getByText(/Este celular es de Carlos Vargas, ya registrado/)).toBeTruthy();
        expect((within(dialog).getByLabelText('Nombre completo') as HTMLInputElement).value).toBe('Carlos Vargas');

        await user.click(within(dialog).getByLabelText(/El acudiente autoriza/));
        await user.click(within(dialog).getByRole('button', { name: 'Agregar acudiente' }));

        expect(guardians.addToPlayer).toHaveBeenCalledWith('p1', expect.objectContaining({ fullName: 'Carlos Vargas', phone: '3157779876' }));
    });

    it('editar con el celular de otro acudiente muestra el error junto al campo; retirar pide confirmación (CA-005 de HU-034)', async () => {
        const { user, guardians } = await setup({ guardian: { updateGuardian: vi.fn().mockRejectedValue(new AppError('duplicate')) } });

        await user.click(screen.getByRole('button', { name: 'Acciones de Carlos Vargas' }));
        await chooseMenuItem(user, 'Editar');
        const dialog = await screen.findByRole('dialog', { name: 'Editar acudiente' });
        await user.clear(within(dialog).getByLabelText('Celular'));
        await user.type(within(dialog).getByLabelText('Celular'), '3105551234');
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
        expect(within(dialog).getByText('Ese celular ya es de otro acudiente.')).toBeTruthy();

        await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
        await user.click(await screen.findByRole('button', { name: 'Descartar' }));
        await user.click(screen.getByRole('button', { name: 'Acciones de Carlos Vargas' }));
        await chooseMenuItem(user, 'Retirar');
        expect(await screen.findByText('¿Retirar a Carlos Vargas?')).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Retirar' }));

        expect(guardians.removeFromPlayer).toHaveBeenCalledWith('l1');
    });
});
