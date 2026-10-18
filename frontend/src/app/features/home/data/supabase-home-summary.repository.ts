import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { StorageBucket, StoredFile } from '../../../core/storage/models/storage.models';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { HomeSummaryData } from '../models/home-summary.models';
import { HomeSummaryRepository } from './home-summary.repository';

@Injectable()
export class SupabaseHomeSummaryRepository extends HomeSummaryRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async loadSummary(logoFileId: string | null): Promise<HomeSummaryData> {
        // Sin filtro por academia: RLS limita cada tabla a la del miembro (una sola fila).
        const [subscription, venue, academy, logo] = await Promise.all([
            this.client.from('subscriptions').select('plans(name)').eq('status', 'active').maybeSingle(),
            this.client.from('venues').select('name, city, address').eq('is_primary', true).is('deleted_at', null).maybeSingle(),
            this.client.from('academies').select('contact_phone, address').maybeSingle(),
            logoFileId ? this.loadLogo(logoFileId) : Promise.resolve(null)
        ]);

        if (subscription.error) {
            throw mapSupabaseError(subscription.error);
        }

        if (venue.error) {
            throw mapSupabaseError(venue.error);
        }

        if (academy.error) {
            throw mapSupabaseError(academy.error);
        }

        return {
            planName: subscription.data?.plans?.name ?? null,
            primaryVenue: venue.data ? { name: venue.data.name, city: venue.data.city, address: venue.data.address } : null,
            logo,
            contact: { phone: academy.data?.contact_phone ?? null, address: academy.data?.address ?? null }
        };
    }

    private async loadLogo(fileId: string): Promise<StoredFile | null> {
        const { data, error } = await this.client.from('files').select('id, bucket, storage_key, mime_type, size_bytes').eq('id', fileId).is('deleted_at', null).maybeSingle();

        if (error) {
            throw mapSupabaseError(error);
        }

        return data
            ? { id: data.id, bucket: data.bucket as StorageBucket, storageKey: data.storage_key, mimeType: data.mime_type, sizeBytes: data.size_bytes }
            : null;
    }
}
