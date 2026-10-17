import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Venue, VenueType } from '../models/venue.models';
import { VenueRepository } from './venue.repository';

@Injectable()
export class SupabaseVenueRepository extends VenueRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async listVenues(): Promise<readonly Venue[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const { data, error } = await this.client.from('venues').select('id, name, type, city, is_primary, is_active').is('deleted_at', null);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data
            .map(
                (row): Venue => ({
                    id: row.id,
                    name: row.name,
                    type: row.type as VenueType,
                    city: row.city,
                    isPrimary: row.is_primary,
                    isActive: row.is_active
                })
            )
            .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name, 'es-CO'));
    }
}
