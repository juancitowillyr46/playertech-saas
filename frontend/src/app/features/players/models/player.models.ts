/** Jugadores y acudientes (spec 009, contracts/repositories.md). Fechas en `yyyy-mm-dd`. */

export interface GroupRef {
    readonly id: string;
    readonly name: string;
}

export interface PlayerInput {
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
    readonly birthDate: string;
    readonly phone: string | null;
    readonly groupIds: readonly string[];
}

export interface PlayerSummary {
    readonly id: string;
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
    readonly birthDate: string;
    readonly phone: string | null;
    readonly isActive: boolean;
    readonly groups: readonly GroupRef[];
    readonly guardianCount: number;
}

export type Relationship = 'mother' | 'father' | 'grandparent' | 'other';

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
    mother: 'Mamá',
    father: 'Papá',
    grandparent: 'Abuelo o abuela',
    other: 'Otro'
};

/** Parentesco de un vínculo: los del owner o `self`, cuando el jugador adulto se identifica desde el enlace (DEC-30). */
export type LinkRelationship = Relationship | 'self';

/** «Mamá», «Papá»… o «El jugador». Para mostrar; los formularios del owner usan `RELATIONSHIP_LABELS`. */
export function relationshipLabel(relationship: LinkRelationship): string {
    return relationship === 'self' ? 'El jugador' : RELATIONSHIP_LABELS[relationship];
}

export interface Guardian {
    readonly linkId: string;
    readonly guardianId: string;
    readonly fullName: string;
    readonly phone: string;
    readonly relationship: LinkRelationship;
    /** Otros jugadores activos que acompaña («También de…»), como «Tomás V.». */
    readonly otherPlayers: readonly string[];
}

/** Acudiente de la academia con los jugadores activos que acompaña (spec 010, DEC-43). */
export interface GuardianOption {
    readonly guardianId: string;
    readonly fullName: string;
    readonly phone: string;
    readonly players: readonly { readonly playerId: string; readonly name: string; readonly relationship: LinkRelationship }[];
}

/**
 * Acudiente por validar desde el enlace (spec 013, HU-040): un vínculo pendiente (con su
 * dispositivo, si lo hay) o un dispositivo nuevo de un acudiente ya validado.
 */
export interface PendingGuardian {
    readonly linkId: string | null;
    readonly deviceId: string | null;
    readonly guardianName: string;
    readonly declaredName: string | null;
    readonly relationship: LinkRelationship;
    readonly phone: string;
    readonly at: string;
    /** El celular ya era de un acudiente registrado antes de este dispositivo. */
    readonly phoneMatch: boolean;
}

export type ReviewDecision = 'validate' | 'reject';

export interface GuardianAssignment {
    readonly guardianId: string;
    readonly relationship: Relationship;
}

/** «Papá de Samuel V. · Mamá de Mateo R.» */
export function accompaniesLabel(option: GuardianOption): string {
    return option.players.map((player) => `${relationshipLabel(player.relationship)} de ${player.name}`).join(' · ');
}

export interface GuardianInput {
    readonly fullName: string;
    readonly phone: string;
    readonly relationship: Relationship;
}

/**
 * «Santiago Duque Restrepo · Santi»: nombre completo con el apodo, para las pantallas del
 * owner. El nombre corto queda para lo que sale de PlayerTech (mensajes y enlace).
 */
export function fullNameWithNickname(player: { firstNames: string; lastNames: string; nickname: string | null }): string {
    const fullName = `${player.firstNames} ${player.lastNames}`;

    return player.nickname ? `${fullName} · ${player.nickname}` : fullName;
}

/** «Samuel V.»: nombre y la inicial del primer apellido. */
export function shortName(player: { firstNames: string; lastNames: string }): string {
    const initial = player.lastNames.trim().charAt(0);

    return initial ? `${player.firstNames} ${initial.toLocaleUpperCase('es-CO')}.` : player.firstNames;
}
