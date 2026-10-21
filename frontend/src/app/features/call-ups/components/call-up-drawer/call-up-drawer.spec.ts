import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { PlayerSummary } from '../../../players/models/player.models';
import { CallUp } from '../../models/call-up.models';
import { CallUpDrawer } from './call-up-drawer';

const player = (id: string, firstNames: string, groupIds: string[]): PlayerSummary => ({
    id,
    firstNames,
    lastNames: 'Vargas',
    nickname: null,
    birthDate: '2016-01-01',
    phone: null,
    isActive: true,
    groups: groupIds.map((groupId) => ({ id: groupId, name: groupId === 'g17' ? '2017' : '2018' })),
    guardianCount: 0
});

const CANDIDATES = [player('p1', 'Andrés', ['g17']), player('p2', 'Juan', ['g17']), player('p3', 'Mateo', ['g18'])];
const GROUPS = [
    { id: 'g17', name: '2017' },
    { id: 'g18', name: '2018' }
];

async function setup(callUp: CallUp | null = null) {
    const create = vi.fn();
    const adjust = vi.fn();
    await render(CallUpDrawer, {
        inputs: { open: true, callUp, candidates: CANDIDATES, groups: GROUPS, activityStartsAt: '2030-10-26T14:00:00.000Z' },
        on: { create, adjust },
        providers: [ConfirmationService, { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }]
    });
    const dialog = await screen.findByRole('dialog');

    return { dialog, create, adjust, user: userEvent.setup() };
}

async function choose(user: ReturnType<typeof userEvent.setup>, combobox: HTMLElement, option: string) {
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: new RegExp(option) }));
}

describe('CallUpDrawer', { timeout: 20_000 }, () => {
    beforeAll(() => {
        window.matchMedia ??= vi.fn(function () {
            return { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() };
        }) as unknown as typeof window.matchMedia;
    });

    it('convoca por grupo, quita a uno y suma a un jugador de otro grupo en esa lista (CA-001 a CA-003 de HU-007)', async () => {
        const { dialog, create, user } = await setup();

        await user.click(within(dialog).getByLabelText(/2017/));
        expect(within(dialog).getByText('Lista 2017 · 2 convocados')).toBeTruthy();
        await user.click(within(dialog).getByRole('button', { name: 'Quitar a Andrés V.' }));
        await choose(user, within(dialog).getByRole('combobox', { name: /Sumar jugador|Busca por nombre/ }), 'Mateo');
        await user.click(within(dialog).getByRole('button', { name: 'Sumar' }));
        await user.click(within(dialog).getByRole('button', { name: 'Convocar 2' }));

        expect(create).toHaveBeenCalledWith({ deadline: null, lists: [{ groupId: 'g17', playerIds: ['p2', 'p3'] }] });
    });

    it('sin grupos, una sola lista con los jugadores sumados (CA-004 de HU-007)', async () => {
        const { dialog, create, user } = await setup();

        await choose(user, within(dialog).getByRole('combobox', { name: /Sumar jugador|Busca por nombre/ }), 'Mateo');
        await user.click(within(dialog).getByRole('button', { name: 'Sumar' }));
        await user.click(within(dialog).getByRole('button', { name: 'Convocar 1' }));

        expect(create).toHaveBeenCalledWith({ deadline: null, lists: [{ groupId: null, playerIds: ['p3'] }] });
    });

    it('sin convocados no se puede convocar (CA-006 de HU-007)', async () => {
        const { dialog, create, user } = await setup();

        await user.click(within(dialog).getByRole('button', { name: 'Convocar 0' }));

        expect(within(dialog).getByText('Agrega al menos un jugador a la convocatoria.')).toBeTruthy();
        expect(create).not.toHaveBeenCalled();
    });

    it('al ajustar, quitar a un convocado emite solo ese cambio (CA-002 de HU-008)', async () => {
        const callUp: CallUp = {
            id: 'c1',
            activityId: 'a1',
            deadline: null,
            closedAt: null,
            lists: [
                {
                    id: 'l1',
                    groupId: 'g17',
                    groupName: '2017',
                    token: 't',
                    intro: null,
                    players: [
                        { playerId: 'p1', firstNames: 'Andrés', lastNames: 'Vargas', nickname: null, phone: null, guardians: [] },
                        { playerId: 'p2', firstNames: 'Juan', lastNames: 'Vargas', nickname: null, phone: null, guardians: [] }
                    ]
                }
            ]
        };
        const { dialog, adjust, user } = await setup(callUp);

        await user.click(within(dialog).getByRole('button', { name: 'Quitar a Juan V.' }));
        await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

        expect(adjust).toHaveBeenCalledWith({ removed: ['p2'], moved: [], added: [], deadline: undefined });
    });
});
