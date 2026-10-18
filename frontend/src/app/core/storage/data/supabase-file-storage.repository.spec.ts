import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../academy-context/academy-context.service';
import { AppError } from '../../errors/app-error';
import { SUPABASE_CLIENT } from '../../supabase/supabase-client';
import { StoredFile } from '../models/storage.models';
import { SupabaseFileStorageRepository } from './supabase-file-storage.repository';

const ACADEMY_ID = '11111111-1111-4111-8111-111111111111';
const FILE_ID = '22222222-2222-4222-8222-222222222222';
const ENTITY_ID = ACADEMY_ID;
const KEY = `${ACADEMY_ID}/academy/${ENTITY_ID}/${FILE_ID}.png`;

function createClient() {
    const bucketApi = {
        upload: vi.fn().mockResolvedValue({ data: { path: KEY }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: `http://storage/public/${KEY}` } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: `http://storage/signed/${KEY}` }, error: null })
    };
    const single = vi.fn().mockResolvedValue({
        data: { id: FILE_ID, bucket: 'public-assets', storage_key: KEY, mime_type: 'image/png', size_bytes: 2048 },
        error: null
    });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const client = {
        storage: { from: vi.fn().mockReturnValue(bucketApi) },
        from: vi.fn().mockReturnValue({ insert, update })
    };

    return { client, bucketApi, insert, single, update, updateEq };
}

function setup() {
    const mock = createClient();

    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FILE_ID);
    TestBed.configureTestingModule({
        providers: [
            SupabaseFileStorageRepository,
            { provide: SUPABASE_CLIENT, useValue: mock.client },
            { provide: AcademyContextService, useValue: { academy: signal({ id: ACADEMY_ID, name: 'Academia A', logoFileId: null }) } }
        ]
    });

    return { ...mock, repository: TestBed.inject(SupabaseFileStorageRepository) };
}

const logo = new File([new Uint8Array(2048)], 'logo.png', { type: 'image/png' });
const STORED: StoredFile = { id: FILE_ID, bucket: 'public-assets', storageKey: KEY, mimeType: 'image/png', sizeBytes: 2048 };

describe('SupabaseFileStorageRepository', () => {
    afterEach(() => vi.restoreAllMocks());

    it('sube con la clave {academia}/{módulo}/{entidad}/{archivo}.{ext} y registra el archivo', async () => {
        const { repository, client, bucketApi, insert } = setup();

        const stored = await repository.upload({ file: logo, bucket: 'public-assets', module: 'academy', entityId: ENTITY_ID });

        expect(client.storage.from).toHaveBeenCalledWith('public-assets');
        expect(bucketApi.upload).toHaveBeenCalledWith(KEY, logo, { contentType: 'image/png', upsert: false });
        expect(insert).toHaveBeenCalledWith({
            id: FILE_ID,
            academy_id: ACADEMY_ID,
            bucket: 'public-assets',
            storage_key: KEY,
            module: 'academy',
            entity_id: ENTITY_ID,
            original_name: 'logo.png',
            mime_type: 'image/png',
            size_bytes: 2048
        });
        expect(stored).toEqual(STORED);
    });

    it('usa la extensión jpg para image/jpeg', async () => {
        const { repository, bucketApi } = setup();
        const photo = new File([new Uint8Array(10)], 'foto.jpeg', { type: 'image/jpeg' });

        await repository.upload({ file: photo, bucket: 'public-assets', module: 'academy', entityId: ENTITY_ID });

        expect(bucketApi.upload.mock.calls[0][0]).toBe(`${ACADEMY_ID}/academy/${ENTITY_ID}/${FILE_ID}.jpg`);
    });

    it('si falla el registro en files, retira el objeto subido y rechaza con AppError', async () => {
        const { repository, bucketApi, single } = setup();
        single.mockResolvedValue({ data: null, error: { code: '42501', message: 'rls' } });

        const result = repository.upload({ file: logo, bucket: 'public-assets', module: 'academy', entityId: ENTITY_ID });

        await expect(result).rejects.toBeInstanceOf(AppError);
        await expect(result).rejects.toMatchObject({ code: 'forbidden' });
        expect(bucketApi.remove).toHaveBeenCalledWith([KEY]);
    });

    it('si falla la subida, no registra nada', async () => {
        const { repository, bucketApi, insert } = setup();
        bucketApi.upload.mockResolvedValue({ data: null, error: new TypeError('Failed to fetch') });

        await expect(repository.upload({ file: logo, bucket: 'public-assets', module: 'academy', entityId: ENTITY_ID })).rejects.toMatchObject({ code: 'network' });
        expect(insert).not.toHaveBeenCalled();
    });

    it('usa la URL pública en public-assets', async () => {
        const { repository } = setup();

        await expect(repository.getUrl(STORED)).resolves.toBe(`http://storage/public/${KEY}`);
    });

    it('usa una URL firmada de 3600 s por defecto en private-files', async () => {
        const { repository, bucketApi } = setup();

        await expect(repository.getUrl({ ...STORED, bucket: 'private-files' })).resolves.toBe(`http://storage/signed/${KEY}`);
        expect(bucketApi.createSignedUrl).toHaveBeenCalledWith(KEY, 3600);
    });

    it('retira con borrado lógico (deleted_at) en files', async () => {
        const { repository, update, updateEq, bucketApi } = setup();

        await repository.remove(STORED);

        expect(update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(updateEq).toHaveBeenCalledWith('id', FILE_ID);
        expect(bucketApi.remove).not.toHaveBeenCalled();
    });

    it('purga: marca deleted_at y después borra el objeto (DEC-22)', async () => {
        const { repository, update, bucketApi } = setup();

        await repository.purge(STORED);

        expect(update).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(bucketApi.remove).toHaveBeenCalledWith([STORED.storageKey]);
        expect(update.mock.invocationCallOrder[0]).toBeLessThan(bucketApi.remove.mock.invocationCallOrder[0]);
    });

    it('purga: si no puede marcar el registro, no borra el objeto', async () => {
        const { repository, updateEq, bucketApi } = setup();
        updateEq.mockResolvedValue({ error: { code: '42501', message: 'denied' } });

        await expect(repository.purge(STORED)).rejects.toBeInstanceOf(AppError);
        expect(bucketApi.remove).not.toHaveBeenCalled();
    });

    it('sin academia en el contexto rechaza la subida', async () => {
        const mock = createClient();
        TestBed.configureTestingModule({
            providers: [SupabaseFileStorageRepository, { provide: SUPABASE_CLIENT, useValue: mock.client }, { provide: AcademyContextService, useValue: { academy: signal(undefined) } }]
        });

        await expect(TestBed.inject(SupabaseFileStorageRepository).upload({ file: logo, bucket: 'public-assets', module: 'academy', entityId: ENTITY_ID })).rejects.toMatchObject({ code: 'forbidden' });
    });
});
