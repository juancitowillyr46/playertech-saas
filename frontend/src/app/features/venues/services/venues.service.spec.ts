import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { VenueRepository } from '../data/venue.repository';
import { Venue } from '../models/venue.models';
import { VenuesService } from './venues.service';

const VENUES: Venue[] = [
    { id: 'v1', name: 'Sede Principal', type: 'office', city: 'Bogotá', isPrimary: true, isActive: true },
    { id: 'v2', name: 'Cancha Árbol', type: 'training_ground', city: 'Medellín', isPrimary: false, isActive: true },
    { id: 'v3', name: 'Coliseo', type: 'training_ground', city: null, isPrimary: false, isActive: false }
];

function setup(listVenues: () => Promise<readonly Venue[]>) {
    TestBed.configureTestingModule({
        providers: [VenuesService, { provide: VenueRepository, useValue: { listVenues: vi.fn(listVenues) } }]
    });

    return TestBed.inject(VenuesService);
}

describe('VenuesService', () => {
    it('empieza cargando y pasa a ready con las sedes', async () => {
        const service = setup(() => Promise.resolve(VENUES));

        expect(service.status()).toBe('loading');
        await service.load();

        expect(service.status()).toBe('ready');
        expect(service.visibleVenues()).toHaveLength(3);
    });

    it('sin sedes queda en empty', async () => {
        const service = setup(() => Promise.resolve([]));

        await service.load();

        expect(service.status()).toBe('empty');
    });

    it('ante un fallo queda en error y reintenta con load', async () => {
        const listVenues = vi.fn().mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce(VENUES);
        TestBed.configureTestingModule({ providers: [VenuesService, { provide: VenueRepository, useValue: { listVenues } }] });
        const service = TestBed.inject(VenuesService);

        await service.load();
        expect(service.status()).toBe('error');

        await service.load();
        expect(service.status()).toBe('ready');
    });

    it('busca por nombre y ciudad sin distinguir mayúsculas ni tildes', async () => {
        const service = setup(() => Promise.resolve(VENUES));
        await service.load();

        service.query.set('arbol');
        expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v2']);

        service.query.set('BOGOTA');
        expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v1']);
    });

    it('filtra por estado activo o inactivo', async () => {
        const service = setup(() => Promise.resolve(VENUES));
        await service.load();

        service.statusFilter.set('inactive');
        expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v3']);

        service.statusFilter.set('active');
        expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v1', 'v2']);
    });
});
