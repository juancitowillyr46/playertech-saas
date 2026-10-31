import { inject, Injectable } from '@angular/core';
import { AppError } from '../../errors/app-error';
import { mapSupabaseError } from '../../errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { CurrentLegalDocuments, LegalDocument, LegalDocumentType } from '../models/legal.models';
import { LegalDocumentsRepository } from './legal-documents.repository';

interface LegalDocumentRow {
    type: LegalDocumentType;
    version: string;
    url: string;
    published_at: string;
}

@Injectable()
export class SupabaseLegalDocumentsRepository extends LegalDocumentsRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async getCurrent(): Promise<CurrentLegalDocuments> {
        const { data, error } = await this.client.from('legal_documents').select('type, version, url, published_at').eq('is_current', true);

        if (error) {
            throw mapSupabaseError(error);
        }

        const documents = ((data ?? []) as LegalDocumentRow[]).map((row) => ({ type: row.type, version: row.version, url: row.url, publishedAt: row.published_at }));
        const terms = findByType(documents, 'terms');
        const privacyPolicy = findByType(documents, 'privacy_policy');

        if (!terms || !privacyPolicy) {
            throw new AppError('unknown', { cause: new Error('Falta un documento legal vigente') });
        }

        return { terms, privacyPolicy };
    }
}

function findByType(documents: LegalDocument[], type: LegalDocumentType): LegalDocument | undefined {
    return documents.find((item) => item.type === type);
}
