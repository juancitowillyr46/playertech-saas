import { computed, inject, Injectable, signal } from '@angular/core';
import { VenueRepository } from './data/venue.repository';
import { Venue } from './models/venue.models';

export type VenuesStatus = 'loading' | 'ready' | 'empty' | 'error';
export type VenueStatusFilter = 'all' | 'active' | 'inactive';

/** Minúsculas y sin tildes, para buscar "arbol" y encontrar "Árbol". */
function normalize(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Estado de la pantalla de sedes (spec 003, contracts/repositories.md). La
 * búsqueda y el filtro se aplican en el cliente: una academia tiene pocas sedes.
 */
@Injectable()
export class VenuesService {
    private readonly repository = inject(VenueRepository);

    readonly venues = signal<readonly Venue[]>([]);
    readonly status = signal<VenuesStatus>('loading');
    readonly query = signal('');
    readonly statusFilter = signal<VenueStatusFilter>('all');

    readonly visibleVenues = computed(() => {
        const query = normalize(this.query().trim());
        const filter = this.statusFilter();

        return this.venues().filter((venue) => {
            const matchesStatus = filter === 'all' || (filter === 'active') === venue.isActive;
            const matchesQuery = !query || normalize(`${venue.name} ${venue.city ?? ''}`).includes(query);

            return matchesStatus && matchesQuery;
        });
    });

    /** Carga o vuelve a cargar las sedes (también como reintento tras un error). */
    async load(): Promise<void> {
        this.status.set('loading');

        try {
            const venues = await this.repository.listVenues();

            this.venues.set(venues);
            this.status.set(venues.length > 0 ? 'ready' : 'empty');
        } catch {
            this.status.set('error');
        }
    }
}
