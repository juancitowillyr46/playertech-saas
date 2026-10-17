export type VenueType = 'office' | 'training_ground';

/** Proyección de solo lectura de una sede (spec 003, data-model.md). */
export interface Venue {
    readonly id: string;
    readonly name: string;
    readonly type: VenueType;
    readonly city: string | null;
    readonly isPrimary: boolean;
    readonly isActive: boolean;
}

/** Etiquetas del tipo de sede según el glosario. */
export const VENUE_TYPE_LABELS: Readonly<Record<VenueType, string>> = {
    office: 'Oficina',
    training_ground: 'Lugar de entrenamiento'
};
