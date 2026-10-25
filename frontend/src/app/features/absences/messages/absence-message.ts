import { fromInstant, timeLabel } from '../../../shared/text/colombia-time';
import { Activity } from '../../activities/models/activity.models';

export interface AbsenceMessageInput {
    /** Nombre del acudiente; null si se le escribe al propio jugador. */
    readonly recipientFirstName: string | null;
    readonly playerFirstName: string;
    readonly activity: Pick<Activity, 'type' | 'opponent' | 'startsAt' | 'place'>;
}

/** Primer nombre de «Juan Pablo Rodas» → «Juan». */
export function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] ?? '';
}

/**
 * Mensaje sugerido y editable del aviso (FR-005, DEC-48). No se guarda.
 * «Hola, Juan. Mateo no llegó hoy al entrenamiento de las 4:00 p. m. en Sede principal. ¿Está todo bien?»
 */
export function absenceMessage({ recipientFirstName, playerFirstName, activity }: AbsenceMessageInput): string {
    const what = activity.type === 'training' ? 'al entrenamiento' : activity.opponent ? `al partido vs. ${activity.opponent}` : 'a la competencia';
    const details = `${what} de las ${timeLabel(fromInstant(activity.startsAt).time)} en ${activity.place.name}`;

    return recipientFirstName ? `Hola, ${recipientFirstName}. ${playerFirstName} no llegó hoy ${details}. ¿Está todo bien?` : `Hola, ${playerFirstName}. No llegaste hoy ${details}. ¿Está todo bien?`;
}
