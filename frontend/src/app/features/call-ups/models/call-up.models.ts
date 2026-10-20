import { Relationship } from '../../players/models/player.models';

export interface CallUpGuardian {
    readonly fullName: string;
    readonly phone: string;
    readonly relationship: Relationship;
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
