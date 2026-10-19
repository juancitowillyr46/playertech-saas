import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { PlayerRepository } from '../data/player.repository';
import { PlayerInput, PlayerSummary } from '../models/player.models';
import { PlayersService } from './players.service';

const player = (id: string, firstNames: string, overrides: Partial<PlayerSummary> = {}): PlayerSummary => ({
    id,
    firstNames,
    lastNames: 'Vargas',
    nickname: null,
    birthDate: '2014-05-10',
    phone: null,
    isActive: true,
    groups: [],
    guardianCount: 0,
    ...overrides
});

const SAMUEL = player('p1', 'Samuel', { nickname: 'Samu', groups: [{ id: 'g1', name: 'Sub-12' }] });
const JOSE = player('p2', 'José', { lastNames: 'Pérez' });
const OLD = player('p3', 'Andrés', { isActive: false });
const INPUT: PlayerInput = { firstNames: ' Samuel ', lastNames: ' Vargas ', nickname: '  ', birthDate: '2014-05-10', phone: '300 123 4567', groupIds: ['g1'] };

function setup(overrides: Partial<Record<keyof PlayerRepository, ReturnType<typeof vi.fn>>> = {}) {
    const repository = {
        listPlayers: vi.fn().mockResolvedValue([SAMUEL, JOSE, OLD]),
        getPlayer: vi.fn().mockResolvedValue(SAMUEL),
        listGroups: vi.fn().mockResolvedValue([{ id: 'g1', name: 'Sub-12' }]),
        findByIdentity: vi.fn().mockResolvedValue(null),
        createPlayer: vi.fn().mockResolvedValue('p9'),
        updatePlayer: vi.fn().mockResolvedValue(undefined),
        setActive: vi.fn().mockResolvedValue(undefined),
        deletePlayer: vi.fn().mockResolvedValue(undefined),
        ...overrides
    };

    TestBed.configureTestingModule({ providers: [PlayersService, { provide: PlayerRepository, useValue: repository }] });

    return { service: TestBed.inject(PlayersService), repository };
}

describe('PlayersService', () => {
    it('carga jugadores y grupos; por defecto muestra solo activos, ordenados por nombre', async () => {
        const { service } = setup();

        await service.load();

        expect(service.status()).toBe('ready');
        expect(service.groups()).toHaveLength(1);
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p2', 'p1']);
    });

    it('busca por nombre, apellido o apodo sin tildes ni mayúsculas, y filtra por grupo y estado (HU-003)', async () => {
        const { service } = setup();
        await service.load();

        service.query.set('jose');
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p2']);
        service.query.set('SAMU');
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p1']);
        service.query.set('perez');
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p2']);

        service.query.set('');
        service.groupFilter.set('g1');
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p1']);

        service.groupFilter.set('all');
        service.statusFilter.set('inactive');
        expect(service.visiblePlayers().map((p) => p.id)).toEqual(['p3']);
    });

    it('sin jugadores pasa a empty; ante un error, a error', async () => {
        const empty = setup({ listPlayers: vi.fn().mockResolvedValue([]) });
        await empty.service.load();
        expect(empty.service.status()).toBe('empty');

        TestBed.resetTestingModule();
        const failing = setup({ listPlayers: vi.fn().mockRejectedValue(new AppError('network')) });
        await failing.service.load();
        expect(failing.service.status()).toBe('error');
    });

    it('create: limpia lo escrito (opcionales vacíos a null, celular normalizado) y relee el listado', async () => {
        const { service, repository } = setup();

        expect(await service.create(INPUT)).toEqual({ saved: true });
        expect(repository.createPlayer).toHaveBeenCalledWith({ firstNames: 'Samuel', lastNames: 'Vargas', nickname: null, birthDate: '2014-05-10', phone: '3001234567', groupIds: ['g1'] });
        expect(repository.listPlayers).toHaveBeenCalled();
    });

    it('create: si ya está registrado, no crea y devuelve el existente (CA-006 de HU-002)', async () => {
        const { service, repository } = setup({ findByIdentity: vi.fn().mockResolvedValue('p1') });

        expect(await service.create(INPUT)).toEqual({ duplicate: SAMUEL });
        expect(repository.createPlayer).not.toHaveBeenCalled();
    });

    it('create: el duplicado por carrera (23505) también ofrece actualizar al existente', async () => {
        const findByIdentity = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('p1');
        const { service } = setup({ findByIdentity, createPlayer: vi.fn().mockRejectedValue(new AppError('duplicate')) });

        expect(await service.create(INPUT)).toEqual({ duplicate: SAMUEL });
    });

    it('replaceDuplicate: actualiza al existente y lo reactiva si estaba inactivo', async () => {
        const { service, repository } = setup();

        await service.replaceDuplicate(OLD, INPUT);

        expect(repository.updatePlayer).toHaveBeenCalledWith('p3', expect.objectContaining({ firstNames: 'Samuel', phone: '3001234567' }));
        expect(repository.setActive).toHaveBeenCalledWith('p3', true);

        repository.setActive.mockClear();
        await service.replaceDuplicate(SAMUEL, INPUT);
        expect(repository.setActive).not.toHaveBeenCalled();
    });

    it('una operación a la vez: con busy se ignora la segunda', async () => {
        let release!: () => void;
        const { service, repository } = setup({ setActive: vi.fn(() => new Promise<void>((resolve) => (release = resolve))) });

        const first = service.setActive(SAMUEL, false);
        await service.setActive(SAMUEL, false);
        release();
        await first;

        expect(repository.setActive).toHaveBeenCalledTimes(1);
        expect(service.busy()).toBe(false);
    });
});
