import { inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { LegalDocumentsRepository } from '../../../core/legal/data/legal-documents.repository';
import { normalizePhone } from '../../../shared/forms/phone.validator';
import { AddGuardianResult, GuardianRepository } from '../data/guardian.repository';
import { GroupsNotSavedError, PlayerRepository } from '../data/player.repository';
import { GroupRef, Guardian, GuardianAssignment, GuardianInput, GuardianOption, PlayerInput, PlayerSummary, Relationship } from '../models/player.models';
import { cleanPlayerInput } from './players.service';

export type PlayerDetailStatus = 'loading' | 'ready' | 'not_found' | 'error';

/** Opción del selector: indica si ya es acudiente de este jugador (CA-004 de HU-035). */
export interface GuardianChoice extends GuardianOption {
    readonly alreadyLinked: boolean;
    /** Parentesco con este jugador, si ya es su acudiente. */
    readonly linkedAs: Relationship | null;
}

/**
 * Ficha de un jugador con sus acudientes (spec 009; HU-033 y HU-034). Cada operación
 * relee la ficha; si el jugador ya no existe, la ficha pasa a `not_found`.
 */
@Injectable()
export class PlayerDetailService {
    private readonly players = inject(PlayerRepository);
    private readonly guardianRepository = inject(GuardianRepository);
    private readonly legalDocuments = inject(LegalDocumentsRepository);

    readonly player = signal<PlayerSummary | null>(null);
    readonly guardians = signal<readonly Guardian[]>([]);
    readonly groups = signal<readonly GroupRef[]>([]);
    readonly status = signal<PlayerDetailStatus>('loading');
    readonly busy = signal(false);

    private playerId = '';

    async load(id: string): Promise<void> {
        this.playerId = id;
        this.status.set('loading');

        try {
            const [player, guardians, groups] = await Promise.all([this.players.getPlayer(id), this.guardianRepository.listByPlayer(id), this.players.listGroups()]);
            this.player.set(player);
            this.guardians.set(guardians);
            this.groups.set(groups);
            this.status.set('ready');
        } catch (error) {
            this.status.set(error instanceof AppError && error.code === 'not_found' ? 'not_found' : 'error');
        }
    }

    update(input: PlayerInput): Promise<void> {
        return this.run(() => this.players.updatePlayer(this.playerId, cleanPlayerInput(input)));
    }

    setActive(active: boolean): Promise<void> {
        return this.run(() => this.players.setActive(this.playerId, active));
    }

    /** Borrado lógico; la página vuelve al listado. */
    async remove(): Promise<void> {
        await this.run(() => this.players.deletePlayer(this.playerId), false);
    }

    /** Aviso anticipado de celular ya registrado (CA-003 de HU-034). */
    findGuardianByPhone(phone: string): Promise<{ guardianId: string; fullName: string } | null> {
        return this.guardianRepository.findByPhone(normalizePhone(phone));
    }

    /** Enlace a la Política de Tratamiento de Datos vigente, para la autorización (DEC-39). */
    async privacyPolicyUrl(): Promise<string | null> {
        try {
            return (await this.legalDocuments.getCurrent()).privacyPolicy.url;
        } catch {
            return null;
        }
    }

    async addGuardian(input: GuardianInput): Promise<AddGuardianResult> {
        let result: AddGuardianResult = { guardianExisted: false, guardianName: input.fullName };

        await this.run(async () => {
            result = await this.guardianRepository.addToPlayer(this.playerId, { ...input, fullName: input.fullName.trim(), phone: normalizePhone(input.phone) });
        });

        return result;
    }

    updateGuardian(guardian: Guardian, input: GuardianInput): Promise<void> {
        return this.run(async () => {
            const fullName = input.fullName.trim();
            const phone = normalizePhone(input.phone);

            if (fullName !== guardian.fullName || phone !== guardian.phone) {
                await this.guardianRepository.updateGuardian(guardian.guardianId, { fullName, phone });
            }

            if (input.relationship !== guardian.relationship) {
                await this.guardianRepository.updateRelationship(guardian.linkId, input.relationship as Relationship);
            }
        });
    }

    /** Acudientes de la academia para el selector (DEC-43). */
    async guardianOptions(): Promise<readonly GuardianChoice[]> {
        const options = await this.guardianRepository.listGuardians();

        return options.map((option) => {
            const link = option.players.find((player) => player.playerId === this.playerId);

            return { ...option, alreadyLinked: !!link, linkedAs: link?.relationship ?? null };
        });
    }

    /** Otros jugadores con acudientes, para «Copiar de un hermano». */
    async siblings(): Promise<readonly PlayerSummary[]> {
        return (await this.players.listPlayers()).filter((player) => player.id !== this.playerId && player.guardianCount > 0);
    }

    siblingGuardians(playerId: string): Promise<readonly Guardian[]> {
        return this.guardianRepository.listByPlayer(playerId);
    }

    /** Asigna acudientes ya registrados sin pedir de nuevo la autorización (CA-003 de HU-035). */
    async assignGuardians(assignments: readonly GuardianAssignment[]): Promise<number> {
        let assigned = 0;

        await this.run(async () => {
            assigned = await this.guardianRepository.assign(this.playerId, assignments);
        });

        return assigned;
    }

    removeGuardian(guardian: Guardian): Promise<void> {
        return this.run(() => this.guardianRepository.removeFromPlayer(guardian.linkId));
    }

    private async run(operation: () => Promise<unknown>, reload = true): Promise<void> {
        if (this.busy()) {
            return;
        }

        this.busy.set(true);

        try {
            await operation();

            if (reload) {
                await this.refresh();
            }
        } catch (error) {
            if (error instanceof GroupsNotSavedError || (error instanceof AppError && error.code === 'not_found')) {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    /** Relee sin pasar a carga; si el jugador ya no existe, pasa a `not_found`. */
    private async refresh(): Promise<void> {
        try {
            const [player, guardians] = await Promise.all([this.players.getPlayer(this.playerId), this.guardianRepository.listByPlayer(this.playerId)]);
            this.player.set(player);
            this.guardians.set(guardians);
        } catch (error) {
            if (error instanceof AppError && error.code === 'not_found') {
                this.status.set('not_found');
            }
        }
    }
}
