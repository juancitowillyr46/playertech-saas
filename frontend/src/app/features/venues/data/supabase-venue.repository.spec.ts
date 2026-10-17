import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { SupabaseVenueRepository } from './supabase-venue.repository';

function setup(result: { data: unknown; error: unknown }) {
    const is = vi.fn().mockResolvedValue(result);
    const eq = vi.fn();
    const select = vi.fn().mockReturnValue({ is, eq });
    const from = vi.fn().mockReturnValue({ select });

    TestBed.configureTestingModule({
        providers: [SupabaseVenueRepository, { provide: SUPABASE_CLIENT, useValue: { from } }]
    });

    return { repository: TestBed.inject(SupabaseVenueRepository), from, select, is, eq };
}

const ROWS = [
    { id: 'v3', name: 'Cancha Norte', type: 'training_ground', city: 'Medellín', is_primary: false, is_active: false },
    { id: 'v1', name: 'Sede Principal', type: 'office', city: 'Bogotá', is_primary: true, is_active: true },
    { id: 'v2', name: 'Árbol Verde', type: 'training_ground', city: null, is_primary: false, is_active: true }
];

describe('SupabaseVenueRepository', () => {
    it('lee solo sedes no eliminadas y no filtra por academia (RLS)', async () => {
        const { repository, from, is, eq } = setup({ data: [], error: null });

        await repository.listVenues();

        expect(from).toHaveBeenCalledWith('venues');
        expect(is).toHaveBeenCalledWith('deleted_at', null);
        expect(eq).not.toHaveBeenCalled();
    });

    it('mapea las filas y ordena la principal primero y después por nombre', async () => {
        const { repository } = setup({ data: ROWS, error: null });

        await expect(repository.listVenues()).resolves.toEqual([
            { id: 'v1', name: 'Sede Principal', type: 'office', city: 'Bogotá', isPrimary: true, isActive: true },
            { id: 'v2', name: 'Árbol Verde', type: 'training_ground', city: null, isPrimary: false, isActive: true },
            { id: 'v3', name: 'Cancha Norte', type: 'training_ground', city: 'Medellín', isPrimary: false, isActive: false }
        ]);
    });

    it('ante un fallo de red rechaza con AppError network', async () => {
        const { repository } = setup({ data: null, error: new TypeError('Failed to fetch') });

        await expect(repository.listVenues()).rejects.toMatchObject({ code: 'network' });
    });
});
