import { GroupRef, PlayerInput, PlayerSummary } from '../models/player.models';

/** El jugador se guardó, pero la sincronización de sus grupos falló (aceptado en el MVP, research M2). */
export class GroupsNotSavedError extends Error {
    constructor(
        readonly playerId: string,
        options?: ErrorOptions
    ) {
        super('El jugador se guardó, pero no sus grupos.', options);
    }
}

/**
 * Jugadores de la academia actual (spec 009, contracts/repositories.md). RLS limita todo
 * a la academia del miembro y solo el owner escribe. Toda operación rechaza con `AppError`,
 * salvo `GroupsNotSavedError`.
 */
export abstract class PlayerRepository {
    /** Jugadores no eliminados, con sus grupos y el número de acudientes validados. */
    abstract listPlayers(): Promise<readonly PlayerSummary[]>;

    abstract getPlayer(id: string): Promise<PlayerSummary>;

    /** Grupos no eliminados, para elegir y filtrar. */
    abstract listGroups(): Promise<readonly GroupRef[]>;

    /** Id del jugador no eliminado con la misma identidad (DEC-42), o null. */
    abstract findByIdentity(firstNames: string, lastNames: string, birthDate: string): Promise<string | null>;

    /** Crea el jugador y sus integraciones a grupos; devuelve su id. */
    abstract createPlayer(input: PlayerInput): Promise<string>;

    /** Actualiza el jugador y sincroniza sus grupos. */
    abstract updatePlayer(id: string, input: PlayerInput): Promise<void>;

    abstract setActive(id: string, active: boolean): Promise<void>;

    /** Borrado lógico. */
    abstract deletePlayer(id: string): Promise<void>;
}
