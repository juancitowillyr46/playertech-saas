import { CallUp, CallUpListInput, CallUpSummary, CurrentResponse, OwnerResponseInput, ResponseEntry } from '../models/call-up.models';
export abstract class CallUpRepository {
    abstract getByActivity(activityId: string): Promise<CallUp | null>;
    abstract create(activityId: string, deadline: string | null, lists: readonly CallUpListInput[]): Promise<void>;
    abstract addPlayers(callUp: CallUp, listId: string, playerIds: readonly string[]): Promise<void>;
    abstract removePlayer(callUpId: string, playerId: string): Promise<void>;
    abstract movePlayer(callUpId: string, playerId: string, listId: string): Promise<void>;
    abstract setDeadline(callUpId: string, deadline: string | null): Promise<void>;
    abstract close(callUpId: string): Promise<void>;
    abstract saveIntro(listId: string, intro: string | null): Promise<void>;
    /** Respuesta vigente de cada convocado activo (HU-011). */
    abstract responses(callUpId: string): Promise<readonly CurrentResponse[]>;
    /** Totales por lista de las convocatorias de esas actividades («12/17»). */
    abstract summaries(activityIds: readonly string[]): Promise<readonly CallUpSummary[]>;
    abstract history(callUpId: string, playerId: string): Promise<readonly ResponseEntry[]>;
    /** El owner registra o cambia la respuesta; no consume los cambios del acudiente (DEC-46). */
    /** Las respuestas quedan vistas para el usuario actual (spec 014, CA-003 de HU-041). */
    abstract markSeen(callUpId: string): Promise<void>;
    abstract respondAsOwner(callUpId: string, playerId: string, input: OwnerResponseInput): Promise<void>;
}
