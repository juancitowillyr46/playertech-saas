import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { MockResult, pgError, supabaseClientMock } from '../../../testing/supabase-client-mock';
import { SupabaseExternalFieldRepository } from './supabase-external-field.repository';

const FIELD = { id: 'f1', name: 'Cancha El Salitre', address: null, city: 'Bogotá', directions: null };

function setup(results: MockResult[]) {
    const mock = supabaseClientMock(results);

    TestBed.configureTestingModule({
        providers: [
            SupabaseExternalFieldRepository,
            { provide: SUPABASE_CLIENT, useValue: mock.client },
            { provide: AcademyContextService, useValue: { academy: signal({ id: 'academy-a', name: 'A', logoFileId: null }) } }
        ]
    });

    return { repository: TestBed.inject(SupabaseExternalFieldRepository), ...mock };
}

describe('SupabaseExternalFieldRepository', () => {
    it('list: no retiradas, por nombre', async () => {
        const { repository, args } = setup([{ data: [FIELD], error: null }]);

        expect(await repository.list()).toEqual([FIELD]);
        expect(args('is')).toContainEqual(['deleted_at', null]);
        expect(args('order')[0][0]).toBe('name');
    });

    it('create: con la academia del contexto y devuelve la cancha; nombre repetido, duplicate', async () => {
        const { repository, args } = setup([
            { data: FIELD, error: null },
            { data: null, error: pgError('23505') }
        ]);
        const input = { name: 'Cancha El Salitre', address: null, city: 'Bogotá', directions: null };

        expect(await repository.create(input)).toEqual(FIELD);
        expect(args('insert')[0][0]).toEqual({ academy_id: 'academy-a', ...input });
        await expect(repository.create(input)).rejects.toMatchObject({ code: 'duplicate' });
    });

    it('retire: solo deleted_at, sobre una no retirada', async () => {
        const { repository, args } = setup([{ data: { id: 'f1' }, error: null }]);

        await repository.retire('f1');

        expect(Object.keys(args('update')[0][0] as object)).toEqual(['deleted_at']);
        expect(args('is')).toContainEqual(['deleted_at', null]);
    });
});
