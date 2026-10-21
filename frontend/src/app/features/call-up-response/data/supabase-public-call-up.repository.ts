import { inject, Injectable } from '@angular/core';
import { mapSupabaseError } from '../../../core/errors/supabase-error.mapper';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase-client';
import { IdentifyInput, MyPlayer, PUBLIC_ERROR_REASONS, PublicActivity, PublicCallUp, PublicCallUpError, PublicCallUpStatus, ResponseInput, ResponseResult, RosterPlayer } from '../models/public-call-up.models';
import { PublicCallUpRepository } from './public-call-up.repository';

/** Respuesta de `public_call_up` tal como la devuelve la base de datos. */
interface PublicCallUpRow {
    status: PublicCallUpStatus;
    academy?: string;
    activity?: PublicActivity;
    deadline?: string | null;
    roster?: RosterPlayer[];
    mine?: MyPlayer[];
    deviceKey?: string | null;
}

interface ResponseRow {
    answer: ResponseResult['answer'];
    changesLeft: number;
}

@Injectable()
export class SupabasePublicCallUpRepository extends PublicCallUpRepository {
    private readonly client = inject(SUPABASE_CLIENT);

    async load(token: string, deviceKeys: readonly string[]): Promise<PublicCallUp> {
        const { data, error } = await this.client.rpc('public_call_up', { p_token: token, p_device_keys: [...deviceKeys] });

        if (error) {
            throw mapSupabaseError(error);
        }

        const row = data as unknown as PublicCallUpRow;

        return {
            status: row.status,
            academy: row.academy ?? '',
            activity: row.activity ?? null,
            deadline: row.deadline ?? null,
            roster: row.roster ?? [],
            mine: row.mine ?? [],
            deviceKey: row.deviceKey ?? null
        };
    }

    async identify(token: string, input: IdentifyInput, deviceKey: string | null): Promise<string> {
        const { data, error } = await this.client.rpc('public_identify', {
            p_token: token,
            p_player_id: input.playerId,
            p_full_name: input.fullName ?? '',
            p_phone: input.phone ?? '',
            p_relationship: input.relationship,
            p_consent: input.consent,
            p_device_key: deviceKey ?? ''
        });

        if (error) {
            throw toError(error);
        }

        return data;
    }

    async respond(token: string, deviceKey: string, playerId: string, input: ResponseInput): Promise<ResponseResult> {
        const { data, error } = await this.client.rpc('public_respond', {
            p_token: token,
            p_device_key: deviceKey,
            p_player_id: playerId,
            p_answer: input.answer,
            p_reason: input.reason ?? '',
            p_reason_text: input.reasonText ?? ''
        });

        if (error) {
            throw toError(error);
        }

        const row = data as unknown as ResponseRow;

        return { answer: row.answer, changesLeft: row.changesLeft };
    }
}

/** Las reglas de la vía pública llegan como mensaje en clave; el resto, como error de aplicación. */
function toError(error: { message?: string }): Error {
    const reason = PUBLIC_ERROR_REASONS.find((key) => key === error.message);

    return reason ? new PublicCallUpError(reason) : mapSupabaseError(error);
}
