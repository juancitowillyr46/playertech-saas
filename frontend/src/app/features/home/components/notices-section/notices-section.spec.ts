import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NewResponsesNotice } from '../../../../core/notices/notices.models';
import { NoticesService } from '../../../../core/notices/notices.service';
import { noticesMock } from '../../../../testing/notices-mock';
import { GuardianRepository } from '../../../players/data/guardian.repository';
import { AcademyPendingGuardian } from '../../../players/models/player.models';
import { NoticesSection } from './notices-section';

const notice = (index: number, overrides: Partial<NewResponsesNotice> = {}): NewResponsesNotice => ({
    callUpId: `c${index}`,
    activityId: `a${index}`,
    activityType: 'competition',
    opponent: 'Club Norte',
    startsAt: `2030-10-2${index}T14:00:00.000Z`,
    cancelled: false,
    newCount: 2,
    ...overrides
});
const PENDING: AcademyPendingGuardian = {
    linkId: 'l1',
    deviceId: 'd1',
    guardianName: 'Juan Rodas',
    declaredName: 'Juan',
    relationship: 'father',
    phone: '3125953354',
    at: '2030-10-20T13:15:00.000Z',
    phoneMatch: true,
    playerId: 'p1',
    playerName: 'Mateo Rodas'
};

async function setup(options: { pendingCount?: number; newResponses?: NewResponsesNotice[]; failed?: boolean; pending?: AcademyPendingGuardian[] } = {}) {
    const notices = noticesMock(options);
    const guardians = { pendingByAcademy: vi.fn().mockResolvedValue(options.pending ?? []), review: vi.fn().mockResolvedValue(undefined) };
    const result = await render(`<app-notices-section /><p-confirmdialog />`, {
        imports: [NoticesSection, (await import('primeng/confirmdialog')).ConfirmDialog],
        providers: [provideRouter([]), notices, ConfirmationService, { provide: MessageService, useValue: { add: vi.fn() } }, { provide: GuardianRepository, useValue: guardians }]
    });

    return { ...result, guardians, notices: notices.useValue as unknown as NoticesService & { refresh: ReturnType<typeof vi.fn> }, user: userEvent.setup() };
}

describe('NoticesSection', { timeout: 20_000 }, () => {
    it('sin avisos no muestra la sección', async () => {
        await setup();

        expect(screen.queryByRole('heading', { name: 'Avisos' })).toBeNull();
    });

    it('muestra los pendientes y las respuestas nuevas con su actividad (CA-002 de HU-041)', async () => {
        const { notices } = await setup({ pendingCount: 3, newResponses: [notice(5, { newCount: 5 }), notice(4, { activityType: 'training', opponent: null, newCount: 1, cancelled: true })] });

        expect(notices.refresh).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /3 acudientes por validar/ })).toBeTruthy();
        const link = screen.getByRole('link', { name: /5 respuestas nuevas/ });
        expect(link.getAttribute('href')).toBe('/activities/a5');
        expect(link.textContent).toContain('Partido contra Club Norte');
        expect(screen.getByRole('link', { name: /1 respuesta nueva/ }).textContent).toContain('Entrenamiento');
        expect(screen.getByRole('link', { name: /1 respuesta nueva/ }).textContent).toContain('(cancelada)');
    });

    it('muestra 5 avisos y «Ver más» con el resto', async () => {
        const { user } = await setup({ newResponses: [1, 2, 3, 4, 5, 6, 7].map((index) => notice(index)) });

        expect(screen.getAllByRole('link')).toHaveLength(5);
        await user.click(screen.getByRole('button', { name: 'Ver más (2)' }));
        expect(screen.getAllByRole('link')).toHaveLength(7);
    });

    it('si fallan los avisos se omiten las respuestas nuevas sin romper el inicio (FR-009)', async () => {
        await setup({ newResponses: [notice(1)], failed: true });

        expect(screen.queryByRole('heading', { name: 'Avisos' })).toBeNull();
    });

    it('el drawer agrupa por persona: un mismo celular es un solo pendiente (CA-004 de HU-041)', async () => {
        const juan = [
            { ...PENDING, linkId: 'l9', deviceId: 'd1', playerId: 'p9', playerName: 'Antony Carvajal Mejía' },
            { ...PENDING, linkId: null, deviceId: 'd1', playerId: 'p1', playerName: 'Mateo Rodas' },
            { ...PENDING, linkId: null, deviceId: 'd1', playerId: 'p2', playerName: 'Dilan Castaño' }
        ];
        const { user, guardians, notices } = await setup({ pendingCount: 1, pending: juan });

        await user.click(screen.getByRole('button', { name: /1 acudiente por validar/ }));
        const dialog = await screen.findByRole('dialog', { name: 'Por validar (1)' });
        const people = within(dialog).getByRole('list', { name: 'Personas por validar' });
        expect(within(people).getAllByRole('button', { name: /^Validar a/ })).toHaveLength(1);
        expect(within(people).getByText('Nuevo vínculo: Antony Carvajal Mejía (papá)')).toBeTruthy();
        expect(within(people).getByText('Ya es acudiente de: Mateo Rodas, Dilan Castaño')).toBeTruthy();
        expect(within(people).getByText('Coincide con Juan Rodas, acudiente registrado.')).toBeTruthy();

        await user.click(within(people).getByRole('button', { name: 'Validar a Juan · papá' }));

        expect(guardians.review).toHaveBeenCalledTimes(1);
        expect(guardians.review).toHaveBeenCalledWith('l9', 'd1', 'validate');
        expect(notices.refresh).toHaveBeenCalledTimes(2);
    });

    it('validar a una persona con dos vínculos nuevos los confirma todos; rechazar pide confirmación', async () => {
        const nueva = [
            { ...PENDING, linkId: 'l1', deviceId: 'd5', declaredName: 'Luis', phoneMatch: false, playerId: 'p1', playerName: 'Mateo Rodas' },
            { ...PENDING, linkId: 'l2', deviceId: 'd5', declaredName: 'Luis', phoneMatch: false, playerId: 'p2', playerName: 'Dilan Castaño' }
        ];
        const { user, guardians } = await setup({ pendingCount: 1, pending: nueva });

        await user.click(screen.getByRole('button', { name: /1 acudiente por validar/ }));
        const dialog = await screen.findByRole('dialog', { name: 'Por validar (1)' });
        await user.click(within(dialog).getByRole('button', { name: 'Rechazar a Luis · papá' }));
        const confirm = await screen.findByRole('alertdialog', { name: '¿Rechazar a Luis?' });
        await user.click(within(confirm).getByRole('button', { name: 'Rechazar' }));

        expect(guardians.review).toHaveBeenNthCalledWith(1, 'l1', 'd5', 'reject');
        expect(guardians.review).toHaveBeenNthCalledWith(2, 'l2', null, 'reject');
    });

    it('sin pendientes el drawer lo dice', async () => {
        const { user } = await setup({ pendingCount: 1, pending: [] });

        await user.click(screen.getByRole('button', { name: /1 acudiente por validar/ }));

        expect(await screen.findByText('No hay acudientes por validar.')).toBeTruthy();
    });
});
