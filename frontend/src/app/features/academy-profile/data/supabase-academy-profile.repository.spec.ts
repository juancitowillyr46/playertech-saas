import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { SupabaseAcademyProfileRepository } from './supabase-academy-profile.repository';

const ACADEMY_ID = 'academy-a';
const ROW = { id: ACADEMY_ID, name: 'Academia A', contact_email: 'contacto@a.test', contact_phone: '300 000 0000', address: 'Calle 1', city: 'Bogotá', logo_file_id: 'file-1' };
const FILE_ROW = { id: 'file-1', bucket: 'public-assets', storage_key: `${ACADEMY_ID}/academy/${ACADEMY_ID}/file-1.png`, mime_type: 'image/png', size_bytes: 1000 };

/** Consulta encadenable de Supabase: cada método devuelve la misma consulta. */
function query(result: unknown) {
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};

    for (const method of ['select', 'eq', 'is', 'update']) {
        builder[method] = vi.fn(() => builder);
    }

    builder['single'] = vi.fn().mockResolvedValue(result);
    builder['maybeSingle'] = vi.fn().mockResolvedValue(result);

    return builder;
}

function setup(academyId: string | null = ACADEMY_ID) {
    const tables = {
        academies: query({ data: ROW, error: null }),
        subscriptions: query({ data: { plans: { name: 'Free' } }, error: null }),
        files: query({ data: FILE_ROW, error: null })
    };
    const client = { from: vi.fn((table: keyof typeof tables) => tables[table]) };
    const academy = signal(academyId ? { id: academyId, name: 'Academia A', logoFileId: 'file-1' } : undefined);

    TestBed.configureTestingModule({
        providers: [SupabaseAcademyProfileRepository, { provide: SUPABASE_CLIENT, useValue: client }, { provide: AcademyContextService, useValue: { academy } }]
    });

    return { repository: TestBed.inject(SupabaseAcademyProfileRepository), client, tables };
}

describe('SupabaseAcademyProfileRepository', () => {
    it('lee la academia, su plan y su logo vigente, traducidos al modelo (CA-001)', async () => {
        const { repository, tables } = setup();

        const profile = await repository.getProfile();

        expect(profile).toEqual({
            academy: { id: ACADEMY_ID, name: 'Academia A', contactEmail: 'contacto@a.test', contactPhone: '300 000 0000', address: 'Calle 1', city: 'Bogotá', logoFileId: 'file-1' },
            planName: 'Free',
            logo: { id: 'file-1', bucket: 'public-assets', storageKey: FILE_ROW.storage_key, mimeType: 'image/png', sizeBytes: 1000 }
        });
        expect(tables.academies['eq']).toHaveBeenCalledWith('id', ACADEMY_ID);
        expect(tables.files['is']).toHaveBeenCalledWith('deleted_at', null);
    });

    it('sin logo no consulta archivos', async () => {
        const { repository, tables, client } = setup();
        tables.academies['single'].mockResolvedValue({ data: { ...ROW, logo_file_id: null }, error: null });

        expect((await repository.getProfile()).logo).toBeNull();
        expect(client.from).not.toHaveBeenCalledWith('files');
    });

    it('guarda solo los cinco campos de la academia, nunca el correo de inicio de sesión (CA-005)', async () => {
        const { repository, tables, client } = setup();

        const saved = await repository.updateProfile({ name: 'Academia A', contactEmail: 'nuevo@a.test', contactPhone: null, address: 'Calle 2', city: null });

        expect(tables.academies['update']).toHaveBeenCalledWith({ name: 'Academia A', contact_email: 'nuevo@a.test', contact_phone: null, address: 'Calle 2', city: null });
        expect(tables.academies['eq']).toHaveBeenCalledWith('id', ACADEMY_ID);
        expect(client.from).toHaveBeenCalledTimes(1);
        expect(saved.name).toBe('Academia A');
    });

    it('si la academia ya no es accesible rechaza con not_found', async () => {
        const { repository, tables } = setup();
        tables.academies['single'].mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } });

        await expect(repository.updateProfile({ name: 'A', contactEmail: null, contactPhone: null, address: null, city: null })).rejects.toMatchObject({ code: 'not_found' });
    });

    it.each([['file-2'], [null]])('asigna el logo %s', async (fileId) => {
        const { repository, tables } = setup();

        await repository.setLogo(fileId);

        expect(tables.academies['update']).toHaveBeenCalledWith({ logo_file_id: fileId });
    });

    it('sin academia en el contexto rechaza con forbidden', async () => {
        const { repository } = setup(null);

        await expect(repository.getProfile()).rejects.toMatchObject({ code: 'forbidden' });
        await expect(repository.setLogo(null)).rejects.toMatchObject({ code: 'forbidden' });
    });
});
