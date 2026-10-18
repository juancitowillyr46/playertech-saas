import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { SupabaseHomeSummaryRepository } from './supabase-home-summary.repository';

interface QueryResult {
    data: unknown;
    error: unknown;
}

type Table = 'subscriptions' | 'venues' | 'academies' | 'files';

/** Cliente simulado: cualquier cadena de filtros termina en maybeSingle con el resultado de la tabla. */
function setup(results: Partial<Record<Table, QueryResult>>) {
    const calls: Record<string, unknown[][]> = {};
    const from = vi.fn((table: Table) => {
        const chain: Record<string, unknown> = {};
        const record =
            (name: string) =>
            (...args: unknown[]) => {
                (calls[`${table}.${name}`] ??= []).push(args);

                return chain;
            };

        chain['select'] = vi.fn(record('select'));
        chain['eq'] = vi.fn(record('eq'));
        chain['is'] = vi.fn(record('is'));
        chain['maybeSingle'] = vi.fn().mockResolvedValue(results[table] ?? { data: null, error: null });

        return chain;
    });

    TestBed.configureTestingModule({
        providers: [SupabaseHomeSummaryRepository, { provide: SUPABASE_CLIENT, useValue: { from } }]
    });

    return { repository: TestBed.inject(SupabaseHomeSummaryRepository), from, calls };
}

describe('SupabaseHomeSummaryRepository', () => {
    it('devuelve el plan activo, la sede principal y el contacto de la academia', async () => {
        const { repository, calls } = setup({
            subscriptions: { data: { plans: { name: 'Free' } }, error: null },
            venues: { data: { name: 'Sede Principal', city: 'Bogotá', address: 'Calle 10' }, error: null },
            academies: { data: { contact_phone: '300 000 0000', address: 'Carrera 7' }, error: null }
        });

        await expect(repository.loadSummary(null)).resolves.toEqual({
            planName: 'Free',
            primaryVenue: { name: 'Sede Principal', city: 'Bogotá', address: 'Calle 10' },
            logo: null,
            contact: { phone: '300 000 0000', address: 'Carrera 7' }
        });
        expect(calls['academies.select']).toContainEqual(['contact_phone, address']);
        expect(calls['subscriptions.eq']).toContainEqual(['status', 'active']);
        expect(calls['venues.eq']).toContainEqual(['is_primary', true]);
        expect(calls['venues.is']).toContainEqual(['deleted_at', null]);
    });

    it('sin suscripción activa ni sede principal devuelve null en ambos', async () => {
        const { repository } = setup({});

        await expect(repository.loadSummary(null)).resolves.toEqual({ planName: null, primaryVenue: null, logo: null, contact: { phone: null, address: null } });
    });

    it('sin logoFileId no consulta files', async () => {
        const { repository, from } = setup({});

        await repository.loadSummary(null);

        expect(from).not.toHaveBeenCalledWith('files');
    });

    it('con logoFileId lee la fila de files y devuelve el StoredFile', async () => {
        const { repository, calls } = setup({
            files: {
                data: { id: 'file-1', bucket: 'public-assets', storage_key: 'a/academy/a/file-1.png', mime_type: 'image/png', size_bytes: 1200 },
                error: null
            }
        });

        const summary = await repository.loadSummary('file-1');

        expect(summary.logo).toEqual({ id: 'file-1', bucket: 'public-assets', storageKey: 'a/academy/a/file-1.png', mimeType: 'image/png', sizeBytes: 1200 });
        expect(calls['files.eq']).toContainEqual(['id', 'file-1']);
        expect(calls['files.is']).toContainEqual(['deleted_at', null]);
    });

    it('ante un fallo de red rechaza con AppError network', async () => {
        const { repository } = setup({ subscriptions: { data: null, error: new TypeError('Failed to fetch') } });

        await expect(repository.loadSummary(null)).rejects.toMatchObject({ code: 'network' });
    });
});
