import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { StorageBucket, StoredFile } from '../../../core/storage/models/storage.models';
import { TablesUpdate } from '../../../core/supabase/database.types';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { AcademyDetails, AcademyProfileData, AcademyProfileInput } from '../models/academy-profile.models';
import { AcademyProfileRepository } from './academy-profile.repository';

const COLUMNS = 'id, name, contact_email, contact_phone, address, city, logo_file_id';

interface AcademyRow {
    id: string;
    name: string;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    city: string | null;
    logo_file_id: string | null;
}

function toDetails(row: AcademyRow): AcademyDetails {
    return {
        id: row.id,
        name: row.name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        address: row.address,
        city: row.city,
        logoFileId: row.logo_file_id
    };
}

@Injectable()
export class SupabaseAcademyProfileRepository extends AcademyProfileRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async getProfile(): Promise<AcademyProfileData> {
        const academyId = this.academyId();
        const [academy, subscription] = await Promise.all([
            this.client.from('academies').select(COLUMNS).eq('id', academyId).single(),
            this.client.from('subscriptions').select('plans(name)').eq('status', 'active').maybeSingle()
        ]);

        if (academy.error || !academy.data) {
            throw mapSupabaseError(academy.error);
        }

        if (subscription.error) {
            throw mapSupabaseError(subscription.error);
        }

        const details = toDetails(academy.data as AcademyRow);

        return {
            academy: details,
            planName: subscription.data?.plans?.name ?? null,
            logo: details.logoFileId ? await this.loadLogo(details.logoFileId) : null
        };
    }

    async updateProfile(input: AcademyProfileInput): Promise<AcademyDetails> {
        // Solo los campos de la academia: el correo de inicio de sesión vive en Auth (CA-005).
        return toDetails(
            await this.update({ name: input.name, contact_email: input.contactEmail, contact_phone: input.contactPhone, address: input.address, city: input.city })
        );
    }

    async setLogo(fileId: string | null): Promise<void> {
        await this.update({ logo_file_id: fileId });
    }

    /** Sin academia en el contexto no hay a quién escribir (la política de RLS lo valida igual). */
    private academyId(): string {
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        return academyId;
    }

    /** Actualiza la academia del contexto; si ninguna fila es accesible (PGRST116), rechaza con not_found. */
    private async update(changes: TablesUpdate<'academies'>): Promise<AcademyRow> {
        const { data, error } = await this.client.from('academies').update(changes).eq('id', this.academyId()).select(COLUMNS).single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data as AcademyRow;
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
