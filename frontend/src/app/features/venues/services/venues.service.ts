import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { VenueRepository } from '../data/venue.repository';
import { Venue, VenueInput } from '../models/venue.models';

export type VenuesStatus = 'loading' | 'ready' | 'empty' | 'error';
export type VenueStatusFilter = 'all' | 'active' | 'inactive';

/** Minúsculas y sin tildes, para buscar "arbol" y encontrar "Árbol". */
function normalize(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Texto recortado; vacío pasa a null (research R5). */
function clean(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed === '' ? null : trimmed;
}

function cleanInput(input: VenueInput): VenueInput {
    return { name: input.name.trim(), type: input.type, address: clean(input.address), city: clean(input.city), directions: clean(input.directions) };
}

/**
 * Estado y operaciones de la pantalla de sedes (spec 004, contracts/repositories.md).
 * La búsqueda y el filtro se aplican en el cliente: una academia tiene pocas sedes.
 * Tras cada operación se relee el listado sin pasar a carga (research R6), porque
 * cambiar la principal afecta a dos sedes y la base de datos es la fuente de verdad.
 */
@Injectable()
export class VenuesService {
    private readonly repository = inject(VenueRepository);

    readonly venues = signal<readonly Venue[]>([]);
    readonly status = signal<VenuesStatus>('loading');
    readonly query = signal('');
    readonly statusFilter = signal<VenueStatusFilter>('all');
    /** Hay una operación en curso: las demás acciones se bloquean. */
    readonly busy = signal(false);

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
            this.apply(await this.repository.listVenues());
        } catch {
            this.status.set('error');
        }
    }

    /** Aviso temprano de nombre en uso; la garantía es el índice único de la base de datos. */
    isNameTaken(name: string, exceptId?: string): boolean {
        const wanted = name.trim().toLocaleLowerCase('es-CO');

        return this.venues().some((venue) => venue.id !== exceptId && venue.name.trim().toLocaleLowerCase('es-CO') === wanted);
    }

    create(input: VenueInput): Promise<void> {
        return this.run(() => this.repository.createVenue(cleanInput(input)));
    }

    update(id: string, input: VenueInput): Promise<void> {
        return this.run(() => this.repository.updateVenue(id, cleanInput(input)));
    }

    setActive(venue: Venue, active: boolean): Promise<void> {
        return this.run(() => this.repository.setActive(venue.id, active));
    }

    remove(venue: Venue): Promise<void> {
        return this.run(() => this.repository.deleteVenue(venue.id));
    }

    setPrimary(venue: Venue): Promise<void> {
        return this.run(() => this.repository.setPrimary(venue.id));
    }

    /** Una operación a la vez; al terminar (o si la sede ya no existe) se relee el listado. */
    private async run(operation: () => Promise<unknown>): Promise<void> {
        if (this.busy()) {
            return;
        }

        this.busy.set(true);

        try {
            await operation();
            await this.refresh();
        } catch (error) {
            if (error instanceof AppError && error.code === 'not_found') {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    /** Relee sin pasar a carga; si falla, se conserva el listado actual. */
    private async refresh(): Promise<void> {
        try {
            this.apply(await this.repository.listVenues());
        } catch {
            // El listado visible sigue siendo válido; el próximo cambio lo actualizará.
        }
    }

    private apply(venues: readonly Venue[]): void {
        this.venues.set(venues);
        this.status.set(venues.length > 0 ? 'ready' : 'empty');
    }
}
