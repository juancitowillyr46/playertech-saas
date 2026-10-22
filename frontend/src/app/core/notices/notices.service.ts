import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AcademyContextService } from '../academy-context/academy-context.service';
import { NewResponsesNotice } from './notices.models';
import { NoticesRepository } from './notices.repository';

/** Por datos móviles limitados (PRODUCT.md): al navegar se relee como máximo cada 30 s. */
const NAVIGATION_INTERVAL_MS = 30_000;

/**
 * Avisos del owner (spec 014, HU-041): pendientes de validar para el contador de la navegación
 * y respuestas nuevas para el inicio. Se actualizan al navegar, al volver a la aplicación y
 * tras validar; sin actualización en vivo (DEC-46). Si una lectura falla, se conserva lo último.
 */
@Injectable({ providedIn: 'root' })
export class NoticesService {
    private readonly repository = inject(NoticesRepository);
    private readonly academyContext = inject(AcademyContextService);

    readonly pendingCount = signal(0);
    readonly newResponses = signal<readonly NewResponsesNotice[]>([]);
    /** La última lectura de respuestas nuevas falló: el inicio omite la sección (FR-009). */
    readonly failed = signal(false);

    /** La primera navegación siempre lee. */
    private lastRead = Number.NEGATIVE_INFINITY;

    constructor() {
        const router = inject(Router);
        const subscription = router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => void this.refreshOnNavigation());
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void this.refresh();
            }
        };

        document.addEventListener('visibilitychange', onVisible);
        inject(DestroyRef).onDestroy(() => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', onVisible);
        });
    }

    /** Relee ahora (al entrar al inicio, al volver a la aplicación o tras validar). */
    async refresh(): Promise<void> {
        if (!this.academyContext.academy()) {
            return;
        }

        this.lastRead = Date.now();
        const [pending, responses] = await Promise.allSettled([this.repository.pendingCount(), this.repository.newResponses()]);

        if (pending.status === 'fulfilled') {
            this.pendingCount.set(pending.value);
        }

        this.failed.set(responses.status === 'rejected');

        if (responses.status === 'fulfilled') {
            this.newResponses.set(responses.value);
        }
    }

    async refreshOnNavigation(): Promise<void> {
        if (Date.now() - this.lastRead >= NAVIGATION_INTERVAL_MS) {
            await this.refresh();
        }
    }
}
