import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../academy-context/academy-context.service';
import { AppError } from '../../errors/app-error';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { StorageBucket, StoredFile, UploadFileInput } from '../models/storage.models';
import { FileStorageRepository } from './file-storage.repository';
import { randomUuid } from './random-uuid';

const DEFAULT_SIGNED_URL_SECONDS = 3600;

/** Extensión por tipo MIME. Los tipos permitidos los valida el bucket en el servidor. */
const EXTENSIONS: Readonly<Record<string, string>> = {
    'image/png': 'png',
    'image/jpeg': 'jpg'
};

@Injectable()
export class SupabaseFileStorageRepository extends FileStorageRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async upload(input: UploadFileInput): Promise<StoredFile> {
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        // Clave portable (ADR-013): la academia primero y el UUID del archivo como nombre físico.
        const fileId = randomUuid();
        const extension = EXTENSIONS[input.file.type] ?? 'bin';
        const storageKey = `${academyId}/${input.module}/${input.entityId}/${fileId}.${extension}`;
        const bucket = this.client.storage.from(input.bucket);

        const uploaded = await bucket.upload(storageKey, input.file, { contentType: input.file.type, upsert: false });

        if (uploaded.error) {
            throw mapSupabaseError(uploaded.error);
        }

        const registered = await this.client
            .from('files')
            .insert({
                id: fileId,
                academy_id: academyId,
                bucket: input.bucket,
                storage_key: storageKey,
                module: input.module,
                entity_id: input.entityId,
                original_name: input.file.name,
                mime_type: input.file.type,
                size_bytes: input.file.size
            })
            .select('id, bucket, storage_key, mime_type, size_bytes')
            .single();

        if (registered.error || !registered.data) {
            // Sin registro en files el objeto quedaría huérfano: se retira.
            await bucket.remove([storageKey]);
            throw mapSupabaseError(registered.error);
        }

        return {
            id: registered.data.id,
            bucket: registered.data.bucket as StorageBucket,
            storageKey: registered.data.storage_key,
            mimeType: registered.data.mime_type,
            sizeBytes: registered.data.size_bytes
        };
    }

    async getUrl(file: StoredFile, options?: { expiresInSeconds?: number }): Promise<string> {
        const bucket = this.client.storage.from(file.bucket);

        if (file.bucket === 'public-assets') {
            return bucket.getPublicUrl(file.storageKey).data.publicUrl;
        }

        const { data, error } = await bucket.createSignedUrl(file.storageKey, options?.expiresInSeconds ?? DEFAULT_SIGNED_URL_SECONDS);

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data.signedUrl;
    }

    async remove(file: StoredFile): Promise<void> {
        const { error } = await this.client.from('files').update({ deleted_at: new Date().toISOString() }).eq('id', file.id);

        if (error) {
            throw mapSupabaseError(error);
        }
    }

    async purge(file: StoredFile): Promise<void> {
        await this.remove(file);

        const { error } = await this.client.storage.from(file.bucket).remove([file.storageKey]);

        if (error) {
            throw mapSupabaseError(error);
        }
    }
}
