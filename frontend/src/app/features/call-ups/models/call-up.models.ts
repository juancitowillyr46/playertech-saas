import { LinkRelationship } from '../../players/models/player.models';

/** Largo máximo de tu texto en el mensaje y en los avisos (FR-005). */
export const INTRO_MAX = 500;

export interface CallUpGuardian {
    readonly fullName: string;
    readonly phone: string;
    readonly relationship: LinkRelationship;
}
export interface CallUpPlayer {
    readonly playerId: string;
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
    readonly phone: string | null;
    readonly guardians: readonly CallUpGuardian[];
}
export interface CallUpList {
    readonly id: string;
    readonly groupId: string | null;
    readonly groupName: string | null;
    readonly token: string;
    readonly intro: string | null;
    readonly players: readonly CallUpPlayer[];
}
export interface CallUp {
    readonly id: string;
    readonly activityId: string;
    readonly deadline: string | null;
    readonly closedAt: string | null;
    readonly lists: readonly CallUpList[];
}
export interface CallUpListInput {
    readonly groupId: string | null;
    readonly playerIds: readonly string[];
}

/** Respuesta del convocado (DEC-38): Sí, Sí provisional o No. */
export type ResponseAnswer = 'yes' | 'maybe' | 'no';

/** Respuesta vigente de un convocado en el seguimiento (`call_up_current_responses`, HU-011). */
export interface CurrentResponse {
    readonly listId: string;
    readonly playerId: string;
    readonly answer: ResponseAnswer | null;
    readonly reason: string | null;
    readonly reasonText: string | null;
    readonly source: 'guardian' | 'owner' | null;
    readonly at: string | null;
    readonly guardianName: string | null;
    readonly relationship: LinkRelationship | null;
    readonly linkId: string | null;
    readonly linkStatus: 'pending' | 'validated' | 'rejected' | null;
    readonly deviceId: string | null;
    readonly deviceStatus: 'pending' | 'trusted' | 'revoked' | null;
    readonly declaredName: string | null;
    /** Vínculo o dispositivo pendiente de validar (HU-040). */
    readonly unvalidated: boolean;
    /** El celular ya era de un acudiente registrado antes de este dispositivo. */
    readonly phoneMatch: boolean;
}

/** Una respuesta del historial de un jugador, de la más reciente a la más antigua. */
export interface ResponseEntry {
    readonly id: string;
    readonly answer: ResponseAnswer;
    readonly reason: string | null;
    readonly reasonText: string | null;
    readonly source: 'guardian' | 'owner';
    readonly at: string;
    readonly guardianName: string | null;
    readonly relationship: LinkRelationship | null;
    readonly declaredName: string | null;
    /** Las de un vínculo rechazado o un dispositivo revocado dejan de contar. */
    readonly counts: boolean;
}

/** Totales de una lista (`call_up_summaries`). */
export interface CallUpSummary {
    readonly activityId: string;
    readonly callUpId: string;
    readonly listId: string;
    readonly total: number;
    readonly yes: number;
    readonly maybe: number;
    readonly no: number;
    readonly unanswered: number;
}

export interface OwnerResponseInput {
    readonly answer: ResponseAnswer;
    readonly reason: string | null;
    readonly reasonText: string | null;
}
