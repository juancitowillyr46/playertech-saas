import { inject, Injectable } from '@angular/core';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AppError } from '../../../core/errors/app-error';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { TablesUpdate } from '../../../core/supabase/database.types';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { ExternalField, ExternalFieldInput } from '../models/activity.models';
import { ExternalFieldRepository } from './external-field.repository';

const COLUMNS = 'id, name, address, city, directions';

@Injectable()
export class SupabaseExternalFieldRepository extends ExternalFieldRepository {
    private readonly client = inject(SUPABASE_CLIENT);
    private readonly academyContext = inject(AcademyContextService);

    async list(): Promise<readonly ExternalField[]> {
        const { data, error } = await this.client.from('external_fields').select(COLUMNS).is('deleted_at', null).order('name');

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data;
    }

    async create(input: ExternalFieldInput): Promise<ExternalField> {
        const academyId = this.academyContext.academy()?.id;

        if (!academyId) {
            throw new AppError('forbidden', { cause: new Error('Sin academia activa en el contexto') });
        }

        const { data, error } = await this.client
            .from('external_fields')
            .insert({ academy_id: academyId, ...input })
            .select(COLUMNS)
            .single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }

        return data;
    }

    update(id: string, input: ExternalFieldInput): Promise<void> {
        return this.updateRow(id, input);
    }

    retire(id: string): Promise<void> {
        return this.updateRow(id, { deleted_at: new Date().toISOString() });
    }

    private async updateRow(id: string, changes: TablesUpdate<'external_fields'>): Promise<void> {
        const { data, error } = await this.client.from('external_fields').update(changes).eq('id', id).is('deleted_at', null).select('id').single();

        if (error || !data) {
            throw mapSupabaseError(error);
        }
    }
}
