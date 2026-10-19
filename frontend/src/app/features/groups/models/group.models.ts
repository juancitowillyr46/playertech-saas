/** Grupos de jugadores (spec 009, HU-004; contracts/repositories.md). */

export interface GroupSummary {
    readonly id: string;
    readonly name: string;
    /** Integrantes activos y no eliminados. */
    readonly activePlayerCount: number;
}

export interface GroupMember {
    readonly playerId: string;
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
    readonly isActive: boolean;
}

export interface GroupDetail extends GroupSummary {
    readonly members: readonly GroupMember[];
}
