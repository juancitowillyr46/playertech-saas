import { StoredFile } from '../../../core/storage/models/storage.models';

export interface PrimaryVenueSummary {
    readonly name: string;
    readonly city: string | null;
    readonly address: string | null;
}

/** Datos de contacto de la academia que cuentan para «Completa tu academia». */
export interface AcademyContactSummary {
    readonly phone: string | null;
    readonly address: string | null;
}

/** Datos que el repositorio lee para el inicio (contracts/repositories.md). */
export interface HomeSummaryData {
    readonly planName: string | null;
    readonly primaryVenue: PrimaryVenueSummary | null;
    readonly logo: StoredFile | null;
    readonly contact: AcademyContactSummary;
}

export type HomeTaskKey = 'academy' | 'primaryVenue' | 'logo' | 'contact';

/** Tarea de «Completa tu academia» con su estado (HU-032; spec 007, data-model.md). */
export interface HomeTask {
    readonly key: HomeTaskKey;
    readonly label: string;
    readonly done: boolean;
    /** Pantalla donde se completa; `null` si no hay nada que hacer. */
    readonly route: string | null;
}

/** Resumen que muestra el inicio (spec 003 y spec 007). */
export interface HomeSummary {
    readonly academyName: string;
    readonly initials: string;
    readonly logoUrl: string | null;
    readonly planName: string | null;
    readonly primaryVenue: PrimaryVenueSummary | null;
    readonly tasks: readonly HomeTask[];
    readonly completedCount: number;
}

const filled = (value: string | null | undefined): boolean => !!value?.trim();

/**
 * Tareas de «Completa tu academia» (reglas de HU-032 del 2026-10-18). La dirección de la
 * academia (de contacto) y la de la sede principal son datos distintos.
 */
export function homeTasks(data: HomeSummaryData): readonly HomeTask[] {
    return [
        { key: 'academy', label: 'Academia creada', done: true, route: null },
        { key: 'primaryVenue', label: 'Dirección de la sede principal', done: filled(data.primaryVenue?.address), route: '/settings/venues' },
        { key: 'logo', label: 'Logo de la academia', done: data.logo !== null, route: '/settings/academy' },
        { key: 'contact', label: 'Teléfono y dirección de la academia', done: filled(data.contact.phone) && filled(data.contact.address), route: '/settings/academy' }
    ];
}
