import { IdentifyInput, PublicCallUp, ResponseInput, ResponseResult } from '../models/public-call-up.models';

/** Vía pública del enlace de una lista: funciona sin sesión (contracts/repositories.md). */
export abstract class PublicCallUpRepository {
    abstract load(token: string, deviceKeys: readonly string[]): Promise<PublicCallUp>;
    /** Devuelve la llave del dispositivo: la misma si ya era válida o una nueva. */
    abstract identify(token: string, input: IdentifyInput, deviceKey: string | null): Promise<string>;
    abstract respond(token: string, deviceKey: string, playerId: string, input: ResponseInput): Promise<ResponseResult>;
}
