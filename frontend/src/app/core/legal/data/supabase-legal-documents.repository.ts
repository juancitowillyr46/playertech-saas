import { inject, Injectable } from '@angular/core';
import { AppError } from '../../errors/app-error';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { CurrentLegalDocuments, LegalDocument, LegalDocumentType } from '../models/legal.models';
import { LegalDocumentsRepository } from './legal-documents.repository';

@Injectable()
export class SupabaseLegalDocumentsRepository extends LegalDocumentsRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async getCurrent(): Promise<CurrentLegalDocuments> {
        const { data, error } = await this.client.from('legal_documents').select('type, version, url').eq('is_current', true);

        if (error) {
            throw mapSupabaseError(error);
        }

        const documents = (data ?? []) as LegalDocument[];
        const terms = findByType(documents, 'terms');
        const privacyPolicy = findByType(documents, 'privacy_policy');

        if (!terms || !privacyPolicy) {
            throw new AppError('unknown', { cause: new Error('Falta un documento legal vigente') });
        }

        return { terms, privacyPolicy };
    }
}

function findByType(documents: LegalDocument[], type: LegalDocumentType): LegalDocument | undefined {
    const document = documents.find((item) => item.type === type);

    return document && { type: document.type, version: document.version, url: document.url };
}
