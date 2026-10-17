import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { SupabaseLegalDocumentsRepository } from './supabase-legal-documents.repository';

function setup(result: { data: unknown; error: unknown }) {
    const eq = vi.fn().mockResolvedValue(result);
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
        providers: [SupabaseLegalDocumentsRepository, { provide: SUPABASE_CLIENT, useValue: { from } }]
    });

    return { repository: TestBed.inject(SupabaseLegalDocumentsRepository), from, eq };
}

const TERMS = { type: 'terms', version: '2026-10-v1', url: 'https://playertech.app/legal/terms/2026-10-v1' };
const PRIVACY = { type: 'privacy_policy', version: '2026-10-v1', url: 'https://playertech.app/legal/privacy_policy/2026-10-v1' };

describe('SupabaseLegalDocumentsRepository', () => {
    it('devuelve las versiones vigentes de ambos documentos', async () => {
        const { repository, from, eq } = setup({ data: [TERMS, PRIVACY], error: null });

        await expect(repository.getCurrent()).resolves.toEqual({ terms: TERMS, privacyPolicy: PRIVACY });
        expect(from).toHaveBeenCalledWith('legal_documents');
        expect(eq).toHaveBeenCalledWith('is_current', true);
    });

    it('rechaza con AppError unknown si falta uno de los dos documentos', async () => {
        const { repository } = setup({ data: [TERMS], error: null });

        await expect(repository.getCurrent()).rejects.toMatchObject({ code: 'unknown' });
    });

    it('traduce los errores del proveedor', async () => {
        const { repository } = setup({ data: null, error: new TypeError('Failed to fetch') });

        await expect(repository.getCurrent()).rejects.toMatchObject({ code: 'network' });
    });
});
