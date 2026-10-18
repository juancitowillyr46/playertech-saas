import { Venue, VenueInput } from '../models/venue.models';

/**
 * Sedes de la academia actual (spec 004, contracts/repositories.md). RLS limita
 * todo a la academia del miembro y solo el owner escribe. Toda operación rechaza
 * con `AppError`.
 */
export abstract class VenueRepository {
    /** Sedes no eliminadas; la principal primero y después por nombre. */
    abstract listVenues(): Promise<readonly Venue[]>;

    /** Crea una sede activa y no principal en la academia actual. */
    abstract createVenue(input: VenueInput): Promise<Venue>;

    abstract updateVenue(id: string, input: VenueInput): Promise<Venue>;

    abstract setActive(id: string, active: boolean): Promise<Venue>;

    /** Borrado lógico: deja de aparecer, pero su información se conserva. */
    abstract deleteVenue(id: string): Promise<void>;

    /** Marca la sede como principal y desmarca la anterior en una sola operación. */
    abstract setPrimary(id: string): Promise<void>;
}
