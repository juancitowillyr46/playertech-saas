import { BreakpointObserver } from '@angular/cdk/layout';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { Activity } from '../../../activities/models/activity.models';
import { CallUpRepository } from '../../../call-ups/data/call-up.repository';
import { CallUp } from '../../../call-ups/models/call-up.models';
import { GuardianRepository } from '../../../players/data/guardian.repository';
import { PlayerRepository } from '../../../players/data/player.repository';
import { AbsenceRepository } from '../../data/absence.repository';
import { Absence } from '../../models/absence.models';
import { activityStarting, callUpPlayer, callUpWith, response, rosterPlayer } from '../../testing/absence-fixtures';
import { AbsenceSection } from './absence-section';

const ROSTER = [rosterPlayer('p1', 'Mateo', 'Rodas', ['g12']), rosterPlayer('p2', 'Ana', 'Ruiz', ['g12']), rosterPlayer('p3', 'Leo', 'Paz', ['g14'])];

async function setup(activity: Activity, options: { absences?: Absence[]; callUp?: CallUp | null } = {}) {
    const repository = { list: vi.fn().mockResolvedValue(options.absences ?? []), setAbsent: vi.fn().mockResolvedValue(undefined), markNotified: vi.fn().mockResolvedValue('2026-10-24T21:12:00.000Z') };
    const messages = { add: vi.fn() };
    const result = await render(AbsenceSection, {
        inputs: { activity },
        providers: [
            ConfirmationService,
            { provide: AbsenceRepository, useValue: repository },
            { provide: CallUpRepository, useValue: { getByActivity: vi.fn().mockResolvedValue(options.callUp ?? null), responses: vi.fn().mockResolvedValue([response('c1', 'yes'), response('c2', 'no')]) } },
            {
                provide: PlayerRepository,
                useValue: {
                    listGroups: vi.fn().mockResolvedValue([
                        { id: 'g12', name: 'Sub-12' },
                        { id: 'g14', name: 'Sub-14' }
                    ]),
                    listPlayers: vi.fn().mockResolvedValue(ROSTER)
                }
            },
            { provide: GuardianRepository, useValue: { listByPlayer: vi.fn().mockResolvedValue([{ fullName: 'Juan Rodas', phone: '3125953354', relationship: 'father' }]) } },
            { provide: MessageService, useValue: messages },
            { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } }
        ]
    });
    await result.fixture.whenStable();
    result.detectChanges();

    return { ...result, repository, messages, user: userEvent.setup() };
}

describe('AbsenceSection', { timeout: 20_000 }, () => {
    it('no aparece antes del inicio ni en una actividad cancelada (CA-001)', async () => {
        await setup(activityStarting('later'));
        expect(screen.queryByRole('heading', { name: '¿Quién no llegó?' })).toBeNull();
    });

    it('no aparece en una actividad cancelada', async () => {
        await setup(activityStarting('today', { status: 'cancelled' }));
        expect(screen.queryByRole('heading', { name: '¿Quién no llegó?' })).toBeNull();
    });

    it('al día siguiente queda en lectura, con el resumen y un ausente que ya no está en la lista (CA-001, CA-005)', async () => {
        await setup(activityStarting('yesterday'), { absences: [{ playerId: 'px', fullName: 'Tomás Arango', markedAt: 't', notifiedAt: null, active: true }] });

        expect(screen.getByText('1 no llegó · 0 avisados')).toBeTruthy();
        expect(screen.getByText('Tomás Arango · sin avisar')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Marcar quién no llegó' })).toBeNull();
    });

    it('elige grupos, busca y marca a quien no llegó (CA-002, CA-003)', async () => {
        const { user, repository, detectChanges } = await setup(activityStarting('today'));

        await user.click(screen.getByRole('button', { name: 'Marcar quién no llegó' }));
        const drawer = await screen.findByRole('dialog', { name: '¿Quién no llegó?' });
        await user.click(within(drawer).getByRole('button', { name: 'Sub-12' }));
        detectChanges();

        expect(within(drawer).getAllByRole('button', { name: /Rodas|Ruiz/ }).length).toBe(2);
        expect(within(drawer).queryByText('Leo Paz')).toBeNull();
        await user.click(within(drawer).getByRole('button', { name: 'Mateo Rodas' }));
        detectChanges();

        expect(repository.setAbsent).toHaveBeenCalledWith('a1', 'p1', true);
        expect(within(drawer).getByRole('button', { name: 'Mateo Rodas, no llegó' }).getAttribute('aria-pressed')).toBe('true');
        expect(within(drawer).getByText('1 no llegó · 0 avisados')).toBeTruthy();
    });

    it('con convocatoria agrupa por respuesta (CA-002)', async () => {
        const { user } = await setup(activityStarting('today'), { callUp: callUpWith([callUpPlayer('c1', 'Mateo', 'Rodas'), callUpPlayer('c2', 'Ana', 'Ruiz')]) });

        await user.click(screen.getByRole('button', { name: 'Marcar quién no llegó' }));
        const drawer = await screen.findByRole('dialog', { name: '¿Quién no llegó?' });

        expect(within(drawer).getByRole('heading', { name: 'Dijeron Sí (1)' })).toBeTruthy();
        expect(within(drawer).getByRole('heading', { name: 'Avisaron que no (1)' })).toBeTruthy();
        expect(within(drawer).queryByRole('button', { name: 'Grupo' })).toBeNull();
    });

    it('avisa por WhatsApp con el mensaje editable y queda «Avisado» (CA-004)', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
        const { user, repository, detectChanges } = await setup(activityStarting('today'), { absences: [{ playerId: 'p1', fullName: 'Mateo Rodas', markedAt: 't', notifiedAt: null, active: true }] });

        await user.click(screen.getByRole('button', { name: 'Marcar quién no llegó' }));
        const list = await screen.findByRole('dialog', { name: '¿Quién no llegó?' });
        await user.click(within(list).getByRole('button', { name: 'Sub-12' }));
        detectChanges();
        await user.click(within(list).getByRole('button', { name: 'Avisar sobre Mateo Rodas' }));

        const notice = await screen.findByRole('dialog', { name: 'Avisar: Mateo Rodas' });
        const text = within(notice).getByRole('textbox', { name: 'Tu mensaje' }) as HTMLTextAreaElement;
        expect(text.value).toMatch(/^Hola, Juan\. Mateo no llegó hoy al entrenamiento de las 12:00 a\. m\. en Sede principal\./);
        await user.clear(text);
        await user.type(text, 'Hola, ¿Mateo está bien?');
        await user.click(within(notice).getByRole('button', { name: 'Abrir WhatsApp' }));
        await vi.waitFor(() => expect(repository.markNotified).toHaveBeenCalledWith('a1', 'p1'));
        detectChanges();

        expect(open).toHaveBeenCalledWith(`https://wa.me/573125953354?text=${encodeURIComponent('Hola, ¿Mateo está bien?')}`, '_blank');
        expect(screen.getByText('1 no llegó · 1 avisado', { selector: 'section p' })).toBeTruthy();
        open.mockRestore();
    });
});
