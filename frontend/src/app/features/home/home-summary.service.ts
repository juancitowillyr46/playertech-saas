import { inject, Injectable, signal } from '@angular/core';
import { AcademyContextService } from '../../core/academy-context/academy-context.service';
import { FileStorageRepository } from '../../core/storage/data/file-storage.repository';
import { StoredFile } from '../../core/storage/models/storage.models';
import { initialsOf } from '../../shared/pipes/initials.pipe';
import { HomeSummaryRepository } from './data/home-summary.repository';
import { HomeSummary } from './models/home-summary.models';

export type HomeSummaryStatus = 'loading' | 'ready' | 'error';

/**
 * Resumen del inicio (spec 003, contracts/repositories.md): combina el contexto
 * de academia, el resumen del repositorio y la URL del logo.
 */
@Injectable()
export class HomeSummaryService {
    private readonly academyContext = inject(AcademyContextService);
    private readonly repository = inject(HomeSummaryRepository);
    private readonly storage = inject(FileStorageRepository);

    readonly summary = signal<HomeSummary | null>(null);
    readonly status = signal<HomeSummaryStatus>('loading');

    /** Carga o vuelve a cargar el resumen (también como reintento tras un error). */
    async load(): Promise<void> {
        const academy = this.academyContext.academy();

        this.status.set('loading');

        try {
            const data = await this.repository.loadSummary(academy?.logoFileId ?? null);
            const name = academy?.name ?? '';

            this.summary.set({
                academyName: name,
                initials: initialsOf(name),
                logoUrl: await this.logoUrl(data.logo),
                planName: data.planName,
                primaryVenue: data.primaryVenue
            });
            this.status.set('ready');
        } catch {
            this.summary.set(null);
            this.status.set('error');
        }
    }

    /** Un logo que no carga no es un error de la página: se muestran las iniciales. */
    private async logoUrl(logo: StoredFile | null): Promise<string | null> {
        if (!logo) {
            return null;
        }

        try {
            return await this.storage.getUrl(logo);
        } catch {
            return null;
        }
    }
}
