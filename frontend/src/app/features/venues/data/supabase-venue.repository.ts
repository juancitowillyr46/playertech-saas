import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { TablesUpdate } from '../../../core/supabase/database.types';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Venue, VenueInput, VenueType } from '../models/venue.models';
import { VenueRepository } from './venue.repository';

const COLUMNS = 'id, name, type, address, city, directions, is_primary, is_active';

interface VenueRow {
    id: string;
    name: string;
    type: string;
    address: string | null;
    city: string | null;
    directions: string | null;
    is_primary: boolean;
    is_active: boolean;
}

function toVenue(row: VenueRow): Venue {
    return {
        id: row.id,
        name: row.name,
        type: row.type as VenueType,
        address: row.address,
        city: row.city,
        directions: row.directions,
        isPrimary: row.is_primary,
        isActive: row.is_active
    };
}

/** Columnas que el owner puede escribir (permisos por columna de la spec 001). */
function toRow(input: VenueInput) {
    return { name: input.name, type: input.type, address: input.address, city: input.city, directions: input.directions };
}

@Injectable()
export class SupabaseVenueRepository extends VenueRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async listVenues(): Promise<readonly Venue[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const { data, error } = await this.client.from('venues').select(COLUMNS).is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as VenueRow[]).map(toVenue).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name, 'es-CO'));
    }

    async createVenue(input: VenueInput): Promise<Venue> {
        // La academia sale del contexto de la membresía y la valida la política de inserción
        // (research R2); created_by lo pone la base de datos (auth.uid()).
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        const { data, error } = await this.client
            .from('venues')
            .insert({ academy_id: academyId, ...toRow(input) })
            .select(COLUMNS)
            .single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return toVenue(data as VenueRow);
    }

    updateVenue(id: string, input: VenueInput): Promise<Venue> {
        return this.updateRow(id, toRow(input));
    }

    setActive(id: string, active: boolean): Promise<Venue> {
        return this.updateRow(id, { is_active: active });
    }

    async deleteVenue(id: string): Promise<void> {
        await this.updateRow(id, { deleted_at: new Date().toISOString() });
    }

    async setPrimary(id: string): Promise<void> {
        const { error } = await this.client.rpc('set_primary_venue', { p_venue_id: id });

        if (error) {
            const appError = mapSupabaseError(error);

            // La función responde 42501 también cuando la sede no existe, para no revelar
            // sedes ajenas: para el owner significa que ya no está (contracts/app-errors.md).
            throw appError.code === 'forbidden' ? new AppError('not_found', { cause: error }) : appError;
        }
    }

    /** Actualiza una sede no eliminada; si ya no existe (PGRST116), rechaza con not_found. */
    private async updateRow(id: string, changes: TablesUpdate<'venues'>): Promise<Venue> {
        const { data, error } = await this.client.from('venues').update(changes).eq('id', id).is('deleted_at', null).select(COLUMNS).single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return toVenue(data as VenueRow);
    }
}
