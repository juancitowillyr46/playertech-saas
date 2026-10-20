import { Activity, activityTitle } from '../../activities/models/activity.models';
import { dayLabel, fromInstant, timeLabel } from '../../../shared/text/colombia-time';
import { shortName } from '../../players/models/player.models';
import { CallUpList, CallUpPlayer } from '../models/call-up.models';

function dateTime(instant: string): string {
    const value = fromInstant(instant);
    return `${dayLabel(value.date, value.date)} · ${timeLabel(value.time)}`;
}
function playerName(player: CallUpPlayer): string {
    return `${shortName(player)}${player.nickname ? ` · ${player.nickname}` : ''}`;
}
function details(activity: Activity): string[] {
    const start = fromInstant(activity.startsAt);
    const lines = [activityTitle(activity), dayLabel(start.date, start.date)];
    if (activity.callAt) lines.push(`Citación: ${timeLabel(fromInstant(activity.callAt).time)}`);
    lines.push(`Inicio: ${timeLabel(start.time)}`);
    if (activity.endsAt) lines.push(`Fin: ${timeLabel(fromInstant(activity.endsAt).time)}`);
    lines.push(`Lugar: ${[activity.place.name, activity.place.address, activity.place.city].filter(Boolean).join(', ')}`);
    if (activity.tournament) lines.push(`Torneo: ${activity.tournament}`);
    if (activity.notes) lines.push(activity.notes);
    return lines;
}
function join(intro: string | null, lines: readonly string[]): string {
    return [intro?.trim(), lines.filter(Boolean).join('\n')].filter(Boolean).join('\n\n');
}

export function listMessage(intro: string | null, activity: Activity, list: CallUpList, link: string, deadline: string | null): string {
    const lines = details(activity);
    if (deadline) lines.push(`Responde hasta ${dateTime(deadline)}`);
    lines.push('', `Convocados (${list.players.length}): ${list.players.map(playerName).join(', ')}`, '', `Responde aquí: ${link}`);
    return join(intro, lines);
}
export function personalMessage(intro: string | null, activity: Activity, player: CallUpPlayer, link: string, deadline: string | null): string {
    const lines = [`${playerName(player)} fue convocado.`, ...details(activity).slice(1)];
    if (deadline) lines.push(`Responde hasta ${dateTime(deadline)}`);
    lines.push('', `Responde aquí: ${link}`);
    return join(intro, lines);
}
export function cancellationNotice(activity: Activity, link: string): string {
    return [`Se cancela ${activityTitle(activity)}.`, ...details(activity).slice(1), '', `Responde aquí: ${link}`].join('\n');
}
export function changeNotice(before: Activity, after: Activity, link: string): string {
    const lines = [`Cambio en ${activityTitle(after)}`];
    if (before.startsAt !== after.startsAt) lines.push(`Inicio: ${dateTime(after.startsAt)} (antes ${dateTime(before.startsAt)})`);
    if (before.callAt !== after.callAt && after.callAt) lines.push(`Citación: ${timeLabel(fromInstant(after.callAt).time)}${before.callAt ? ` (antes ${timeLabel(fromInstant(before.callAt).time)})` : ''}`);
    if (before.place.id !== after.place.id) lines.push(`Lugar: ${after.place.name} (antes ${before.place.name})`);
    lines.push('', `Responde aquí: ${link}`);
    return lines.join('\n');
}
