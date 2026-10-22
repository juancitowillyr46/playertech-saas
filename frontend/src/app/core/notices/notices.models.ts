/** Aviso de respuestas nuevas de una convocatoria (spec 014, `call_up_new_responses`). */
export interface NewResponsesNotice {
    readonly callUpId: string;
    readonly activityId: string;
    readonly activityType: 'training' | 'competition';
    readonly opponent: string | null;
    readonly startsAt: string;
    readonly cancelled: boolean;
    readonly newCount: number;
}

/** Fila mínima de un pendiente para contarlo: un dispositivo cuenta una vez aunque acompañe a varios jugadores. */
export interface PendingKey {
    readonly linkId: string | null;
    readonly deviceId: string | null;
}

/** Pendientes distintos: por dispositivo cuando lo hay; si no, por vínculo. */
export function countPending(rows: readonly PendingKey[]): number {
    return new Set(rows.map((row) => row.deviceId ?? `link:${row.linkId}`)).size;
}

/** «3», o «99+» a partir de 100. */
export function badgeValue(count: number): string {
    return count > 99 ? '99+' : String(count);
}
