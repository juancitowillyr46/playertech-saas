import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { fullNameWithNickname } from '../../players/models/player.models';
import { Absence, AbsenceRuleError } from '../models/absence.models';
import { AbsenceRepository } from './absence.repository';

interface AbsenceRow {
    player_id: string;
    marked_at: string;
    notified_at: string | null;
    deleted_at: string | null;
    players: { first_names: string; last_names: string; nickname: string | null } | null;
}

const RULES = ['absence_window_closed', 'activity_not_scheduled'] as const;

/** Las reglas de plazo y de actividad cancelada llegan con su nombre; el resto, como AppError. */
function toError(error: unknown): Error {
    const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
    const rule = RULES.find((reason) => message.includes(reason));

    return rule ? new AbsenceRuleError(rule) : mapSupabaseError(error);
}

/** La RLS limita a la academia; el jugador se lee aunque esté inactivo o eliminado. */
@Injectable()
export class SupabaseAbsenceRepository extends AbsenceRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async list(activityId: string): Promise<readonly Absence[]> {
        const { data, error } = await this.client.from('player_absences').select('player_id, marked_at, notified_at, deleted_at, players(first_names, last_names, nickname)').eq('activity_id', activityId).order('marked_at');

        if (error) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as AbsenceRow[])
            .filter((row) => !row.deleted_at || row.notified_at)
            .map((row) => ({
                playerId: row.player_id,
                fullName: row.players ? fullNameWithNickname({ firstNames: row.players.first_names, lastNames: row.players.last_names, nickname: row.players.nickname }) : '',
                markedAt: row.marked_at,
                notifiedAt: row.notified_at,
                active: !row.deleted_at
            }));
    }

    async setAbsent(activityId: string, playerId: string, absent: boolean): Promise<void> {
        const { error } = await this.client.rpc('set_absence', { p_activity_id: activityId, p_player_id: playerId, p_absent: absent });

        if (error) {
            throw toError(error);
        }
    }

    async markNotified(activityId: string, playerId: string): Promise<string> {
        const { data, error } = await this.client.rpc('mark_absence_notified', { p_activity_id: activityId, p_player_id: playerId });

        if (error) {
            throw toError(error);
        }

        return data as string;
    }
}
