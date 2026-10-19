import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { TablesUpdate } from '../../../core/supabase/database.types';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { GroupRef, PlayerInput, PlayerSummary } from '../models/player.models';
import { GroupsNotSavedError, PlayerRepository } from './player.repository';

/** Jugador con sus grupos y vínculos embebidos: una sola consulta para el listado (research R7). */
const COLUMNS = 'id, first_names, last_names, nickname, birth_date, phone, is_active, group_members(groups(id, name)), guardian_links(status, deleted_at)';

interface PlayerRow {
    id: string;
    first_names: string;
    last_names: string;
    nickname: string | null;
    birth_date: string;
    phone: string | null;
    is_active: boolean;
    group_members: { groups: GroupRef | null }[];
    guardian_links: { status: string; deleted_at: string | null }[];
}

function toPlayer(row: PlayerRow): PlayerSummary {
    return {
        id: row.id,
        firstNames: row.first_names,
        lastNames: row.last_names,
        nickname: row.nickname,
        birthDate: row.birth_date,
        phone: row.phone,
        isActive: row.is_active,
        groups: row.group_members
            .flatMap((member) => (member.groups ? [{ id: member.groups.id, name: member.groups.name }] : []))
            .sort((a, b) => a.name.localeCompare(b.name, 'es-CO')),
        guardianCount: row.guardian_links.filter((link) => link.status === 'validated' && !link.deleted_at).length
    };
}

/** Columnas del jugador que escribe el owner (sin los grupos). */
function toRow(input: PlayerInput) {
    return { first_names: input.firstNames, last_names: input.lastNames, nickname: input.nickname, birth_date: input.birthDate, phone: input.phone };
}

@Injectable()
export class SupabasePlayerRepository extends PlayerRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async listPlayers(): Promise<readonly PlayerSummary[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const { data, error } = await this.client.from('players').select(COLUMNS).is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as PlayerRow[]).map(toPlayer);
    }

    async getPlayer(id: string): Promise<PlayerSummary> {
        const { data, error } = await this.client.from('players').select(COLUMNS).eq('id', id).is('deleted_at', null).single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return toPlayer(data as unknown as PlayerRow);
    }

    async listGroups(): Promise<readonly GroupRef[]> {
        const { data, error } = await this.client.from('groups').select('id, name').is('deleted_at', null).order('name');

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data;
    }

    async findByIdentity(firstNames: string, lastNames: string, birthDate: string): Promise<string | null> {
        const { data, error } = await this.client.rpc('find_player_by_identity', { p_first_names: firstNames, p_last_names: lastNames, p_birth_date: birthDate });

        if (error) {
            throw mapSupabaseError(error);
        }

        return data?.[0]?.id ?? null;
    }

    async createPlayer(input: PlayerInput): Promise<string> {
        // La academia sale del contexto y la valida la política; created_by lo pone la base de datos.
        const academyId = this.requireAcademy();
        const { data, error } = await this.client
            .from('players')
            .insert({ academy_id: academyId, ...toRow(input) })
            .select('id')
            .single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        await this.syncGroups(academyId, data.id, [], input.groupIds);

        return data.id;
    }

    async updatePlayer(id: string, input: PlayerInput): Promise<void> {
        const academyId = this.requireAcademy();

        await this.updateRow(id, toRow(input));

        const { data, error } = await this.client.from('group_members').select('group_id').eq('player_id', id);

        if (error || !data) {
            throw new GroupsNotSavedError(id, { cause: error });
        }

        await this.syncGroups(
            academyId,
            id,
            data.map((row) => row.group_id),
            input.groupIds
        );
    }

    setActive(id: string, active: boolean): Promise<void> {
        return this.updateRow(id, { is_active: active });
    }

    deletePlayer(id: string): Promise<void> {
        return this.updateRow(id, { deleted_at: new Date().toISOString() });
    }

    /** Inserta los grupos nuevos y quita los que ya no están. */
    private async syncGroups(academyId: string, playerId: string, current: readonly string[], wanted: readonly string[]): Promise<void> {
        const added = wanted.filter((groupId) => !current.includes(groupId));
        const removed = current.filter((groupId) => !wanted.includes(groupId));

        try {
            if (added.length > 0) {
                const { error } = await this.client.from('group_members').insert(added.map((groupId) => ({ academy_id: academyId, group_id: groupId, player_id: playerId })));

                if (error) {
                    throw error;
                }
            }

            if (removed.length > 0) {
                const { error } = await this.client.from('group_members').delete().eq('player_id', playerId).in('group_id', removed);

                if (error) {
                    throw error;
                }
            }
        } catch (error) {
            throw new GroupsNotSavedError(playerId, { cause: error });
        }
    }

    /** Actualiza un jugador no eliminado; si ya no existe (PGRST116), rechaza con not_found. */
    private async updateRow(id: string, changes: TablesUpdate<'players'>): Promise<void> {
        const { data, error } = await this.client.from('players').update(changes).eq('id', id).is('deleted_at', null).select('id').single();

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
