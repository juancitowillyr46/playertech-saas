import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Json, TablesUpdate } from '../../../core/supabase/database.types';
import { CallUp, CallUpListInput, CallUpSummary, CurrentResponse, OwnerResponseInput, ResponseAnswer, ResponseEntry } from '../models/call-up.models';
import { CallUpRepository } from './call-up.repository';

interface GuardianRow {
    full_name: string;
    phone: string;
    deleted_at: string | null;
}
interface GuardianLinkRow {
    status: string;
    deleted_at: string | null;
    relationship: 'mother' | 'father' | 'grandparent' | 'other' | 'self';
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
/** Fila de la vista `call_up_current_responses`. */
interface CurrentResponseRow {
    list_id: string;
    player_id: string;
    answer: ResponseAnswer | null;
    reason: string | null;
    reason_text: string | null;
    source: CurrentResponse['source'];
    created_at: string | null;
    guardian_name: string | null;
    relationship: CurrentResponse['relationship'];
    guardian_link_id: string | null;
    link_status: CurrentResponse['linkStatus'];
    device_id: string | null;
    device_status: CurrentResponse['deviceStatus'];
    declared_name: string | null;
    unvalidated: boolean | null;
    phone_match: boolean | null;
}
interface SummaryRow {
    activity_id: string;
    call_up_id: string;
    list_id: string;
    total: number;
    yes: number;
    maybe: number;
    no: number;
    unanswered: number;
}
interface HistoryRow {
    id: string;
    answer: ResponseAnswer;
    reason: string | null;
    reason_text: string | null;
    source: 'guardian' | 'owner';
    created_at: string;
    guardian_links: { relationship: ResponseEntry['relationship']; status: string; guardians: { full_name: string } | null } | null;
    guardian_devices: { status: string; declared_name: string | null } | null;
}
const CURRENT_COLUMNS = 'list_id, player_id, answer, reason, reason_text, source, created_at, guardian_name, relationship, guardian_link_id, link_status, device_id, device_status, declared_name, unvalidated, phone_match';
const HISTORY_COLUMNS = 'id, answer, reason, reason_text, source, created_at, guardian_links(relationship, status, guardians(full_name)), guardian_devices(status, declared_name)';
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
                        const valid = p.guardian_links.filter((g) => g.status === 'validated' && !g.deleted_at && g.guardians && !g.guardians.deleted_at);
                        const self = valid.find((g) => g.relationship === 'self');
                        return [
                            {
                                playerId: entry.player_id,
                                firstNames: p.first_names,
                                lastNames: p.last_names,
                                nickname: p.nickname,
                                phone: p.phone ?? self?.guardians?.phone ?? null,
                                guardians: valid.flatMap((g) => (g.relationship === 'self' || !g.guardians ? [] : [{ fullName: g.guardians.full_name, phone: g.guardians.phone, relationship: g.relationship }]))
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
    async responses(callUpId: string): Promise<readonly CurrentResponse[]> {
        const { data, error } = await this.client.from('call_up_current_responses').select(CURRENT_COLUMNS).eq('call_up_id', callUpId);
        if (error) throw mapSupabaseError(error);

        return (data as unknown as CurrentResponseRow[]).map((row) => ({
            listId: row.list_id,
            playerId: row.player_id,
            answer: row.answer,
            reason: row.reason,
            reasonText: row.reason_text,
            source: row.source,
            at: row.created_at,
            guardianName: row.guardian_name,
            relationship: row.relationship,
            linkId: row.guardian_link_id,
            linkStatus: row.link_status,
            deviceId: row.device_id,
            deviceStatus: row.device_status,
            declaredName: row.declared_name,
            unvalidated: row.unvalidated ?? false,
            phoneMatch: row.phone_match ?? false
        }));
    }
    async summaries(activityIds: readonly string[]): Promise<readonly CallUpSummary[]> {
        if (!activityIds.length) return [];
        const { data, error } = await this.client
            .from('call_up_summaries')
            .select('activity_id, call_up_id, list_id, total, yes, maybe, no, unanswered')
            .in('activity_id', [...activityIds]);
        if (error) throw mapSupabaseError(error);

        return (data as unknown as SummaryRow[]).map((row) => ({
            activityId: row.activity_id,
            callUpId: row.call_up_id,
            listId: row.list_id,
            total: row.total,
            yes: row.yes,
            maybe: row.maybe,
            no: row.no,
            unanswered: row.unanswered
        }));
    }
    async history(callUpId: string, playerId: string): Promise<readonly ResponseEntry[]> {
        const { data, error } = await this.client.from('call_up_responses').select(HISTORY_COLUMNS).eq('call_up_id', callUpId).eq('player_id', playerId).order('created_at', { ascending: false });
        if (error) throw mapSupabaseError(error);

        return (data as unknown as HistoryRow[]).map((row) => ({
            id: row.id,
            answer: row.answer,
            reason: row.reason,
            reasonText: row.reason_text,
            source: row.source,
            at: row.created_at,
            guardianName: row.guardian_links?.guardians?.full_name ?? null,
            relationship: row.guardian_links?.relationship ?? null,
            declaredName: row.guardian_devices?.declared_name ?? null,
            counts: row.source === 'owner' || (row.guardian_links?.status !== 'rejected' && row.guardian_devices?.status !== 'revoked')
        }));
    }
    async respondAsOwner(callUpId: string, playerId: string, input: OwnerResponseInput): Promise<void> {
        const { error } = await this.client.from('call_up_responses').insert({
            academy_id: this.requireAcademy(),
            call_up_id: callUpId,
            player_id: playerId,
            answer: input.answer,
            reason: input.reason,
            reason_text: input.reasonText,
            source: 'owner'
        });
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
