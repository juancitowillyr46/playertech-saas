import { Guardian, GuardianInput, Relationship } from '../models/player.models';

export interface AddGuardianResult {
    readonly guardianExisted: boolean;
    readonly guardianName: string;
}

/**
 * Acudientes de los jugadores (spec 009, HU-034). El vínculo creado por el owner nace
 * validado y con la autorización de datos registrada en el servidor (DEC-39, DEC-40).
 */
export abstract class GuardianRepository {
    /** Acudientes validados y no retirados del jugador. */
    abstract listByPlayer(playerId: string): Promise<readonly Guardian[]>;

    /** Acudiente no eliminado con ese celular, para avisar antes de guardar (FR-011). */
    abstract findByPhone(phone: string): Promise<{ guardianId: string; fullName: string } | null>;

    /** Vincula al acudiente; reutiliza la persona si el celular ya existe. */
    abstract addToPlayer(playerId: string, input: GuardianInput): Promise<AddGuardianResult>;

    abstract updateGuardian(guardianId: string, input: { fullName: string; phone: string }): Promise<void>;

    abstract updateRelationship(linkId: string, relationship: Relationship): Promise<void>;

    /** Retira el acudiente del jugador (borrado lógico del vínculo). */
    abstract removeFromPlayer(linkId: string): Promise<void>;
}
