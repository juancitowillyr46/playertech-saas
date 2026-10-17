import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { AcademyContext } from '../models/academy-context.models';
import { AcademyContextRepository } from './academy-context.repository';

/**
 * Deduce la situación a partir de dos lecturas bajo RLS (research R6):
 * la propia membresía (legible aunque la academia esté suspendida) y la
 * academia (legible solo si `is_academy_member()` es verdadero).
 */
@Injectable()
export class SupabaseAcademyContextRepository extends AcademyContextRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async loadCurrent(): Promise<AcademyContext> {
        const membership = await this.client.from('academy_members').select('academy_id, status').maybeSingle();

        if (membership.error) {
            throw mapSupabaseError(membership.error);
        }

        if (!membership.data || membership.data.status !== 'active') {
            return { status: 'none' };
        }

        const academy = await this.client.from('academies').select('id, name, logo_file_id').eq('id', membership.data.academy_id).maybeSingle();

        if (academy.error) {
            throw mapSupabaseError(academy.error);
        }

        if (!academy.data) {
            return { status: 'suspended' };
        }

        return {
            status: 'active',
            academy: { id: academy.data.id, name: academy.data.name, logoFileId: academy.data.logo_file_id }
        };
    }
}
