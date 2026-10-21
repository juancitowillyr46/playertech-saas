import { Activity } from '../../activities/models/activity.models';
import { dateLabel, fromInstant, timeLabel } from '../../../shared/text/colombia-time';
import { todayInColombia } from '../../../shared/text/search-text';
import { shortName } from '../../players/models/player.models';
import { CallUpList, CallUpPlayer } from '../models/call-up.models';

/**
 * Mensajes de la convocatoria para WhatsApp (spec 012, HU-012 y HU-038), con la narrativa
 * del mensaje que hoy escriben las academias: qué, cuándo y dónde en una frase, la hora de
 * llegada, las observaciones, los convocados en viñetas y cómo confirmar. Fechas absolutas
 * («sábado 24 de octubre»), porque el mensaje se lee después. Tu texto va al inicio.
 */

/** «sábado 24 de octubre» (en minúscula, para usarla dentro de una frase). */
function day(instant: string): string {
    const label = dateLabel(fromInstant(instant).date, todayInColombia());

    return `${label.charAt(0).toLocaleLowerCase('es-CO')}${label.slice(1)}`;
}

function time(instant: string): string {
    return timeLabel(fromInstant(instant).time);
}

/** «partido contra Club Norte (Torneo Liga)» o «entrenamiento». */
function what(activity: Activity): string {
    if (activity.type === 'training') {
        return 'entrenamiento';
    }

    const rival = activity.opponent ? ` contra ${activity.opponent}` : '';
    const tournament = activity.tournament ? ` (${activity.tournament})` : '';

    return `partido${rival}${tournament}`;
}

/** «Cancha El Salitre, Calle 63, Bogotá». */
function where(activity: Activity): string {
    return [activity.place.name, activity.place.address, activity.place.city].filter(Boolean).join(', ');
}

/** «Debemos estar a las 8:15 a. m.; el partido empieza a las 9:00 a. m. y termina a las 10:30 a. m.» */
function schedule(activity: Activity, subject: 'Debemos' | 'Debe'): string {
    const starts = activity.type === 'training' ? 'empezamos' : 'el partido empieza';
    const end = activity.endsAt ? ` y ${activity.type === 'training' ? 'terminamos' : 'termina'} a las ${time(activity.endsAt)}` : '';
    // Las horas ya terminan en punto («a. m.»): no se agrega otro.
    const start = `${starts} a las ${time(activity.startsAt)}${end}`;

    return activity.callAt ? `${subject} estar a las ${time(activity.callAt)}; ${start}` : `${start.charAt(0).toLocaleUpperCase('es-CO')}${start.slice(1)}`;
}

function directions(activity: Activity): string | null {
    return activity.place.directions ? `Cómo llegar: ${activity.place.directions}` : null;
}

function playerName(player: CallUpPlayer): string {
    return player.nickname ? `${shortName(player)} · ${player.nickname}` : shortName(player);
}

/** «Confirmen la asistencia antes del viernes 23 de octubre a las 8:00 p. m.:» */
function confirm(verb: 'Confirmen' | 'Confirma', deadline: string | null): string {
    return deadline ? `${verb} la asistencia antes del ${day(deadline)} a las ${time(deadline)}:` : `${verb} la asistencia aquí:`;
}

/** Párrafos separados por una línea en blanco; sin párrafos ni líneas vacías sobrantes. */
function paragraphs(...blocks: readonly (string | null | undefined | false)[]): string {
    return blocks
        .map((block) => (block || '').trim())
        .filter(Boolean)
        .join('\n\n');
}

function lines(...items: readonly (string | null | undefined | false)[]): string {
    return items.filter(Boolean).join('\n');
}

/** Mensaje del grupo: tu texto, la narrativa, los convocados en viñetas y cómo confirmar (HU-012, CA-001). */
export function listMessage(intro: string | null, activity: Activity, list: CallUpList, link: string, deadline: string | null): string {
    return paragraphs(
        intro,
        lines(`El ${day(activity.startsAt)} tenemos ${what(activity)} en ${where(activity)}. ${schedule(activity, 'Debemos')}`, directions(activity)),
        activity.notes,
        lines(`Convocados (${list.players.length}):`, ...list.players.map((player) => `• ${playerName(player)}`)),
        lines(confirm('Confirmen', deadline), link),
        '¡Los esperamos!'
    );
}

/** Mensaje personal para el acudiente (o el jugador) de un convocado (HU-012, CA-002). */
export function personalMessage(intro: string | null, activity: Activity, player: CallUpPlayer, link: string, deadline: string | null): string {
    return paragraphs(
        intro,
        lines(`${playerName(player)} está convocado al ${what(activity)} del ${day(activity.startsAt)} en ${where(activity)}. ${schedule(activity, 'Debe')}`, directions(activity)),
        activity.notes,
        lines(confirm('Confirma', deadline), link)
    );
}

/** Aviso de cancelación (HU-038, CA-001). Sin enlace: al cancelar, la convocatoria se cierra. */
export function cancellationNotice(activity: Activity): string {
    return `Se cancela el ${what(activity)} del ${day(activity.startsAt)} a las ${time(activity.startsAt)} en ${activity.place.name}.`;
}

/** Aviso de cambio (HU-038, CA-002): en viñetas, solo lo que cambió, con el dato anterior. */
export function changeNotice(before: Activity, after: Activity, link: string): string {
    const changes: string[] = [];
    const beforeDay = fromInstant(before.startsAt).date;
    const afterDay = fromInstant(after.startsAt).date;

    if (beforeDay !== afterDay) {
        changes.push(`• Nueva fecha: ${day(after.startsAt)} (antes ${day(before.startsAt)})`);
    }

    if (time(before.startsAt) !== time(after.startsAt)) {
        changes.push(`• Nueva hora de inicio: ${time(after.startsAt)} (antes ${time(before.startsAt)})`);
    }

    if (after.callAt && (!before.callAt || time(before.callAt) !== time(after.callAt))) {
        changes.push(`• Nueva hora de llegada: ${time(after.callAt)}${before.callAt ? ` (antes ${time(before.callAt)})` : ''}`);
    }

    if (before.place.id !== after.place.id) {
        changes.push(`• Nuevo lugar: ${where(after)} (antes ${before.place.name})`);
    }

    return paragraphs(lines(`Hay un cambio en el ${what(after)} del ${day(before.startsAt)}:`, ...changes), lines('Confirma o actualiza la asistencia aquí:', link));
}
