import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Json, TablesUpdate } from '../../../core/supabase/database.types';
import { CallUp, CallUpListInput } from '../models/call-up.models';
import { CallUpRepository } from './call-up.repository';

interface GuardianRow {
    full_name: string;
    phone: string;
    deleted_at: string | null;
}
interface GuardianLinkRow {
    status: string;
    deleted_at: string | null;
    relationship: 'mother' | 'father' | 'grandparent' | 'other';
    guardians: GuardianRow | null;
}
interface PlayerRow {
    first_names: string;
    last_names: string;
    nickname: string | null;
    phone: string | null;
    deleted_at: string | null;
    is_active: boolean;
    guardian_links: GuardianLinkRow[];
}
interface PlayerLinkRow {
    player_id: string;
    players: PlayerRow | null;
}
interface ListRow {
    id: string;
    group_id: string | null;
    token: string;
    intro: string | null;
    position: number;
    groups: { name: string } | null;
    call_up_players: PlayerLinkRow[];
}
interface CallUpRow {
    id: string;
    activity_id: string;
    deadline: string | null;
    closed_at: string | null;
    call_up_lists: ListRow[];
}
interface CreateCallUpArgs {
    p_activity_id: string;
    p_deadline: string;
    p_lists: Json;
}

const COLUMNS =
    'id, activity_id, deadline, closed_at, call_up_lists(id, group_id, token, intro, position, groups(name), call_up_players(player_id, players(first_names,last_names,nickname,phone,deleted_at,is_active,guardian_links(status,deleted_at,relationship,guardians(full_name,phone,deleted_at)))))';
@Injectable()
export class SupabaseCallUpRepository extends CallUpRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academy = inject(AcademyContextService);
    async getByActivity(activityId: string): Promise<CallUp | null> {
        const { data, error } = await this.client.from('call_ups').select(COLUMNS).eq('activity_id', activityId).is('deleted_at', null).maybeSingle();
        if (error) throw mapSupabaseError(error);
        if (!data) return null;
        const row = data as unknown as CallUpRow;
        return {
            id: row.id,
            activityId: row.activity_id,
            deadline: row.deadline,
            closedAt: row.closed_at,
            lists: row.call_up_lists
                .sort((a, b) => a.position - b.position)
                .map((list) => ({
                    id: list.id,
                    groupId: list.group_id,
                    groupName: list.groups?.name ?? null,
                    token: list.token,
                    intro: list.intro,
                    players: list.call_up_players.flatMap((entry) => {
                        const p = entry.players;
                        if (!p || p.deleted_at || !p.is_active) return [];
                        return [
                            {
                                playerId: entry.player_id,
                                firstNames: p.first_names,
                                lastNames: p.last_names,
                                nickname: p.nickname,
                                phone: p.phone,
                                guardians: p.guardian_links.flatMap((g) =>
                                    g.status === 'validated' && !g.deleted_at && g.guardians && !g.guardians.deleted_at ? [{ fullName: g.guardians.full_name, phone: g.guardians.phone, relationship: g.relationship }] : []
                                )
                            }
                        ];
                    })
                }))
        };
    }
    async create(activityId: string, deadline: string | null, lists: readonly CallUpListInput[]): Promise<void> {
        const args = { p_activity_id: activityId, p_deadline: deadline, p_lists: lists.map((list) => ({ group_id: list.groupId, player_ids: [...list.playerIds] })) as Json };
        const { error } = await this.client.rpc('create_call_up', args as unknown as CreateCallUpArgs);
        if (error) throw mapSupabaseError(error);
    }
    async addPlayers(callUp: CallUp, listId: string, playerIds: readonly string[]): Promise<void> {
        if (!playerIds.length) return;
        const academyId = this.requireAcademy();
        const { error } = await this.client.from('call_up_players').insert(playerIds.map((player_id) => ({ academy_id: academyId, call_up_id: callUp.id, list_id: listId, player_id })));
        if (error) throw mapSupabaseError(error);
    }
    async removePlayer(callUpId: string, playerId: string): Promise<void> {
        const { data, error } = await this.client.from('call_up_players').delete().eq('call_up_id', callUpId).eq('player_id', playerId).select('list_id').single();
        if (error) throw mapSupabaseError(error);
        const { data: remaining, error: countError } = await this.client
            .from('call_up_players')
            .select('player_id')
            .eq('list_id', (data as unknown as { list_id: string }).list_id);
        if (countError) throw mapSupabaseError(countError);
        if (!remaining?.length) {
            const { error: deleteError } = await this.client
                .from('call_up_lists')
                .delete()
                .eq('id', (data as unknown as { list_id: string }).list_id);
            if (deleteError) throw mapSupabaseError(deleteError);
        }
    }
    async movePlayer(callUpId: string, playerId: string, listId: string): Promise<void> {
        const { error } = await this.client.from('call_up_players').update({ list_id: listId }).eq('call_up_id', callUpId).eq('player_id', playerId);
        if (error) throw mapSupabaseError(error);
    }
    async setDeadline(id: string, deadline: string | null): Promise<void> {
        await this.updateCallUp(id, { deadline });
    }
    async close(id: string): Promise<void> {
        await this.updateCallUp(id, { closed_at: new Date().toISOString() });
    }
    async saveIntro(id: string, intro: string | null): Promise<void> {
        const { error } = await this.client.from('call_up_lists').update({ intro }).eq('id', id);
        if (error) throw mapSupabaseError(error);
    }
    private async updateCallUp(id: string, changes: TablesUpdate<'call_ups'>) {
        const { error } = await this.client.from('call_ups').update(changes).eq('id', id);
        if (error) throw mapSupabaseError(error);
    }
    private requireAcademy(): string {
        const id = this.academy.academy()?.id;
        if (!id) throw new AppError('forbidden');
        return id;
    }
}
