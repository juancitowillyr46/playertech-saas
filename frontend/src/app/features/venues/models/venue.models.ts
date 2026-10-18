export type VenueType = 'office' | 'training_ground';

/** Sede de la academia (spec 004, data-model.md). */
export interface Venue {
    readonly id: string;
    readonly name: string;
    readonly type: VenueType;
    readonly address: string | null;
    readonly city: string | null;
    readonly directions: string | null;
    readonly isPrimary: boolean;
    readonly isActive: boolean;
}

/**
 * Datos que el owner escribe al crear o editar una sede (DEC-23). La academia y
 * el autor no forman parte: los aportan el contexto y la base de datos.
 */
export interface VenueInput {
    readonly name: string;
    readonly type: VenueType;
    readonly address: string | null;
    readonly city: string | null;
    readonly directions: string | null;
}

/** Etiquetas del tipo de sede según el glosario. */
export const VENUE_TYPE_LABELS: Readonly<Record<VenueType, string>> = {
    office: 'Oficina',
    training_ground: 'Lugar de entrenamiento'
};
