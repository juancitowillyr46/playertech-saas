import { toInstant } from '../../../shared/text/colombia-time';
import { todayInColombia } from '../../../shared/text/search-text';
import { Activity } from '../../activities/models/activity.models';
import { CallUp, CallUpPlayer, CurrentResponse } from '../../call-ups/models/call-up.models';
import { PlayerSummary } from '../../players/models/player.models';

/** Datos de prueba del aviso de inasistencia (spec 015). Las horas son relativas a hoy en Colombia. */
export function activityStarting(when: 'today' | 'later' | 'yesterday', overrides: Partial<Activity> = {}): Activity {
    const today = toInstant(todayInColombia(), '00:00');
    const startsAt = when === 'today' ? today : when === 'later' ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : new Date(new Date(today).getTime() - 60 * 60 * 1000).toISOString();

    return {
        id: 'a1',
        type: 'training',
        startsAt,
        endsAt: null,
        callAt: null,
        place: { kind: 'venue', id: 'v1', name: 'Sede principal', address: null, city: null, directions: null },
        notes: null,
        opponent: null,
        tournament: null,
        status: 'scheduled',
        seriesId: null,
        ...overrides
    };
}

export function rosterPlayer(id: string, firstNames: string, lastNames: string, groupIds: string[], overrides: Partial<PlayerSummary> = {}): PlayerSummary {
    return { id, firstNames, lastNames, nickname: null, birthDate: '2014-01-01', phone: null, isActive: true, groups: groupIds.map((groupId) => ({ id: groupId, name: groupId })), ...overrides } as PlayerSummary;
}

export function callUpPlayer(playerId: string, firstNames: string, lastNames: string, overrides: Partial<CallUpPlayer> = {}): CallUpPlayer {
    return { playerId, firstNames, lastNames, nickname: null, phone: null, guardians: [], ...overrides };
}

export function callUpWith(players: CallUpPlayer[]): CallUp {
    return { id: 'c1', activityId: 'a1', deadline: null, closedAt: null, lists: [{ id: 'l1', groupId: null, groupName: null, token: 't', intro: null, players }] };
}

export function response(playerId: string, answer: CurrentResponse['answer'], reasonText: string | null = null): CurrentResponse {
    return { listId: 'l1', playerId, answer, reason: null, reasonText } as CurrentResponse;
}
