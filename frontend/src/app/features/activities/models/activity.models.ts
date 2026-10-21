/** Actividades y canchas externas (spec 011, contracts/repositories.md). Instantes en ISO. */

export type ActivityType = 'training' | 'competition';
export type ActivityStatus = 'scheduled' | 'cancelled';
export type PlaceKind = 'venue' | 'field';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
    training: 'Entrenamiento',
    competition: 'Competencia'
};

export interface PlaceRef {
    readonly kind: PlaceKind;
    readonly id: string;
}

export interface Place extends PlaceRef {
    readonly name: string;
    readonly address: string | null;
    readonly city: string | null;
    readonly directions: string | null;
}

export interface ActivityInput {
    readonly type: ActivityType;
    readonly startsAt: string;
    readonly endsAt: string | null;
    readonly callAt: string | null;
    readonly place: PlaceRef;
    readonly notes: string | null;
    readonly opponent: string | null;
    readonly tournament: string | null;
}

export interface Activity extends Omit<ActivityInput, 'place'> {
    readonly id: string;
    readonly status: ActivityStatus;
    readonly place: Place;
    readonly seriesId: string | null;
    /** Tiene convocatoria (spec 012): sello «Convocada» en el listado. */
    readonly hasCallUp?: boolean;
}

export interface ExternalField {
    readonly id: string;
    readonly name: string;
    readonly address: string | null;
    readonly city: string | null;
    readonly directions: string | null;
}

export type ExternalFieldInput = Omit<ExternalField, 'id'>;

/** Ya empezó: desde entonces no se modifica (DEC-44, CA-006 de HU-036). */
export function isPast(activity: Pick<Activity, 'startsAt'>, now: Date = new Date()): boolean {
    return new Date(activity.startsAt).getTime() <= now.getTime();
}

/** «Competencia vs. Club Norte» o «Entrenamiento». */
export function activityTitle(activity: Pick<Activity, 'type' | 'opponent'>): string {
    return activity.type === 'competition' && activity.opponent ? `${ACTIVITY_TYPE_LABELS.competition} vs. ${activity.opponent}` : ACTIVITY_TYPE_LABELS[activity.type];
}
