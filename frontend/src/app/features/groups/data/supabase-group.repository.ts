import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { GroupDetail, GroupMember, GroupSummary } from '../models/group.models';
import { GroupRepository } from './group.repository';

const PLAYER_COLUMNS = 'id, first_names, last_names, nickname, is_active, deleted_at';
const COLUMNS = `id, name, group_members(players(${PLAYER_COLUMNS}))`;

interface PlayerRow {
    id: string;
    first_names: string;
    last_names: string;
    nickname: string | null;
    is_active: boolean;
    deleted_at: string | null;
}

interface GroupRow {
    id: string;
    name: string;
    group_members: { players: PlayerRow | null }[];
}

function toMember(row: PlayerRow): GroupMember {
    return { playerId: row.id, firstNames: row.first_names, lastNames: row.last_names, nickname: row.nickname, isActive: row.is_active };
}

function byName(a: GroupMember, b: GroupMember): number {
    return `${a.firstNames} ${a.lastNames}`.localeCompare(`${b.firstNames} ${b.lastNames}`, 'es-CO');
}

function toDetail(row: GroupRow): GroupDetail {
    const members = row.group_members
        .map((member) => member.players)
        .filter((player): player is PlayerRow => !!player && !player.deleted_at)
        .map(toMember)
        .sort(byName);

    return { id: row.id, name: row.name, activePlayerCount: members.filter((member) => member.isActive).length, members };
}

@Injectable()
export class SupabaseGroupRepository extends GroupRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async listGroups(): Promise<readonly GroupSummary[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const { data, error } = await this.client.from('groups').select(COLUMNS).is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as GroupRow[])
            .map(toDetail)
            .map(({ id, name, activePlayerCount }) => ({ id, name, activePlayerCount }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es-CO', { numeric: true }));
    }

    async getGroup(id: string): Promise<GroupDetail> {
        const { data, error } = await this.client.from('groups').select(COLUMNS).eq('id', id).is('deleted_at', null).single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return toDetail(data as unknown as GroupRow);
    }

    async listActivePlayers(): Promise<readonly GroupMember[]> {
        const { data, error } = await this.client.from('players').select(PLAYER_COLUMNS).eq('is_active', true).is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data.map(toMember).sort(byName);
    }

    async createGroup(name: string): Promise<void> {
        const { error } = await this.client.from('groups').insert({ academy_id: this.requireAcademy(), name });

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    renameGroup(id: string, name: string): Promise<void> {
        return this.updateRow(id, { name });
    }

    deleteGroup(id: string): Promise<void> {
        return this.updateRow(id, { deleted_at: new Date().toISOString() });
    }

    async addMembers(groupId: string, playerIds: readonly string[]): Promise<void> {
        const academyId = this.requireAcademy();
        const { error } = await this.client.from('group_members').insert(playerIds.map((playerId) => ({ academy_id: academyId, group_id: groupId, player_id: playerId })));

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    async removeMember(groupId: string, playerId: string): Promise<void> {
        const { error } = await this.client.from('group_members').delete().eq('group_id', groupId).eq('player_id', playerId);

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    /** Actualiza un grupo no eliminado; si ya no existe (PGRST116), rechaza con not_found. */
    private async updateRow(id: string, changes: { name?: string; deleted_at?: string }): Promise<void> {
        const { data, error } = await this.client.from('groups').update(changes).eq('id', id).is('deleted_at', null).select('id').single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }
    }

    private requireAcademy(): string {
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        return academyId;
    }
}
