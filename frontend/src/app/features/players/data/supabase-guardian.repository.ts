import { inject, Injectable } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Guardian, GuardianAssignment, GuardianInput, GuardianOption, Relationship, shortName } from '../models/player.models';
import { AddGuardianResult, GuardianRepository } from './guardian.repository';

/** Vínculo con la persona y los demás jugadores que acompaña (para «También de…»). */
const COLUMNS = 'id, relationship, guardians(id, full_name, phone, guardian_links(player_id, deleted_at, players(first_names, last_names, is_active, deleted_at)))';

interface LinkRow {
    id: string;
    relationship: string;
    guardians: {
        id: string;
        full_name: string;
        phone: string;
        guardian_links: { player_id: string; deleted_at: string | null; players: { first_names: string; last_names: string; is_active: boolean; deleted_at: string | null } | null }[];
    };
}

/** Acudiente con sus vínculos no eliminados y los jugadores (para el selector, DEC-43). */
const OPTION_COLUMNS = 'id, full_name, phone, guardian_links(player_id, relationship, deleted_at, players(first_names, last_names, is_active, deleted_at))';

interface OptionRow {
    id: string;
    full_name: string;
    phone: string;
    guardian_links: { player_id: string; relationship: string; deleted_at: string | null; players: { first_names: string; last_names: string; is_active: boolean; deleted_at: string | null } | null }[];
}

function toOption(row: OptionRow): GuardianOption {
    return {
        guardianId: row.id,
        fullName: row.full_name,
        phone: row.phone,
        players: row.guardian_links
            .filter((link) => !link.deleted_at && link.players?.is_active && !link.players.deleted_at)
            .map((link) => ({
                playerId: link.player_id,
                name: shortName({ firstNames: link.players!.first_names, lastNames: link.players!.last_names }),
                relationship: link.relationship as Relationship
            }))
    };
}

function toGuardian(row: LinkRow, playerId: string): Guardian {
    return {
        linkId: row.id,
        guardianId: row.guardians.id,
        fullName: row.guardians.full_name,
        phone: row.guardians.phone,
        relationship: row.relationship as Relationship,
        otherPlayers: row.guardians.guardian_links
            .filter((link) => link.player_id !== playerId && !link.deleted_at && link.players?.is_active && !link.players.deleted_at)
            .map((link) => shortName({ firstNames: link.players!.first_names, lastNames: link.players!.last_names }))
    };
}

/** Ninguna fila no eliminada actualizada (PGRST116) rechaza con not_found. */
function ensureUpdated({ data, error }: { data: unknown; error: unknown }): void {
    if (error || !data) {
        throw mapSupabaseError(error);
    }
}

@Injectable()
export class SupabaseGuardianRepository extends GuardianRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async listByPlayer(playerId: string): Promise<readonly Guardian[]> {
        const { data, error } = await this.client.from('guardian_links').select(COLUMNS).eq('player_id', playerId).eq('status', 'validated').is('deleted_at', null).order('created_at');

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as LinkRow[]).map((row) => toGuardian(row, playerId));
    }

    async findByPhone(phone: string): Promise<{ guardianId: string; fullName: string } | null> {
        const { data, error } = await this.client.from('guardians').select('id, full_name').eq('phone', phone).is('deleted_at', null).maybeSingle();

        if (error) {
            throw mapSupabaseError(error);
        }

        return data ? { guardianId: data.id, fullName: data.full_name } : null;
    }

    async addToPlayer(playerId: string, input: GuardianInput): Promise<AddGuardianResult> {
        // p_consent: la casilla de autorización es obligatoria en la pantalla; la función la exige.
        const { data, error } = await this.client.rpc('add_player_guardian', {
            p_player_id: playerId,
            p_full_name: input.fullName,
            p_phone: input.phone,
            p_relationship: input.relationship,
            p_consent: true
        });

        if (error || !data?.[0]) {
            throw mapSupabaseError(error);
        }

        return { guardianExisted: data[0].guardian_existed, guardianName: data[0].guardian_name };
    }

    async listGuardians(): Promise<readonly GuardianOption[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const { data, error } = await this.client.from('guardians').select(OPTION_COLUMNS).is('deleted_at', null).order('full_name');

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as OptionRow[]).map(toOption);
    }

    async assign(playerId: string, assignments: readonly GuardianAssignment[]): Promise<number> {
        const { data, error } = await this.client.rpc('assign_guardians', {
            p_player_id: playerId,
            p_assignments: assignments.map((assignment) => ({ guardian_id: assignment.guardianId, relationship: assignment.relationship }))
        });

        if (error) {
            const appError = mapSupabaseError(error);

            // La función responde 42501 también cuando el jugador o un acudiente ya no existe,
            // para no revelar datos ajenos: para el owner significa que ya no está.
            throw appError.code === 'forbidden' ? new AppError('not_found', { cause: error }) : appError;
        }

        return data ?? 0;
    }

    async updateGuardian(guardianId: string, input: { fullName: string; phone: string }): Promise<void> {
        ensureUpdated(await this.client.from('guardians').update({ full_name: input.fullName, phone: input.phone }).eq('id', guardianId).is('deleted_at', null).select('id').single());
    }

    async updateRelationship(linkId: string, relationship: Relationship): Promise<void> {
        ensureUpdated(await this.client.from('guardian_links').update({ relationship }).eq('id', linkId).is('deleted_at', null).select('id').single());
    }

    async removeFromPlayer(linkId: string): Promise<void> {
        ensureUpdated(await this.client.from('guardian_links').update({ deleted_at: new Date().toISOString() }).eq('id', linkId).is('deleted_at', null).select('id').single());
    }
}
