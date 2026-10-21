import { CallUp, CallUpListInput } from '../models/call-up.models';
export abstract class CallUpRepository {
    abstract getByActivity(activityId: string): Promise<CallUp | null>;
    abstract create(activityId: string, deadline: string | null, lists: readonly CallUpListInput[]): Promise<void>;
    abstract addPlayers(callUp: CallUp, listId: string, playerIds: readonly string[]): Promise<void>;
    abstract removePlayer(callUpId: string, playerId: string): Promise<void>;
    abstract movePlayer(callUpId: string, playerId: string, listId: string): Promise<void>;
    abstract setDeadline(callUpId: string, deadline: string | null): Promise<void>;
    abstract close(callUpId: string): Promise<void>;
    abstract saveIntro(listId: string, intro: string | null): Promise<void>;
}
