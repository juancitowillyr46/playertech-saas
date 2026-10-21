/** Lo que el enlace de una lista permite ver (contracts/database.md, `public_call_up`). */

export type PublicCallUpStatus = 'open' | 'closed' | 'cancelled' | 'not_found';
export type Answer = 'yes' | 'maybe' | 'no';
export type GuardianRelationship = 'mother' | 'father' | 'grandparent' | 'other' | 'self';

export interface PublicPlace {
    readonly name: string;
    readonly address: string | null;
    readonly city: string | null;
    readonly directions: string | null;
}

export interface PublicActivity {
    readonly type: 'training' | 'competition';
    readonly startsAt: string;
    readonly endsAt: string | null;
    readonly callAt: string | null;
    readonly place: PublicPlace | null;
    readonly opponent: string | null;
    readonly tournament: string | null;
    readonly notes: string | null;
}

/** Convocado para elegir por quién responder: nombre, inicial del apellido y apodo. */
export interface RosterPlayer {
    readonly playerId: string;
    readonly name: string;
    readonly nickname: string | null;
}

/** Jugador del dispositivo reconocido, con su respuesta vigente. */
export interface MyPlayer extends RosterPlayer {
    readonly removed: boolean;
    readonly answer: Answer | null;
    readonly reason: string | null;
    readonly reasonText: string | null;
    readonly changesLeft: number;
}

export interface PublicCallUp {
    readonly status: PublicCallUpStatus;
    readonly academy: string;
    readonly activity: PublicActivity | null;
    readonly deadline: string | null;
    readonly roster: readonly RosterPlayer[];
    readonly mine: readonly MyPlayer[];
    /** La llave del navegador que reconoció el enlace, o nulo. */
    readonly deviceKey: string | null;
}

export interface IdentifyInput {
    readonly playerId: string;
    readonly fullName: string | null;
    readonly phone: string | null;
    readonly relationship: GuardianRelationship;
    readonly consent: boolean;
}

export interface ResponseInput {
    readonly answer: Answer;
    readonly reason: string | null;
    readonly reasonText: string | null;
}

export interface ResponseResult {
    readonly answer: Answer;
    readonly changesLeft: number;
}

/** «Samuel V. · Samu». */
export function rosterLabel(player: RosterPlayer): string {
    return player.nickname ? `${player.name} · ${player.nickname}` : player.name;
}

/** «Partido contra Club Norte» o «Entrenamiento», como en el mensaje de WhatsApp. */
export function publicActivityTitle(activity: PublicActivity): string {
    if (activity.type === 'training') {
        return 'Entrenamiento';
    }

    return activity.opponent ? `Partido contra ${activity.opponent}` : 'Partido';
}

/** Errores de negocio de la vía pública, con su texto para el acudiente. */
export type PublicCallUpErrorReason =
    | 'call_up_not_found'
    | 'call_up_closed'
    | 'player_not_in_list'
    | 'device_not_recognized'
    | 'change_limit_reached'
    | 'consent_required'
    | 'invalid_phone'
    | 'invalid_name'
    | 'reason_text_required'
    | 'invalid_answer';

const PUBLIC_ERROR_MESSAGES: Readonly<Record<PublicCallUpErrorReason, string>> = {
    call_up_not_found: 'Esta convocatoria ya no está disponible.',
    call_up_closed: 'La convocatoria ya cerró: no se reciben más respuestas.',
    player_not_in_list: 'Este jugador ya no está en la convocatoria. Escríbele a la academia.',
    device_not_recognized: 'No pudimos reconocerte. Vuelve a elegir por quién respondes.',
    change_limit_reached: 'Ya cambiaste esta respuesta 3 veces. Escríbele a la academia para cambiarla.',
    consent_required: 'Debes autorizar el tratamiento de tus datos para continuar.',
    invalid_phone: 'Escribe un celular de 10 dígitos que empiece por 3.',
    invalid_name: 'Escribe tu nombre.',
    reason_text_required: 'Cuéntanos el motivo (hasta 200 caracteres).',
    invalid_answer: 'Elige una respuesta y un motivo válidos.'
};

export class PublicCallUpError extends Error {
    constructor(readonly reason: PublicCallUpErrorReason) {
        super(PUBLIC_ERROR_MESSAGES[reason]);
        this.name = 'PublicCallUpError';
    }
}

export const PUBLIC_ERROR_REASONS = Object.keys(PUBLIC_ERROR_MESSAGES) as PublicCallUpErrorReason[];
