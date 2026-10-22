import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AcademyContextService } from '../academy-context/academy-context.service';
import { NoticesRepository } from './notices.repository';
import { NoticesService } from './notices.service';

function setup(academy: unknown = { id: 'a' }) {
    const events = new Subject<unknown>();
    const repository = { pendingCount: vi.fn().mockResolvedValue(3), newResponses: vi.fn().mockResolvedValue([]) };
    TestBed.configureTestingModule({
        providers: [
            { provide: NoticesRepository, useValue: repository },
            { provide: AcademyContextService, useValue: { academy: signal(academy) } },
            { provide: Router, useValue: { events } }
        ]
    });

    return { service: TestBed.inject(NoticesService), repository, events };
}

describe('NoticesService', () => {
    afterEach(() => vi.restoreAllMocks());

    it('al navegar relee como máximo cada 30 segundos', async () => {
        const now = vi.spyOn(Date, 'now').mockReturnValue(0);
        const { service, repository, events } = setup();

        events.next(new NavigationEnd(1, '/home', '/home'));
        await vi.waitFor(() => expect(service.pendingCount()).toBe(3));
        events.next(new NavigationEnd(2, '/players', '/players'));
        await vi.waitFor(() => expect(repository.pendingCount).toHaveBeenCalledTimes(1));
        now.mockReturnValue(31_000);
        events.next(new NavigationEnd(3, '/activities', '/activities'));
        await vi.waitFor(() => expect(repository.pendingCount).toHaveBeenCalledTimes(2));
    });

    it('sin academia no consulta', async () => {
        const { service, repository } = setup(null);

        await service.refresh();

        expect(repository.pendingCount).not.toHaveBeenCalled();
    });

    it('si fallan los avisos conserva el contador y marca el fallo', async () => {
        const { service, repository } = setup();
        await service.refresh();
        repository.pendingCount.mockRejectedValueOnce(new Error('red'));
        repository.newResponses.mockRejectedValueOnce(new Error('red'));

        await service.refresh();

        expect(service.pendingCount()).toBe(3);
        expect(service.failed()).toBe(true);
    });

    it('al volver a la aplicación relee', async () => {
        const { repository } = setup();

        document.dispatchEvent(new Event('visibilitychange'));

        await vi.waitFor(() => expect(repository.pendingCount).toHaveBeenCalled());
    });
});
