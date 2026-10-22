import { Guardian, GuardianAssignment, GuardianInput, GuardianOption, PendingGuardian, Relationship, ReviewDecision, AcademyPendingGuardian } from '../models/player.models';

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

    /** Acudientes no eliminados de la academia, con los jugadores que acompañan (DEC-43). */
    abstract listGuardians(): Promise<readonly GuardianOption[]>;

    /** Asigna acudientes ya registrados, validados y sin duplicar; devuelve cuántos asignó. */
    abstract assign(playerId: string, assignments: readonly GuardianAssignment[]): Promise<number>;

    /** Vínculos y dispositivos pendientes de validar del jugador (spec 013, HU-040). */
    abstract pending(playerId: string): Promise<readonly PendingGuardian[]>;

    /** Todos los pendientes de la academia actual, con su jugador (spec 014, drawer «Por validar»). */
    abstract pendingByAcademy(): Promise<readonly AcademyPendingGuardian[]>;

    /** Validar o rechazar; única vía de revisión, la usan la ficha y el seguimiento (principio IV). */
    abstract review(linkId: string | null, deviceId: string | null, decision: ReviewDecision): Promise<void>;
}
