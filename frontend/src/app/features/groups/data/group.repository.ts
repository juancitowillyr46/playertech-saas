import { GroupDetail, GroupMember, GroupSummary } from '../models/group.models';

/**
 * Grupos de la academia actual (spec 009, HU-004). RLS limita todo a la academia del
 * miembro y solo el owner escribe. Toda operación rechaza con `AppError`.
 */
export abstract class GroupRepository {
    abstract listGroups(): Promise<readonly GroupSummary[]>;

    /** El grupo con sus integrantes no eliminados (activos e inactivos). */
    abstract getGroup(id: string): Promise<GroupDetail>;

    /** Jugadores activos que se pueden agregar a un grupo. */
    abstract listActivePlayers(): Promise<readonly GroupMember[]>;

    abstract createGroup(name: string): Promise<void>;

    abstract renameGroup(id: string, name: string): Promise<void>;

    /** Borrado lógico; la base de datos quita sus integrantes en la misma operación. */
    abstract deleteGroup(id: string): Promise<void>;

    abstract addMembers(groupId: string, playerIds: readonly string[]): Promise<void>;

    abstract removeMember(groupId: string, playerId: string): Promise<void>;
}
