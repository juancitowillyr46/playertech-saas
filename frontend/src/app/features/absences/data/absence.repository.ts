import { Absence } from '../models/absence.models';

/** Ausencias de una actividad (spec 015, contracts/contracts.md). */
export abstract class AbsenceRepository {
    /** Vigentes y desmarcadas con aviso, con el nombre del jugador. */
    abstract list(activityId: string): Promise<readonly Absence[]>;
    abstract setAbsent(activityId: string, playerId: string, absent: boolean): Promise<void>;
    /** Registra «Avisado» y devuelve su hora (la del servidor). */
    abstract markNotified(activityId: string, playerId: string): Promise<string>;
}
