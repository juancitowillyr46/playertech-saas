import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { randomUuid } from '../../../core/storage/data/random-uuid';
import { dayKey, dayLabel, toInstant, weeklyDates } from '../../../shared/text/colombia-time';
import { todayInColombia } from '../../../shared/text/search-text';
import { CallUpRepository } from '../../call-ups/data/call-up.repository';
import { VenueRepository } from '../../venues/data/venue.repository';
import { ActivityRepository } from '../data/activity.repository';
import { ExternalFieldRepository } from '../data/external-field.repository';
import { Activity, ActivityInput, ActivityStatus, ActivityType, PlaceRef } from '../models/activity.models';

export type ActivitiesStatus = 'loading' | 'ready' | 'empty' | 'error';
export type ActivitiesWhen = 'upcoming' | 'past';

/** Lo que escribe el owner en el formulario (fecha y horas de Colombia). */
export interface ActivityDraft {
    readonly type: ActivityType;
    readonly date: string;
    readonly start: string;
    readonly end: string | null;
    readonly call: string | null;
    readonly place: PlaceRef;
    readonly notes: string | null;
    readonly opponent: string | null;
    readonly tournament: string | null;
    /** Repetición semanal al crear (0 = domingo); null si no se repite. */
    readonly repeat: { readonly weekdays: readonly number[]; readonly until: string } | null;
}

export interface PlaceOption {
    readonly label: string;
    readonly value: PlaceRef;
}

export interface PlaceGroups {
    readonly venues: readonly PlaceOption[];
    readonly fields: readonly PlaceOption[];
}

export interface ActivityDay {
    readonly key: string;
    readonly label: string;
    readonly activities: readonly Activity[];
}

function clean(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed === '' ? null : trimmed;
}

/** Borrador → datos de una actividad en la fecha indicada. */
export function toActivityInput(draft: ActivityDraft, date: string = draft.date): ActivityInput {
    const competition = draft.type === 'competition';

    return {
        type: draft.type,
        startsAt: toInstant(date, draft.start),
        endsAt: draft.end ? toInstant(date, draft.end) : null,
        callAt: draft.call ? toInstant(date, draft.call) : null,
        place: draft.place,
        notes: clean(draft.notes),
        opponent: competition ? clean(draft.opponent) : null,
        tournament: competition ? clean(draft.tournament) : null
    };
}

/** Fechas que generaría el borrador: la suya o las de la repetición semanal. */
export function draftDates(draft: Pick<ActivityDraft, 'date' | 'repeat'>): string[] {
    return draft.repeat ? weeklyDates(draft.date, draft.repeat.until, draft.repeat.weekdays) : [draft.date];
}

/**
 * Actividades de la academia (spec 011; HU-005, HU-006 y HU-036). Listado de próximas o
 * pasadas, filtro por tipo y agrupación por día en el cliente; tras cada operación se
 * relee sin pasar a carga, como en Sedes.
 */
@Injectable()
export class ActivitiesService {
    private readonly repository = inject(ActivityRepository);
    private readonly fields = inject(ExternalFieldRepository);
    private readonly venues = inject(VenueRepository);
    private readonly callUps = inject(CallUpRepository);

    /** Confirmados (solo Sí) sobre convocados por actividad convocada, para «12/17» (spec 013, FR-014). */
    readonly confirmations = signal<ReadonlyMap<string, { readonly yes: number; readonly total: number }>>(new Map());

    readonly activities = signal<readonly Activity[]>([]);
    readonly status = signal<ActivitiesStatus>('loading');
    readonly when = signal<ActivitiesWhen>('upcoming');
    /** Tipo, o 'all'. */
    readonly typeFilter = signal<ActivityType | 'all'>('all');
    readonly busy = signal(false);

    readonly days = computed<readonly ActivityDay[]>(() => {
        const type = this.typeFilter();
        const today = todayInColombia();
        const groups = new Map<string, Activity[]>();

        for (const activity of this.activities()) {
            if (type === 'all' || activity.type === type) {
                const key = dayKey(activity.startsAt);
                groups.set(key, [...(groups.get(key) ?? []), activity]);
            }
        }

        return [...groups].map(([key, activities]) => ({ key, label: dayLabel(key, today), activities }));
    });

    async load(when: ActivitiesWhen = this.when()): Promise<void> {
        this.when.set(when);
        this.status.set('loading');

        try {
            const activities = await this.repository.list(when);

            this.apply(activities);
            void this.loadConfirmations(activities);
        } catch {
            this.status.set('error');
        }
    }

    /** Si los totales no llegan, la lista muestra «Convocada» como antes. */
    private async loadConfirmations(activities: readonly Activity[]): Promise<void> {
        const ids = activities.filter((activity) => activity.hasCallUp).map((activity) => activity.id);

        try {
            const confirmations = new Map<string, { yes: number; total: number }>();

            for (const summary of await this.callUps.summaries(ids)) {
                const current = confirmations.get(summary.activityId) ?? { yes: 0, total: 0 };

                confirmations.set(summary.activityId, { yes: current.yes + summary.yes, total: current.total + summary.total });
            }

            this.confirmations.set(confirmations);
        } catch {
            this.confirmations.set(new Map());
        }
    }

    get(id: string): Promise<Activity> {
        return this.repository.get(id);
    }

    /** Sedes activas y canchas no retiradas, para el campo Lugar. */
    async placeOptions(): Promise<PlaceGroups> {
        const [venues, fields] = await Promise.all([this.venues.listVenues(), this.fields.list()]);

        return {
            venues: venues.filter((venue) => venue.isActive).map((venue) => ({ label: venue.name, value: { kind: 'venue', id: venue.id } })),
            fields: fields.map((field) => ({ label: field.city ? `${field.name} · ${field.city}` : field.name, value: { kind: 'field', id: field.id } }))
        };
    }

    /** Crea la actividad o su serie semanal en una sola operación; devuelve cuántas creó. */
    async create(draft: ActivityDraft): Promise<number> {
        const dates = draftDates(draft);
        let created = 0;

        await this.run(async () => {
            created = await this.repository.create(
                dates.map((date) => toActivityInput(draft, date)),
                draft.repeat ? randomUuid() : null
            );
        });

        return created;
    }

    update(id: string, draft: ActivityDraft): Promise<void> {
        return this.run(() => this.repository.update(id, toActivityInput(draft)));
    }

    setStatus(id: string, status: ActivityStatus): Promise<void> {
        return this.run(() => this.repository.setStatus(id, status));
    }

    remove(id: string): Promise<void> {
        return this.run(() => this.repository.delete(id));
    }

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

    private async refresh(): Promise<void> {
        try {
            this.apply(await this.repository.list(this.when()));
        } catch {
            // El listado visible sigue siendo válido; el próximo cambio lo actualizará.
        }
    }

    private apply(activities: readonly Activity[]): void {
        this.activities.set(activities);
        this.status.set(activities.length > 0 ? 'ready' : 'empty');
    }
}
