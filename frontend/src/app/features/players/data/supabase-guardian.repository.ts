import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Guardian, GuardianInput, Relationship, shortName } from '../models/player.models';
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
