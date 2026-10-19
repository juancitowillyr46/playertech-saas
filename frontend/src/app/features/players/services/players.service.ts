import { computed, inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { normalizePhone } from '../../../shared/forms/phone.validator';
import { searchKey } from '../../../shared/text/search-text';
import { GroupsNotSavedError, PlayerRepository } from '../data/player.repository';
import { GroupRef, PlayerInput, PlayerSummary } from '../models/player.models';

export type PlayersStatus = 'loading' | 'ready' | 'empty' | 'error';
export type PlayerStatusFilter = 'active' | 'inactive' | 'all';

/** Resultado de registrar: guardado, o el jugador ya registrado para ofrecer actualizarlo (DEC-42). */
export type SaveResult = { readonly saved: true } | { readonly duplicate: PlayerSummary };

/** Texto recortado; vacío pasa a null. */
function clean(value: string | null): string | null {
    const trimmed = value?.trim() ?? '';

    return trimmed === '' ? null : trimmed;
}

export function cleanPlayerInput(input: PlayerInput): PlayerInput {
    return {
        firstNames: input.firstNames.trim(),
        lastNames: input.lastNames.trim(),
        nickname: clean(input.nickname),
        birthDate: input.birthDate,
        phone: clean(normalizePhone(input.phone)),
        groupIds: input.groupIds
    };
}

/**
 * Estado y operaciones del listado de jugadores (spec 009, contracts/repositories.md).
 * Búsqueda y filtros en el cliente (research R7). Tras cada operación se relee el listado
 * sin pasar a carga, como en Sedes.
 */
@Injectable()
export class PlayersService {
    private readonly repository = inject(PlayerRepository);

    readonly players = signal<readonly PlayerSummary[]>([]);
    readonly groups = signal<readonly GroupRef[]>([]);
    readonly status = signal<PlayersStatus>('loading');
    readonly query = signal('');
    /** Id del grupo, o 'all'. */
    readonly groupFilter = signal('all');
    readonly statusFilter = signal<PlayerStatusFilter>('active');
    readonly busy = signal(false);

    readonly visiblePlayers = computed(() => {
        const query = searchKey(this.query());
        const group = this.groupFilter();
        const status = this.statusFilter();

        return this.players()
            .filter((player) => status === 'all' || (status === 'active') === player.isActive)
            .filter((player) => group === 'all' || player.groups.some((ref) => ref.id === group))
            .filter((player) => !query || searchKey(`${player.firstNames} ${player.lastNames} ${player.nickname ?? ''}`).includes(query))
            .sort((a, b) => `${a.firstNames} ${a.lastNames}`.localeCompare(`${b.firstNames} ${b.lastNames}`, 'es-CO'));
    });

    async load(): Promise<void> {
        this.status.set('loading');

        try {
            const [players, groups] = await Promise.all([this.repository.listPlayers(), this.repository.listGroups()]);
            this.groups.set(groups);
            this.apply(players);
        } catch {
            this.status.set('error');
        }
    }

    /** Registra un jugador; si ya existe, no guarda y devuelve el existente (CA-006 de HU-002). */
    async create(input: PlayerInput): Promise<SaveResult> {
        const player = cleanPlayerInput(input);
        let result: SaveResult = { saved: true };

        await this.run(async () => {
            const duplicate = await this.findDuplicate(player);

            if (duplicate) {
                result = { duplicate };
                return;
            }

            try {
                await this.repository.createPlayer(player);
            } catch (error) {
                // Otra pestaña lo registró entre la consulta y la inserción: mismo aviso.
                const raced = error instanceof AppError && error.code === 'duplicate' ? await this.findDuplicate(player) : null;

                if (!raced) {
                    throw error;
                }

                result = { duplicate: raced };
            }
        });

        return result;
    }

    /** Guarda lo escrito sobre el jugador ya registrado y lo reactiva si estaba inactivo. */
    replaceDuplicate(existing: PlayerSummary, input: PlayerInput): Promise<void> {
        return this.run(async () => {
            await this.repository.updatePlayer(existing.id, cleanPlayerInput(input));

            if (!existing.isActive) {
                await this.repository.setActive(existing.id, true);
            }
        });
    }

    setActive(player: PlayerSummary, active: boolean): Promise<void> {
        return this.run(() => this.repository.setActive(player.id, active));
    }

    /** Busca el registrado con la misma identidad y lo devuelve con sus grupos actuales. */
    private async findDuplicate(player: PlayerInput): Promise<PlayerSummary | null> {
        const id = await this.repository.findByIdentity(player.firstNames, player.lastNames, player.birthDate);

        return id ? this.repository.getPlayer(id) : null;
    }

    /** Una operación a la vez; al terminar (o si algo ya no existe) se relee el listado. */
    private async run(operation: () => Promise<unknown>): Promise<void> {
        if (this.busy()) {
            return;
        }

        this.busy.set(true);

        try {
            await operation();
            await this.refresh();
        } catch (error) {
            if (error instanceof GroupsNotSavedError || (error instanceof AppError && error.code === 'not_found')) {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    private async refresh(): Promise<void> {
        try {
            this.apply(await this.repository.listPlayers());
        } catch {
            // El listado visible sigue siendo válido; el próximo cambio lo actualizará.
        }
    }

    private apply(players: readonly PlayerSummary[]): void {
        this.players.set(players);
        this.status.set(players.length > 0 ? 'ready' : 'empty');
    }
}
