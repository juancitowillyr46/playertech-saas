import { dayLabel, fromInstant, timeLabel } from '../../../shared/text/colombia-time';
import { todayInColombia } from '../../../shared/text/search-text';
import { ANSWER_SHORT_LABELS, reasonLabel } from '../../call-up-response/options/response-options';
import { LinkRelationship, relationshipLabel } from '../../players/models/player.models';
import { CurrentResponse, ResponseAnswer } from './call-up.models';

/** Textos del seguimiento (HU-011). Funciones puras. */

/** «mamá», «abuelo o abuela» o «el jugador». */
export function relationshipText(relationship: LinkRelationship | null): string {
    if (!relationship) {
        return '';
    }

    return relationshipLabel(relationship).toLocaleLowerCase('es-CO');
}

/** «Liliana Londoño · mamá», o «Registrada por ti» si la dio el owner. */
export function responderText(source: 'guardian' | 'owner' | null, guardianName: string | null, relationship: LinkRelationship | null): string {
    if (source === 'owner') {
        return 'Registrada por ti';
    }

    return [guardianName, relationshipText(relationship)].filter(Boolean).join(' · ');
}

/** «Hoy, 2:10 p. m.» */
export function whenText(instant: string | null): string {
    if (!instant) {
        return '';
    }

    const value = fromInstant(instant);

    return `${dayLabel(value.date, todayInColombia())}, ${timeLabel(value.time)}`;
}

export function answerText(answer: ResponseAnswer | null): string {
    return answer ? ANSWER_SHORT_LABELS[answer] : 'Sin respuesta';
}

/** «No · Enfermedad o lesión · mamá, hoy 2:10 p. m.» para la fila del seguimiento. */
export function responseSummary(response: CurrentResponse | null): string {
    if (!response?.answer) {
        return '';
    }

    const reason = reasonLabel(response.answer, response.reason, response.reasonText);
    const who = response.source === 'owner' ? 'registrada por ti' : relationshipText(response.relationship);
    const when = whenText(response.at).toLocaleLowerCase('es-CO');

    return [reason, [who, when].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
}
