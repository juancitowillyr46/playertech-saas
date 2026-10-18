import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { VenueRepository } from '../data/venue.repository';
import { Venue } from '../models/venue.models';
import { VenuesService } from './venues.service';

const VENUES: Venue[] = [
    { id: 'v1', name: 'Sede Principal', type: 'office', city: 'Bogotá', address: null, directions: null, isPrimary: true, isActive: true },
    { id: 'v2', name: 'Cancha Árbol', type: 'training_ground', city: 'Medellín', address: null, directions: null, isPrimary: false, isActive: true },
    { id: 'v3', name: 'Coliseo', type: 'training_ground', city: null, address: null, directions: null, isPrimary: false, isActive: false }
];

function repositoryMock(overrides: Partial<Record<keyof VenueRepository, ReturnType<typeof vi.fn>>> = {}) {
    return {
        listVenues: vi.fn().mockResolvedValue(VENUES),
        createVenue: vi.fn().mockResolvedValue(VENUES[1]),
        updateVenue: vi.fn().mockResolvedValue(VENUES[1]),
        setActive: vi.fn().mockResolvedValue(VENUES[1]),
        deleteVenue: vi.fn().mockResolvedValue(undefined),
        setPrimary: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };
}

function setup(repository = repositoryMock()) {
    TestBed.configureTestingModule({ providers: [VenuesService, { provide: VenueRepository, useValue: repository }] });

    return { service: TestBed.inject(VenuesService), repository };
}

describe('VenuesService', () => {
    describe('lectura', () => {
        it('empieza cargando y pasa a ready con las sedes', async () => {
            const { service } = setup();

            expect(service.status()).toBe('loading');
            await service.load();

            expect(service.status()).toBe('ready');
            expect(service.visibleVenues()).toHaveLength(3);
        });

        it('sin sedes queda en empty', async () => {
            const { service } = setup(repositoryMock({ listVenues: vi.fn().mockResolvedValue([]) }));

            await service.load();

            expect(service.status()).toBe('empty');
        });

        it('ante un fallo queda en error y reintenta con load', async () => {
            const listVenues = vi.fn().mockRejectedValueOnce(new AppError('network')).mockResolvedValueOnce(VENUES);
            const { service } = setup(repositoryMock({ listVenues }));

            await service.load();
            expect(service.status()).toBe('error');

            await service.load();
            expect(service.status()).toBe('ready');
        });

        it('busca por nombre y ciudad sin distinguir mayúsculas ni tildes', async () => {
            const { service } = setup();
            await service.load();

            service.query.set('arbol');
            expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v2']);

            service.query.set('BOGOTA');
            expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v1']);
        });

        it('filtra por estado activo o inactivo', async () => {
            const { service } = setup();
            await service.load();

            service.statusFilter.set('inactive');
            expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v3']);

            service.statusFilter.set('active');
            expect(service.visibleVenues().map((venue) => venue.id)).toEqual(['v1', 'v2']);
        });
    });

    describe('escritura', () => {
        it('create recorta los textos y guarda los opcionales vacíos como null', async () => {
            const { service, repository } = setup();
            await service.load();

            await service.create({ name: '  Cancha Norte ', type: 'training_ground', address: '   ', city: ' Bogotá ', directions: '' });

            expect(repository.createVenue).toHaveBeenCalledWith({ name: 'Cancha Norte', type: 'training_ground', address: null, city: 'Bogotá', directions: null });
        });

        it('update normaliza y envía el id de la sede', async () => {
            const { service, repository } = setup();
            await service.load();

            await service.update('v2', { name: 'Cancha Árbol ', type: 'office', address: 'Calle 1 ', city: null, directions: null });

            expect(repository.updateVenue).toHaveBeenCalledWith('v2', { name: 'Cancha Árbol', type: 'office', address: 'Calle 1', city: null, directions: null });
        });

        it('isNameTaken no distingue mayúsculas ni espacios y excluye la sede indicada', async () => {
            const { service } = setup();
            await service.load();

            expect(service.isNameTaken('  cancha árbol ')).toBe(true);
            expect(service.isNameTaken('Cancha Árbol', 'v2')).toBe(false);
            expect(service.isNameTaken('Cancha Norte')).toBe(false);
        });

        it.each([
            ['create', (service: VenuesService) => service.create({ name: 'Nueva', type: 'office', address: null, city: null, directions: null })],
            ['update', (service: VenuesService) => service.update('v2', { name: 'Otra', type: 'office', address: null, city: null, directions: null })],
            ['setActive', (service: VenuesService) => service.setActive(VENUES[1], false)],
            ['remove', (service: VenuesService) => service.remove(VENUES[1])],
            ['setPrimary', (service: VenuesService) => service.setPrimary(VENUES[1])]
        ] as const)('%s relee el listado sin pasar a loading y conserva la búsqueda y el filtro', async (_name, operation) => {
            const { service, repository } = setup();
            await service.load();
            service.query.set('cancha');
            service.statusFilter.set('active');
            const statuses: string[] = [];
            repository.listVenues.mockImplementation(() => {
                statuses.push(service.status());
                return Promise.resolve(VENUES);
            });

            await operation(service);

            expect(repository.listVenues).toHaveBeenCalledTimes(2);
            expect(statuses).toEqual(['ready']);
            expect(service.status()).toBe('ready');
            expect(service.query()).toBe('cancha');
            expect(service.statusFilter()).toBe('active');
        });

        it('busy es true durante la operación y una segunda llamada simultánea se ignora', async () => {
            let finish!: () => void;
            const setPrimary = vi.fn().mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
            const { service } = setup(repositoryMock({ setPrimary }));
            await service.load();

            const first = service.setPrimary(VENUES[1]);
            expect(service.busy()).toBe(true);
            await service.setPrimary(VENUES[2]);
            expect(setPrimary).toHaveBeenCalledTimes(1);

            finish();
            await first;
            expect(service.busy()).toBe(false);
        });

        it('propaga el AppError del repositorio y libera busy', async () => {
            const { service } = setup(repositoryMock({ createVenue: vi.fn().mockRejectedValue(new AppError('duplicate')) }));
            await service.load();

            await expect(service.create({ name: 'Cancha Árbol', type: 'office', address: null, city: null, directions: null })).rejects.toMatchObject({ code: 'duplicate' });
            expect(service.busy()).toBe(false);
        });

        it('si la sede ya no existe (not_found), relee el listado antes de propagar el error', async () => {
            const { service, repository } = setup(repositoryMock({ deleteVenue: vi.fn().mockRejectedValue(new AppError('not_found')) }));
            await service.load();

            await expect(service.remove(VENUES[2])).rejects.toMatchObject({ code: 'not_found' });
            expect(repository.listVenues).toHaveBeenCalledTimes(2);
        });
    });
});
