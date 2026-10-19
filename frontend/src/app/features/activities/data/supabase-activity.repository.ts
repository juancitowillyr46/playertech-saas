import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { TablesUpdate } from '../../../core/supabase/database.types';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { Activity, ActivityInput, ActivityStatus, ActivityType, Place } from '../models/activity.models';
import { ActivityRepository } from './activity.repository';

const PLACE_COLUMNS = 'id, name, address, city, directions';
const COLUMNS = `id, type, starts_at, ends_at, call_at, notes, opponent, tournament, status, series_id, venues(${PLACE_COLUMNS}), external_fields(${PLACE_COLUMNS})`;

interface PlaceRow {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    directions: string | null;
}

interface ActivityRow {
    id: string;
    type: string;
    starts_at: string;
    ends_at: string | null;
    call_at: string | null;
    notes: string | null;
    opponent: string | null;
    tournament: string | null;
    status: string;
    series_id: string | null;
    venues: PlaceRow | null;
    external_fields: PlaceRow | null;
}

function toPlace(row: ActivityRow): Place {
    const [kind, place] = row.venues ? (['venue', row.venues] as const) : (['field', row.external_fields!] as const);

    return { kind, id: place.id, name: place.name, address: place.address, city: place.city, directions: place.directions };
}

function toActivity(row: ActivityRow): Activity {
    return {
        id: row.id,
        type: row.type as ActivityType,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        callAt: row.call_at,
        place: toPlace(row),
        notes: row.notes,
        opponent: row.opponent,
        tournament: row.tournament,
        status: row.status as ActivityStatus,
        seriesId: row.series_id
    };
}

/** Columnas que escribe el owner; rival y torneo solo en competencia. */
function toRow(input: ActivityInput) {
    const competition = input.type === 'competition';

    return {
        type: input.type,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        call_at: input.callAt,
        venue_id: input.place.kind === 'venue' ? input.place.id : null,
        external_field_id: input.place.kind === 'field' ? input.place.id : null,
        notes: input.notes,
        opponent: competition ? input.opponent : null,
        tournament: competition ? input.tournament : null
    };
}

@Injectable()
export class SupabaseActivityRepository extends ActivityRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async list(when: 'upcoming' | 'past'): Promise<readonly Activity[]> {
        // Sin filtro por academia: RLS lo aplica (principio VI).
        const now = new Date().toISOString();
        const query = this.client.from('activities').select(COLUMNS).is('deleted_at', null);
        const { data, error } = await (when === 'upcoming' ? query.gte('starts_at', now).order('starts_at', { ascending: true }) : query.lt('starts_at', now).order('starts_at', { ascending: false }));

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as ActivityRow[]).map(toActivity);
    }

    async get(id: string): Promise<Activity> {
        const { data, error } = await this.client.from('activities').select(COLUMNS).eq('id', id).is('deleted_at', null).single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return toActivity(data as unknown as ActivityRow);
    }

    async create(inputs: readonly ActivityInput[], seriesId: string | null): Promise<number> {
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        // Una sola sentencia: se crean todas o ninguna (research R5).
        const { data, error } = await this.client
            .from('activities')
            .insert(inputs.map((input) => ({ academy_id: academyId, series_id: seriesId, ...toRow(input) })))
            .select('id');

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data.length;
    }

    update(id: string, input: ActivityInput): Promise<void> {
        return this.updateRow(id, toRow(input));
    }

    setStatus(id: string, status: ActivityStatus): Promise<void> {
        return this.updateRow(id, { status });
    }

    delete(id: string): Promise<void> {
        return this.updateRow(id, { deleted_at: new Date().toISOString() });
    }

    /** Actualiza una actividad no eliminada; si ya no existe (PGRST116), rechaza con not_found. */
    private async updateRow(id: string, changes: TablesUpdate<'activities'>): Promise<void> {
        const { data, error } = await this.client.from('activities').update(changes).eq('id', id).is('deleted_at', null).select('id').single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }
    }
}
