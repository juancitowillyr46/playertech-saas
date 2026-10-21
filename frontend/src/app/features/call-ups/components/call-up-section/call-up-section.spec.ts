import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { of } from 'rxjs';
import { Activity } from '../../../activities/models/activity.models';
import { PlayerRepository } from '../../../players/data/player.repository';
import { CallUpRepository } from '../../data/call-up.repository';
import { CallUp } from '../../models/call-up.models';
import { CallUpSection } from './call-up-section';

const ACTIVITY: Activity = {
    id: 'a1',
    type: 'competition',
    startsAt: '2030-10-26T14:00:00.000Z',
    endsAt: null,
    callAt: '2030-10-26T13:15:00.000Z',
    place: { kind: 'field', id: 'f1', name: 'Cancha El Salitre', address: 'Calle 63', city: 'Bogotá', directions: null },
    notes: null,
    opponent: 'Club Norte',
    tournament: null,
    status: 'scheduled',
    seriesId: null
};

const CALL_UP: CallUp = {
    id: 'c1',
    activityId: 'a1',
    deadline: '2030-10-25T01:00:00.000Z',
    closedAt: null,
    lists: [
        {
            id: 'l1',
            groupId: 'g1',
            groupName: '2017',
            token: 'abc123',
            intro: 'Hola familias de la 2017',
            players: [
                {
                    playerId: 'p1',
                    firstNames: 'Mateo',
                    lastNames: 'Ruiz',
                    nickname: null,
                    phone: null,
                    guardians: [
                        { fullName: 'Carlos Ruiz', phone: '3157779876', relationship: 'father' },
                        { fullName: 'Luz Ruiz', phone: '3201112233', relationship: 'mother' }
                    ]
                },
                { playerId: 'p2', firstNames: 'Samuel', lastNames: 'Vargas', nickname: 'Samu', phone: null, guardians: [] }
            ]
        }
    ]
};

async function setup(options: { activity?: Activity; callUp?: CallUp | null } = {}) {
    const repository = {
        getByActivity: vi.fn().mockResolvedValue(options.callUp === undefined ? CALL_UP : options.callUp),
        create: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        saveIntro: vi.fn().mockResolvedValue(undefined)
    };
    const messages = { add: vi.fn() };
    const result = await render(`<app-call-up-section [activity]="activity" /><p-confirmdialog />`, {
        imports: [CallUpSection, ConfirmDialog],
        componentProperties: { activity: options.activity ?? ACTIVITY },
        providers: [
            ConfirmationService,
            { provide: CallUpRepository, useValue: repository },
            { provide: PlayerRepository, useValue: { listPlayers: vi.fn().mockResolvedValue([]), listGroups: vi.fn().mockResolvedValue([]) } },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

describe('CallUpSection', { timeout: 20_000 }, () => {
    afterEach(() => vi.restoreAllMocks());

    it('sin convocatoria ofrece «Convocar» en una actividad próxima (CA-001 y CA-007 de HU-007)', async () => {
        await setup({ callUp: null });

        expect(screen.getByRole('button', { name: 'Convocar' })).toBeTruthy();
    });

    it('una actividad cancelada no se convoca (CA-007 de HU-007)', async () => {
        await setup({ callUp: null, activity: { ...ACTIVITY, status: 'cancelled' } });

        expect(screen.queryByRole('button', { name: 'Convocar' })).toBeNull();
        expect(screen.getByText('Solo se convoca a actividades próximas y no canceladas.')).toBeTruthy();
    });

    it('muestra el estado, la fecha límite, la lista y sus convocados (CA-001 de HU-008)', async () => {
        await setup();

        expect(screen.getByText('Abierta')).toBeTruthy();
        expect(screen.getByText(/Responde hasta el/)).toBeTruthy();
        expect(screen.getByText('2017')).toBeTruthy();
        const list = screen.getByRole('list', { name: 'Convocados de 2017' });
        expect(within(list).getByText('Samuel V. · Samu')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Ajustar convocados' })).toBeTruthy();
    });

    it('cerrar pide confirmación (CA-004 de HU-008)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Cerrar convocatoria' }));
        expect(await screen.findByText('¿Cerrar la convocatoria?')).toBeTruthy();
        await user.click(screen.getAllByRole('button', { name: 'Cerrar convocatoria' }).at(-1)!);

        expect(repository.close).toHaveBeenCalledWith('c1');
    });

    it('el mensaje de la lista lleva tu texto y el bloque generado; copiar guarda el texto cambiado (HU-012 y CA-004 de HU-013)', async () => {
        const { user, repository } = await setup();

        await user.click(screen.getByRole('button', { name: 'Mensaje para 2017' }));
        const dialog = await screen.findByRole('dialog', { name: 'Mensaje para 2017' });
        const intro = within(dialog).getByLabelText(/Tu texto/) as HTMLTextAreaElement;
        expect(intro.value).toBe('Hola familias de la 2017');
        const block = within(dialog).getByRole('region', { name: /Datos de la convocatoria/ });
        expect(block.textContent).toContain('Convocados (2):\n• Mateo R.\n• Samuel V. · Samu');
        expect(block.textContent).toContain('/c/abc123');
        expect(block.textContent).not.toContain('Hola familias');

        await user.clear(intro);
        await user.type(intro, 'Hola equipo');
        await user.click(within(dialog).getByRole('button', { name: 'Copiar mensaje' }));

        // userEvent reemplaza el portapapeles por el suyo: se lee lo copiado.
        expect(await navigator.clipboard.readText()).toMatch(/^Hola equipo\n\nEl .+ tenemos partido contra Club Norte/);
        expect(repository.saveIntro).toHaveBeenCalledWith('l1', 'Hola equipo');
    });

    it('«Enviar» abre el chat de WhatsApp del acudiente elegido (CA-002 de HU-013)', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue({ opener: {} } as Window);
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Enviar a Mateo R.' }));
        const dialog = await screen.findByRole('dialog', { name: 'Enviar a Mateo R.' });
        await user.click(within(dialog).getByLabelText('Luz Ruiz · Mamá'));
        await user.click(within(dialog).getByRole('button', { name: 'Abrir WhatsApp' }));

        expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/573201112233\?text=.*Mateo/), '_blank');
    });

    it('sin acudientes ni celular solo se puede copiar (CA-003 de HU-013)', async () => {
        const { user } = await setup();

        await user.click(screen.getByRole('button', { name: 'Enviar a Samuel V. · Samu' }));
        const dialog = await screen.findByRole('dialog', { name: 'Enviar a Samuel V.' });

        expect(within(dialog).getByText(/no tiene acudientes ni celular/)).toBeTruthy();
        expect((within(dialog).getByRole('button', { name: 'Abrir WhatsApp' }) as HTMLButtonElement).disabled).toBe(true);
        expect(within(dialog).getByRole('button', { name: 'Copiar' })).toBeTruthy();
    });
});
