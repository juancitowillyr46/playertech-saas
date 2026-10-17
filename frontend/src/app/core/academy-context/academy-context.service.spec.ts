import { TestBed } from '@angular/core/testing';
import { AppError } from '../errors/app-error';
import { AcademyContextService } from './academy-context.service';
import { AcademyContextRepository } from './data/academy-context.repository';

const ACTIVE = { status: 'active', academy: { id: 'academy-a', name: 'Academia A', logoFileId: null } } as const;

describe('AcademyContextService', () => {
    let loadCurrent: ReturnType<typeof vi.fn>;
    let service: AcademyContextService;

    beforeEach(() => {
        loadCurrent = vi.fn();
        TestBed.configureTestingModule({
            providers: [{ provide: AcademyContextRepository, useValue: { loadCurrent } }]
        });
        service = TestBed.inject(AcademyContextService);
    });

    it('empieza en loading y sin academia', () => {
        expect(service.status()).toBe('loading');
        expect(service.academy()).toBeUndefined();
    });

    it.each(['active', 'suspended', 'none'] as const)('refleja la situación %s del repositorio', async (status) => {
        loadCurrent.mockResolvedValue(status === 'active' ? ACTIVE : { status });

        await service.load();

        expect(service.status()).toBe(status);
    });

    it('expone la academia cuando está activa', async () => {
        loadCurrent.mockResolvedValue(ACTIVE);

        await service.load();

        expect(service.academy()).toEqual(ACTIVE.academy);
    });

    it('ante un error queda en error', async () => {
        loadCurrent.mockRejectedValue(new AppError('network'));

        await service.load();

        expect(service.status()).toBe('error');
    });

    it('load() reutiliza el resultado ya cargado', async () => {
        loadCurrent.mockResolvedValue(ACTIVE);

        await service.load();
        await service.load();

        expect(loadCurrent).toHaveBeenCalledTimes(1);
    });

    it('load() concurrente consulta una sola vez', async () => {
        loadCurrent.mockResolvedValue(ACTIVE);

        await Promise.all([service.load(), service.load()]);

        expect(loadCurrent).toHaveBeenCalledTimes(1);
    });

    it('reload() vuelve a consultar', async () => {
        loadCurrent.mockResolvedValueOnce({ status: 'suspended' }).mockResolvedValueOnce(ACTIVE);

        await service.load();
        await service.reload();

        expect(loadCurrent).toHaveBeenCalledTimes(2);
        expect(service.status()).toBe('active');
    });

    it('clear() vuelve al estado inicial y obliga a consultar de nuevo', async () => {
        loadCurrent.mockResolvedValue(ACTIVE);
        await service.load();

        service.clear();
        expect(service.status()).toBe('loading');

        await service.load();
        expect(loadCurrent).toHaveBeenCalledTimes(2);
    });
});
