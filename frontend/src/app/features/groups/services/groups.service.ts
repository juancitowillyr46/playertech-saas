import { inject, Injectable, signal } from '@angular/core';
import { AppError } from '../../../core/errors/app-error';
import { GroupRepository } from '../data/group.repository';
import { GroupDetail, GroupMember, GroupSummary } from '../models/group.models';

export type GroupsStatus = 'loading' | 'ready' | 'empty' | 'error' | 'not_found';

/** Nombre comparable: sin mayúsculas ni espacios sobrantes (índice único de la base de datos). */
function nameKey(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CO');
}

/**
 * Grupos y sus integrantes (spec 009, HU-004). Una instancia sirve al listado (`load`)
 * o a un grupo (`loadGroup`); tras cada operación se relee lo que se muestra.
 */
@Injectable()
export class GroupsService {
    private readonly repository = inject(GroupRepository);

    readonly groups = signal<readonly GroupSummary[]>([]);
    readonly group = signal<GroupDetail | null>(null);
    readonly status = signal<GroupsStatus>('loading');
    readonly busy = signal(false);

    private groupId: string | null = null;

    async load(): Promise<void> {
        this.groupId = null;
        this.status.set('loading');

        try {
            this.applyList(await this.repository.listGroups());
        } catch {
            this.status.set('error');
        }
    }

    async loadGroup(id: string): Promise<void> {
        this.groupId = id;
        this.status.set('loading');
        await this.refresh(true);
    }

    /** Aviso temprano de nombre en uso; la garantía es el índice único. */
    isNameTaken(name: string, exceptId?: string): boolean {
        const wanted = nameKey(name);

        return this.groups().some((group) => group.id !== exceptId && nameKey(group.name) === wanted);
    }

    /** Jugadores activos que aún no están en el grupo actual. */
    async candidates(): Promise<readonly GroupMember[]> {
        const members = new Set(this.group()?.members.map((member) => member.playerId));

        return (await this.repository.listActivePlayers()).filter((player) => !members.has(player.playerId));
    }

    create(name: string): Promise<void> {
        return this.run(() => this.repository.createGroup(name.trim()));
    }

    rename(id: string, name: string): Promise<void> {
        return this.run(() => this.repository.renameGroup(id, name.trim()));
    }

    remove(id: string): Promise<void> {
        return this.run(() => this.repository.deleteGroup(id), false);
    }

    addMembers(playerIds: readonly string[]): Promise<void> {
        return this.run(() => this.repository.addMembers(this.groupId!, playerIds));
    }

    removeMember(playerId: string): Promise<void> {
        return this.run(() => this.repository.removeMember(this.groupId!, playerId));
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
            if (error instanceof AppError && error.code === 'not_found') {
                await this.refresh();
            }

            throw error;
        } finally {
            this.busy.set(false);
        }
    }

    /** Relee el grupo o el listado; con `showErrors`, un fallo cambia el estado. */
    private async refresh(showErrors = false): Promise<void> {
        try {
            if (this.groupId) {
                const group = await this.repository.getGroup(this.groupId);
                this.group.set(group);
                this.groups.set(await this.repository.listGroups());
                this.status.set('ready');
            } else {
                this.applyList(await this.repository.listGroups());
            }
        } catch (error) {
            if (error instanceof AppError && error.code === 'not_found') {
                this.status.set('not_found');
            } else if (showErrors) {
                this.status.set('error');
            }
        }
    }

    private applyList(groups: readonly GroupSummary[]): void {
        this.groups.set(groups);
        this.status.set(groups.length > 0 ? 'ready' : 'empty');
    }
}
