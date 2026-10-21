import { computed, inject, Injectable, signal } from '@angular/core';
import { Activity } from '../../activities/models/activity.models';
import { GuardianRepository } from '../../players/data/guardian.repository';
import { PlayerRepository } from '../../players/data/player.repository';
import { GroupRef, PlayerSummary, ReviewDecision } from '../../players/models/player.models';
import { CallUpRepository } from '../data/call-up.repository';
import { CallUp, CallUpListInput, CurrentResponse, OwnerResponseInput, ResponseEntry } from '../models/call-up.models';

/** Totales del seguimiento (HU-011, CA-001). */
export interface ResponseTotals {
    readonly total: number;
    readonly yes: number;
    readonly maybe: number;
    readonly no: number;
    readonly unanswered: number;
}

function totalsOf(responses: readonly CurrentResponse[]): ResponseTotals {
    return {
        total: responses.length,
        yes: responses.filter((response) => response.answer === 'yes').length,
        maybe: responses.filter((response) => response.answer === 'maybe').length,
        no: responses.filter((response) => response.answer === 'no').length,
        unanswered: responses.filter((response) => response.answer === null).length
    };
}

/** Cambios del drawer «Ajustar convocados» sobre una convocatoria abierta (HU-008, CA-002 y CA-003). */
export interface CallUpAdjustment {
    readonly removed: readonly string[];
    readonly moved: readonly { readonly playerId: string; readonly listId: string }[];
    readonly added: readonly { readonly listId: string; readonly playerIds: readonly string[] }[];
    /** `undefined`: sin cambio; `null`: quitar la fecha límite. */
    readonly deadline?: string | null;
}

/** Abierta: sin cierre manual y antes de la fecha límite o, sin ella, del inicio (DEC-34). */
export function callUpIsOpen(callUp: CallUp | null, activity: Pick<Activity, 'startsAt'> | null, now: Date = new Date()): boolean {
    return !!callUp && !!activity && !callUp.closedAt && now.getTime() < new Date(callUp.deadline ?? activity.startsAt).getTime();
}

/**
 * Convocatoria de una actividad (spec 012; HU-007 y HU-008). Las reglas (fecha límite,
 * cerrada inmutable, un jugador por convocatoria) las garantiza la base de datos.
 */
@Injectable()
export class CallUpService {
    private readonly repository = inject(CallUpRepository);
    private readonly players = inject(PlayerRepository);
    private readonly guardians = inject(GuardianRepository);

    readonly callUp = signal<CallUp | null>(null);
    /** Respuesta vigente de cada convocado activo (spec 013). */
    readonly responses = signal<readonly CurrentResponse[]>([]);
    readonly totals = computed(() => totalsOf(this.responses()));
    readonly activity = signal<Activity | null>(null);
    readonly busy = signal(false);
    readonly isOpen = computed(() => callUpIsOpen(this.callUp(), this.activity()));

    async load(activity: Activity): Promise<void> {
        this.activity.set(activity);
        const callUp = await this.repository.getByActivity(activity.id);

        this.responses.set(callUp ? await this.repository.responses(callUp.id) : []);
        this.callUp.set(callUp);
    }

    /** Totales de una lista («12/17»). */
    listTotals(listId: string): ResponseTotals {
        return totalsOf(this.responses().filter((response) => response.listId === listId));
    }

    responseOf(playerId: string): CurrentResponse | null {
        return this.responses().find((response) => response.playerId === playerId) ?? null;
    }

    history(playerId: string): Promise<readonly ResponseEntry[]> {
        return this.repository.history(this.callUp()!.id, playerId);
    }

    /** El owner registra la respuesta, también con la convocatoria cerrada (DEC-46). */
    respondAsOwner(playerId: string, input: OwnerResponseInput): Promise<void> {
        return this.run(() => this.repository.respondAsOwner(this.callUp()!.id, playerId, input));
    }

    /** Validar o rechazar a quien respondió (HU-040). */
    review(linkId: string | null, deviceId: string | null, decision: ReviewDecision): Promise<void> {
        return this.run(() => this.guardians.review(linkId, deviceId, decision));
    }

    /** Jugadores activos (con sus grupos) que se pueden convocar o sumar. */
    async candidates(): Promise<readonly PlayerSummary[]> {
        return (await this.players.listPlayers()).filter((player) => player.isActive);
    }

    groups(): Promise<readonly GroupRef[]> {
        return this.players.listGroups();
    }

    /** La fecha límite abierta quedaría en o después de un nuevo inicio (lo rechaza la base de datos). */
    deadlineConflicts(newStartsAt: string): boolean {
        const deadline = this.callUp()?.deadline;

        return this.isOpen() && !!deadline && new Date(deadline).getTime() >= new Date(newStartsAt).getTime();
    }

    create(deadline: string | null, lists: readonly CallUpListInput[]): Promise<void> {
        return this.run((activity) => this.repository.create(activity.id, deadline, lists));
    }

    adjust(changes: CallUpAdjustment): Promise<void> {
        return this.run(async () => {
            const callUp = this.callUp()!;

            for (const playerId of changes.removed) {
                await this.repository.removePlayer(callUp.id, playerId);
            }

            for (const move of changes.moved) {
                await this.repository.movePlayer(callUp.id, move.playerId, move.listId);
            }

            for (const group of changes.added) {
                await this.repository.addPlayers(callUp, group.listId, group.playerIds);
            }

            if (changes.deadline !== undefined) {
                await this.repository.setDeadline(callUp.id, changes.deadline);
            }
        });
    }

    close(): Promise<void> {
        return this.run(() => this.repository.close(this.callUp()!.id));
    }

    saveIntro(listId: string, intro: string | null): Promise<void> {
        return this.run(() => this.repository.saveIntro(listId, intro));
    }

    /** Recarga sin cambiar nada (por ejemplo, tras cancelar la actividad, que cierra la convocatoria). */
    async refresh(): Promise<void> {
        const activity = this.activity();

        if (activity) {
            await this.load(activity);
        }
    }

    /** Una operación a la vez; al terminar o fallar, se relee la convocatoria. */
    private async run(operation: (activity: Activity) => Promise<void>): Promise<void> {
        const activity = this.activity();

        if (this.busy() || !activity) {
            return;
        }

        this.busy.set(true);

        try {
            await operation(activity);
        } finally {
            try {
                await this.load(activity);
            } finally {
                this.busy.set(false);
            }
        }
    }
}
