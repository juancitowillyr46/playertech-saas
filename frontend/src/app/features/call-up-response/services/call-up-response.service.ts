import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { DeviceKeyStore } from '../data/device-key-store';
import { PublicCallUpRepository } from '../data/public-call-up.repository';
import { IdentifyInput, MyPlayer, PublicCallUp, PublicCallUpError, ResponseInput, RosterPlayer } from '../models/public-call-up.models';

export type ResponsePageState = 'loading' | 'choose' | 'identify' | 'respond' | 'readonly' | 'not_found' | 'error';

/**
 * Flujo del acudiente en la página del enlace (HU-009 y HU-010). El estado sale de lo que
 * devuelve el enlace y de si el dispositivo es reconocido: abierta y sin jugadores propios,
 * elegir; con jugadores, responder; cerrada o cancelada, solo lectura.
 */
@Injectable()
export class CallUpResponseService {
    private readonly repository = inject(PublicCallUpRepository);
    private readonly devices = inject(DeviceKeyStore);

    private token = '';
    readonly callUp = signal<PublicCallUp | null>(null);
    readonly state = signal<ResponsePageState>('loading');
    readonly selectedPlayer = signal<RosterPlayer | null>(null);
    readonly busy = signal(false);
    /** La llave con la que se reconoció el dispositivo en esta academia. */
    private readonly deviceKey = signal<string | null>(null);

    /** Jugadores propios que siguen convocados (los quitados se muestran aparte). */
    readonly myActive = computed(() => (this.callUp()?.mine ?? []).filter((player) => !player.removed));
    readonly myRemoved = computed(() => (this.callUp()?.mine ?? []).filter((player) => player.removed));
    /** El dispositivo tiene jugadores en esta lista. */
    readonly hasPlayers = computed(() => (this.callUp()?.mine.length ?? 0) > 0);
    /**
     * El enlace reconoció el dispositivo (la persona ya se identificó en esta academia), aunque
     * en esta lista no tenga jugadores: para sumar uno solo se pide el parentesco (DEC-40).
     */
    readonly knownDevice = computed(() => !!this.callUp()?.deviceKey);

    async load(token: string): Promise<void> {
        this.token = token;
        this.state.set('loading');

        try {
            await this.read();
        } catch {
            this.state.set('error');
        }
    }

    choose(player: RosterPlayer): void {
        this.selectedPlayer.set(player);
        this.state.set('identify');
    }

    /** «¿Respondes por alguien más?»: vuelve a la lista con la misma llave. */
    addSomeone(): void {
        this.selectedPlayer.set(null);
        this.state.set('choose');
    }

    backToChoose(): void {
        this.selectedPlayer.set(null);
        this.state.set(this.hasPlayers() ? 'respond' : 'choose');
    }

    /** Se identifica (o suma un jugador), guarda la llave y recarga. Lanza el error para mostrarlo en el formulario. */
    async identify(input: IdentifyInput): Promise<void> {
        await this.run(async () => {
            const key = await this.repository.identify(this.token, input, this.deviceKey());

            this.devices.remember(key);
            this.selectedPlayer.set(null);
            await this.read();
        });
    }

    /** Registra la respuesta y actualiza solo ese jugador, sin recargar la página. */
    async respond(playerId: string, input: ResponseInput): Promise<MyPlayer> {
        const key = this.deviceKey();

        if (!key) {
            throw new PublicCallUpError('device_not_recognized');
        }

        return this.run(async () => {
            const result = await this.repository.respond(this.token, key, playerId, input);
            const callUp = this.callUp();
            let updated: MyPlayer | null = null;

            if (callUp) {
                const mine = callUp.mine.map((player) => {
                    if (player.playerId !== playerId) {
                        return player;
                    }

                    updated = { ...player, answer: result.answer, reason: input.reason, reasonText: input.reasonText, changesLeft: result.changesLeft };

                    return updated;
                });

                this.callUp.set({ ...callUp, mine });
            }

            if (!updated) {
                throw new AppError('unknown');
            }

            return updated;
        });
    }

    private async read(): Promise<void> {
        const callUp = await this.repository.load(this.token, this.devices.keys());

        this.callUp.set(callUp);
        this.deviceKey.set(callUp.deviceKey);
        this.state.set(stateOf(callUp));
    }

    private async run<T>(operation: () => Promise<T>): Promise<T> {
        this.busy.set(true);

        try {
            return await operation();
        } catch (error) {
            if (error instanceof PublicCallUpError && (error.reason === 'call_up_closed' || error.reason === 'call_up_not_found' || error.reason === 'device_not_recognized')) {
                await this.read().catch(() => this.state.set('error'));
            }

            throw error instanceof PublicCallUpError || error instanceof AppError ? error : new Error(ERROR_MESSAGES.unknown);
        } finally {
            this.busy.set(false);
        }
    }
}

function stateOf(callUp: PublicCallUp): ResponsePageState {
    if (callUp.status === 'not_found') {
        return 'not_found';
    }

    if (callUp.status !== 'open') {
        return 'readonly';
    }

    return callUp.mine.length > 0 ? 'respond' : 'choose';
}
