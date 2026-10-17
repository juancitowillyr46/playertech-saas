import { StoredFile } from '../../../core/storage/models/storage.models';

export interface PrimaryVenueSummary {
    readonly name: string;
    readonly city: string | null;
}

/** Datos que el repositorio lee para el inicio (contracts/repositories.md). */
export interface HomeSummaryData {
    readonly planName: string | null;
    readonly primaryVenue: PrimaryVenueSummary | null;
    readonly logo: StoredFile | null;
}

/** Resumen que muestra el inicio (spec 003, data-model.md). */
export interface HomeSummary {
    readonly academyName: string;
    readonly initials: string;
    readonly logoUrl: string | null;
    readonly planName: string | null;
    readonly primaryVenue: PrimaryVenueSummary | null;
}

export interface RecommendedTask {
    readonly label: string;
    readonly route: string;
}

/**
 * Tareas de "Completa tu academia". Es una maqueta: no se calcula si están
 * completas ni el progreso, que llegan con HU-032 (spec 003, FR-018a).
 */
export const RECOMMENDED_TASKS: readonly RecommendedTask[] = [
    { label: 'Sube el logo de tu academia', route: '/settings/academy' },
    { label: 'Completa los datos de contacto', route: '/settings/academy' },
    { label: 'Revisa tus sedes', route: '/settings/venues' }
];
