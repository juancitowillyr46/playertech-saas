import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { SupabaseAcademyContextRepository } from './supabase-academy-context.repository';

interface QueryResult {
    data: unknown;
    error: unknown;
}

/** Cliente simulado: cada tabla devuelve el resultado configurado al final de la cadena. */
function createClientMock(results: { academy_members: QueryResult; academies?: QueryResult }) {
    const eq = vi.fn();
    const from = vi.fn((table: 'academy_members' | 'academies') => {
        const result = results[table] ?? { data: null, error: null };
        const maybeSingle = vi.fn().mockResolvedValue(result);

        eq.mockReturnValue({ maybeSingle });

        return { select: vi.fn().mockReturnValue({ maybeSingle, eq }) };
    });

    return { client: { from }, from, eq };
}

function setup(results: { academy_members: QueryResult; academies?: QueryResult }) {
    const mock = createClientMock(results);

    TestBed.configureTestingModule({
        providers: [SupabaseAcademyContextRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }]
    });

    return { repository: TestBed.inject(SupabaseAcademyContextRepository), ...mock };
}

const ACTIVE_MEMBERSHIP = { data: { academy_id: 'academy-a', status: 'active' }, error: null };

describe('SupabaseAcademyContextRepository', () => {
    it('sin membresía, la situación es none', async () => {
        const { repository } = setup({ academy_members: { data: null, error: null } });

        await expect(repository.loadCurrent()).resolves.toEqual({ status: 'none' });
    });

    it('con la membresía desactivada, la situación es none', async () => {
        const { repository } = setup({ academy_members: { data: { academy_id: 'academy-a', status: 'disabled' }, error: null } });

        await expect(repository.loadCurrent()).resolves.toEqual({ status: 'none' });
    });

    it('con membresía activa y academia visible, la situación es active con sus datos', async () => {
        const { repository, eq } = setup({
            academy_members: ACTIVE_MEMBERSHIP,
            academies: { data: { id: 'academy-a', name: 'Academia A', logo_file_id: null }, error: null }
        });

        await expect(repository.loadCurrent()).resolves.toEqual({
            status: 'active',
            academy: { id: 'academy-a', name: 'Academia A', logoFileId: null }
        });
        expect(eq).toHaveBeenCalledWith('id', 'academy-a');
    });

    it('con membresía activa y academia no visible (RLS), la situación es suspended', async () => {
        const { repository } = setup({ academy_members: ACTIVE_MEMBERSHIP, academies: { data: null, error: null } });

        await expect(repository.loadCurrent()).resolves.toEqual({ status: 'suspended' });
    });

    it('ante un fallo de red rechaza con AppError network', async () => {
        const { repository } = setup({ academy_members: { data: null, error: new TypeError('Failed to fetch') } });

        await expect(repository.loadCurrent()).rejects.toMatchObject({ code: 'network' });
    });
});
