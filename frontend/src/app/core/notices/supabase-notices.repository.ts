import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../supabase/supabase-client';
import { countPending, NewResponsesNotice } from './notices.models';
import { NoticesRepository } from './notices.repository';

interface PendingRow {
    link_id: string | null;
    device_id: string | null;
}

interface NewResponsesRow {
    call_up_id: string;
    activity_id: string;
    activity_type: NewResponsesNotice['activityType'];
    activity_opponent: string | null;
    activity_starts_at: string;
    activity_status: string;
    new_count: number;
}

/** Las vistas filtran por la academia actual y heredan la RLS: aquí no se filtra por academia. */
@Injectable()
export class SupabaseNoticesRepository extends NoticesRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async pendingCount(): Promise<number> {
        const { data, error } = await this.client.from('guardian_pending_reviews').select('link_id, device_id');

        if (error) {
            throw mapSupabaseError(error);
        }

        return countPending((data as unknown as PendingRow[]).map((row) => ({ linkId: row.link_id, deviceId: row.device_id })));
    }

    async newResponses(): Promise<readonly NewResponsesNotice[]> {
        const { data, error } = await this.client.from('call_up_new_responses').select('call_up_id, activity_id, activity_type, activity_opponent, activity_starts_at, activity_status, new_count').order('activity_starts_at');

        if (error) {
            throw mapSupabaseError(error);
        }

        return (data as unknown as NewResponsesRow[]).map((row) => ({
            callUpId: row.call_up_id,
            activityId: row.activity_id,
            activityType: row.activity_type,
            opponent: row.activity_opponent,
            startsAt: row.activity_starts_at,
            cancelled: row.activity_status === 'cancelled',
            newCount: row.new_count
        }));
    }
}
