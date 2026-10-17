import { Venue } from '../models/venue.models';

/**
 * Lectura de las sedes de la academia actual (spec 003, contracts/repositories.md).
 * No recibe `academy_id`: RLS limita el resultado a la academia del miembro.
 * La escritura llega con HU-029 y HU-031.
 */
export abstract class VenueRepository {
    /** Sedes no eliminadas; la principal primero y después por nombre. */
    abstract listVenues(): Promise<readonly Venue[]>;
}
