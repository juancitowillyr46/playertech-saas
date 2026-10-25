import { addDays, dayKey, toInstant } from '../../../shared/text/colombia-time';
import { CallUpGuardian } from '../../call-ups/models/call-up.models';

/** Aviso de inasistencia (spec 015, DEC-48). Solo se registran las ausencias. */
export interface Absence {
    readonly playerId: string;
    /** Nombre completo con apodo, también si el jugador ya no está en la lista. */
    readonly fullName: string;
    readonly markedAt: string;
    readonly notifiedAt: string | null;
    /** Desmarcada: no cuenta, pero conserva el último aviso por si se vuelve a marcar. */
    readonly active: boolean;
}

/** Sección de la lista: con convocatoria, según la respuesta; sin ella, los grupos elegidos. */
export type AbsenceSection = 'yes' | 'pending' | 'no' | 'group';

export interface AbsenceCandidate {
    readonly playerId: string;
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
    readonly fullName: string;
    readonly section: AbsenceSection;
    /** «Dijo Sí», «Provisional», «Sin respuesta» o «Dijo No»; null sin convocatoria. */
    readonly responseLabel: string | null;
    readonly phone: string | null;
    /** Acudientes de la convocatoria; null sin convocatoria (se leen al avisar). */
    readonly guardians: readonly CallUpGuardian[] | null;
}

/** Destinatario del aviso: un acudiente o el propio jugador. */
export interface AbsenceRecipient {
    readonly key: string;
    readonly label: string;
    readonly phone: string;
    readonly firstName: string;
    readonly isPlayer: boolean;
}

/** Antes del inicio, en el plazo (hasta el final de ese día en Colombia) o en lectura (CA-001). */
export type AbsenceWindow = 'before' | 'open' | 'closed';

export function absenceWindow(startsAt: string, now: Date = new Date()): AbsenceWindow {
    const end = toInstant(addDays(dayKey(startsAt), 1), '00:00');

    if (now.getTime() < new Date(startsAt).getTime()) {
        return 'before';
    }

    return now.getTime() < new Date(end).getTime() ? 'open' : 'closed';
}

/** «3 no llegaron · 1 avisado» (CA-005). */
export function absenceSummary(absences: readonly Absence[]): string {
    const active = absences.filter((absence) => absence.active);
    const notified = active.filter((absence) => absence.notifiedAt).length;

    return `${active.length} ${active.length === 1 ? 'no llegó' : 'no llegaron'} · ${notified} ${notified === 1 ? 'avisado' : 'avisados'}`;
}

/** Regla de la base de datos (plazo o actividad cancelada), con su texto para la pantalla. */
export class AbsenceRuleError extends Error {
    constructor(readonly reason: 'absence_window_closed' | 'activity_not_scheduled') {
        super(reason === 'absence_window_closed' ? 'Ya pasó el plazo: desde el día siguiente la lista queda en modo lectura.' : 'La actividad está cancelada: no se marcan ausencias.');
        this.name = 'AbsenceRuleError';
    }
}
