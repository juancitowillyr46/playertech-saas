import { computed, inject, Injectable, signal } from '@angular/core';
import { AcademyContextRepository } from './data/academy-context.repository';
import { AcademyContext, CurrentAcademy } from './models/academy-context.models';

const INITIAL: AcademyContext = { status: 'loading' };

/**
 * Academia actual del usuario. Se resuelve al iniciar sesión o al recargar la
 * página, no en cada navegación: la protección real de los datos es RLS.
 * No es una frontera de autorización (docs/architecture/frontend.md).
 */
@Injectable({ providedIn: 'root' })
export class AcademyContextService {
    private readonly repository = inject(AcademyContextRepository);
    private readonly state = signal<AcademyContext>(INITIAL);
    private pending: Promise<void> | null = null;

    readonly context = this.state.asReadonly();
    readonly status = computed(() => this.state().status);
    readonly academy = computed(() => this.state().academy);

    /** Carga el contexto si aún no se ha resuelto. */
    load(): Promise<void> {
        if (this.state().status !== 'loading') {
            return Promise.resolve();
        }

        this.pending ??= this.fetch();

        return this.pending;
    }

    /** Vuelve a consultar, por ejemplo tras un error de conexión. */
    reload(): Promise<void> {
        this.clear();

        return this.load();
    }

    clear(): void {
        this.pending = null;
        this.state.set(INITIAL);
    }

    /**
     * Refleja en el contexto un cambio del nombre o del logo sin volver a consultar ni pasar
     * por `loading`, que los guards interpretarían como carga (spec 007, research R6).
     */
    applyAcademyChanges(changes: Partial<Pick<CurrentAcademy, 'name' | 'logoFileId'>>): void {
        const current = this.state();

        if (current.academy) {
            this.state.set({ ...current, academy: { ...current.academy, ...changes } });
        }
    }

    private async fetch(): Promise<void> {
        try {
            this.state.set(await this.repository.loadCurrent());
        } catch {
            this.state.set({ status: 'error' });
        } finally {
            this.pending = null;
        }
    }
}
