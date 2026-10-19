import { Activity, ActivityInput, ActivityStatus } from '../models/activity.models';

/**
 * Actividades de la academia actual (spec 011, contracts/repositories.md). RLS limita todo
 * a la academia del miembro y solo el owner escribe; las reglas de tiempo y lugar las
 * garantiza la base de datos. Toda operación rechaza con `AppError`.
 */
export abstract class ActivityRepository {
    /** No eliminadas, con su lugar: las próximas de la más cercana a la más lejana; las pasadas al revés. */
    abstract list(when: 'upcoming' | 'past'): Promise<readonly Activity[]>;

    abstract get(id: string): Promise<Activity>;

    /** Crea una o varias (una repetición) en una sola operación; devuelve cuántas creó. */
    abstract create(inputs: readonly ActivityInput[], seriesId: string | null): Promise<number>;

    abstract update(id: string, input: ActivityInput): Promise<void>;

    abstract setStatus(id: string, status: ActivityStatus): Promise<void>;

    /** Borrado lógico; también para las pasadas. */
    abstract delete(id: string): Promise<void>;
}
