import { inject, Injectable } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Guardian, GuardianAssignment, GuardianInput, GuardianOption, PendingGuardian, Relationship, ReviewDecision, shortName } from '../models/player.models';
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

/** Vínculos pendientes o validados del jugador con los dispositivos del acudiente (spec 013). */
const PENDING_COLUMNS = 'id, relationship, status, created_at, guardians(full_name, phone, created_at, guardian_devices(id, status, declared_name, declared_relationship, created_at))';

interface DeviceRow {
    id: string;
    status: string;
    declared_name: string | null;
    declared_relationship: Relationship | 'self';
    created_at: string;
}

interface PendingRow {
    id: string;
    relationship: Relationship | 'self';
    status: string;
    created_at: string;
    guardians: { full_name: string; phone: string; created_at: string; guardian_devices: DeviceRow[] } | null;
}

/** Un vínculo pendiente es un pendiente (con su último dispositivo pendiente); en uno validado, cada dispositivo nuevo lo es. */
function toPending(row: PendingRow): PendingGuardian[] {
    const guardian = row.guardians;

    if (!guardian) {
        return [];
    }

    const devices = guardian.guardian_devices.filter((device) => device.status === 'pending').sort((a, b) => b.created_at.localeCompare(a.created_at));
    const item = (device: DeviceRow | null, linkId: string | null): PendingGuardian => ({
        linkId,
        deviceId: device?.id ?? null,
        guardianName: guardian.full_name,
        declaredName: device?.declared_name ?? null,
        relationship: device?.declared_relationship ?? row.relationship,
        phone: guardian.phone,
        at: device?.created_at ?? row.created_at,
        phoneMatch: !!device && guardian.created_at < device.created_at
    });

    return row.status === 'pending' ? [item(devices[0] ?? null, row.id)] : devices.map((device) => item(device, null));
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

        // Quien solo responde por sí mismo (vínculos «el jugador») no es acudiente de nadie (spec 013).
        return (data as unknown as OptionRow[]).filter((row) => !row.guardian_links.some((link) => !link.deleted_at && link.relationship === 'self')).map(toOption);
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

    async pending(playerId: string): Promise<readonly PendingGuardian[]> {
        const { data, error } = await this.client.from('guardian_links').select(PENDING_COLUMNS).eq('player_id', playerId).in('status', ['pending', 'validated']).is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as PendingRow[]).flatMap(toPending).sort((a, b) => b.at.localeCompare(a.at));
    }

    async review(linkId: string | null, deviceId: string | null, decision: ReviewDecision): Promise<void> {
        // La función acepta nulos en cualquiera de los dos ids; los tipos generados no lo reflejan.
        const { error } = await this.client.rpc('review_guardian', { p_link_id: linkId as string, p_device_id: deviceId as string, p_decision: decision });

        if (error) {
            throw mapSupabaseError(error);
        }
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
