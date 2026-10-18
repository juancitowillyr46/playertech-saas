import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { CurrentAcademy } from '../../../core/academy-context/models/academy-context.models';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { VenueInput } from '../models/venue.models';
import { SupabaseVenueRepository } from './supabase-venue.repository';

interface Result {
    data: unknown;
    error: unknown;
}

const ROW = { id: 'v2', name: 'Cancha Norte', type: 'training_ground', address: 'Calle 1', city: 'Bogotá', directions: null, is_primary: false, is_active: true };
const VENUE = { id: 'v2', name: 'Cancha Norte', type: 'training_ground', address: 'Calle 1', city: 'Bogotá', directions: null, isPrimary: false, isActive: true };
const INPUT: VenueInput = { name: 'Cancha Norte', type: 'training_ground', address: 'Calle 1', city: 'Bogotá', directions: null };

/**
 * Cliente simulado: registra cada llamada de la cadena y resuelve con `result`,
 * tanto al esperar la cadena (listado) como en `single` y `rpc`.
 */
function setup(result: Result, academy: CurrentAcademy | null = { id: 'academy-a', name: 'Academia A', logoFileId: null }) {
    const calls: [string, unknown[]][] = [];
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'insert', 'update', 'eq', 'is']) {
        chain[method] = (...args: unknown[]) => {
            calls.push([method, args]);
            return chain;
        };
    }
    chain['single'] = () => Promise.resolve(result);
    chain['then'] = (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve);
    const from = vi.fn().mockReturnValue(chain);
    const rpc = vi.fn().mockResolvedValue(result);

    TestBed.configureTestingModule({
        providers: [
            SupabaseVenueRepository,
            { provide: SUPABASE_CLIENT, useValue: { from, rpc } },
            { provide: AcademyContextService, useValue: { academy: signal(academy ?? undefined) } }
        ]
    });

    const args = (method: string) => calls.filter(([name]) => name === method).map(([, value]) => value);

    return { repository: TestBed.inject(SupabaseVenueRepository), from, rpc, args };
}

const pgError = (code: string) => ({ code, message: 'postgrest', details: null, hint: null });

describe('SupabaseVenueRepository', () => {
    describe('listVenues', () => {
        it('lee solo sedes no eliminadas, con dirección e indicaciones, sin filtrar por academia (RLS)', async () => {
            const { repository, from, args } = setup({ data: [], error: null });

            await repository.listVenues();

            expect(from).toHaveBeenCalledWith('venues');
            expect(String(args('select')[0][0])).toContain('address');
            expect(String(args('select')[0][0])).toContain('directions');
            expect(args('is')).toContainEqual(['deleted_at', null]);
            expect(args('eq')).toHaveLength(0);
        });

        it('mapea las filas y ordena la principal primero y después por nombre', async () => {
            const rows = [
                { ...ROW, id: 'v3', name: 'Polideportivo', is_active: false },
                { ...ROW, id: 'v1', name: 'Sede Principal', is_primary: true },
                { ...ROW, id: 'v2', name: 'Árbol Verde' }
            ];
            const { repository } = setup({ data: rows, error: null });

            const venues = await repository.listVenues();

            expect(venues.map((venue) => venue.id)).toEqual(['v1', 'v2', 'v3']);
            expect(venues[1]).toEqual({ ...VENUE, id: 'v2', name: 'Árbol Verde' });
        });

        it('ante un fallo de red rechaza con AppError network', async () => {
            const { repository } = setup({ data: null, error: new TypeError('Failed to fetch') });

            await expect(repository.listVenues()).rejects.toMatchObject({ code: 'network' });
        });
    });

    describe('createVenue', () => {
        it('inserta con la academia del contexto y solo los campos permitidos', async () => {
            const { repository, args } = setup({ data: ROW, error: null });

            await expect(repository.createVenue(INPUT)).resolves.toEqual(VENUE);

            const [payload] = args('insert')[0] as [Record<string, unknown>];
            expect(payload).toEqual({ academy_id: 'academy-a', name: 'Cancha Norte', type: 'training_ground', address: 'Calle 1', city: 'Bogotá', directions: null });
            expect(payload).not.toHaveProperty('created_by');
            expect(payload).not.toHaveProperty('is_primary');
            expect(payload).not.toHaveProperty('is_active');
        });

        it('sin academia en el contexto rechaza con forbidden sin llamar a Supabase', async () => {
            const { repository, from } = setup({ data: ROW, error: null }, null);

            await expect(repository.createVenue(INPUT)).rejects.toMatchObject({ code: 'forbidden' });
            expect(from).not.toHaveBeenCalled();
        });

        it('traduce el nombre duplicado (23505) a duplicate', async () => {
            const { repository } = setup({ data: null, error: pgError('23505') });

            await expect(repository.createVenue(INPUT)).rejects.toMatchObject({ code: 'duplicate' });
        });
    });

    describe('updateVenue, setActive y deleteVenue', () => {
        it('updateVenue filtra por id y no eliminadas y envía solo los datos editables', async () => {
            const { repository, args } = setup({ data: ROW, error: null });

            await expect(repository.updateVenue('v2', INPUT)).resolves.toEqual(VENUE);

            expect(args('update')[0][0]).toEqual({ name: 'Cancha Norte', type: 'training_ground', address: 'Calle 1', city: 'Bogotá', directions: null });
            expect(args('eq')).toContainEqual(['id', 'v2']);
            expect(args('is')).toContainEqual(['deleted_at', null]);
        });

        it('setActive envía solo is_active', async () => {
            const { repository, args } = setup({ data: { ...ROW, is_active: false }, error: null });

            await expect(repository.setActive('v2', false)).resolves.toMatchObject({ isActive: false });
            expect(args('update')[0][0]).toEqual({ is_active: false });
        });

        it('deleteVenue marca deleted_at con una fecha ISO', async () => {
            const { repository, args } = setup({ data: ROW, error: null });

            await repository.deleteVenue('v2');

            const [payload] = args('update')[0] as [{ deleted_at: string }];
            expect(Object.keys(payload)).toEqual(['deleted_at']);
            expect(new Date(payload.deleted_at).toISOString()).toBe(payload.deleted_at);
        });

        it('la regla de la principal (23514) se traduce a rule_violation', async () => {
            const { repository } = setup({ data: null, error: pgError('23514') });

            await expect(repository.setActive('v1', false)).rejects.toMatchObject({ code: 'rule_violation' });
        });

        it('una sede que ya no existe (PGRST116) se traduce a not_found', async () => {
            const { repository } = setup({ data: null, error: pgError('PGRST116') });

            await expect(repository.deleteVenue('v9')).rejects.toMatchObject({ code: 'not_found' });
        });
    });

    describe('setPrimary', () => {
        it('llama a set_primary_venue con el id de la sede', async () => {
            const { repository, rpc } = setup({ data: null, error: null });

            await repository.setPrimary('v2');

            expect(rpc).toHaveBeenCalledWith('set_primary_venue', { p_venue_id: 'v2' });
        });

        it('el 42501 de la función (sede no encontrada) se traduce a not_found', async () => {
            const { repository } = setup({ data: null, error: pgError('42501') });

            await expect(repository.setPrimary('v9')).rejects.toMatchObject({ code: 'not_found' });
        });

        it('una sede inactiva (23514) se traduce a rule_violation', async () => {
            const { repository } = setup({ data: null, error: pgError('23514') });

            await expect(repository.setPrimary('v3')).rejects.toMatchObject({ code: 'rule_violation' });
        });
    });
});
