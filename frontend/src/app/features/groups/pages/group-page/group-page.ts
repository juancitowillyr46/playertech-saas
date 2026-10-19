import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { AddMembersDrawer } from '../../components/add-members-drawer/add-members-drawer';
import { GroupNameDrawer } from '../../components/group-name-drawer/group-name-drawer';
import { GroupMember } from '../../models/group.models';
import { GroupsService } from '../../services/groups.service';

const STAMP = 'border-2 border-current uppercase tracking-wider';

/** Un grupo con sus integrantes (spec 009, HU-004): agregar, quitar, renombrar y eliminar. */
@Component({
    selector: 'app-group-page',
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, MenuModule, MessageModule, SkeletonModule, TagModule, AddMembersDrawer, GroupNameDrawer],
    providers: [GroupsService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <a routerLink="/players/groups" class="mb-3 inline-flex min-h-11 items-center gap-2 text-color no-underline"><i class="pi pi-arrow-left" aria-hidden="true"></i>Grupos</a>

        @switch (groups.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando grupo">
                    <p-skeleton height="2.5rem" width="50%" />
                    <p-skeleton height="8rem" />
                </div>
            }
            @case ('not_found') {
                <p-message severity="warn" styleClass="mb-4">Este grupo ya no existe.</p-message>
                <p-button label="Ver grupos" [outlined]="true" (onClick)="backToList()" />
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar el grupo. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="groups.loadGroup(id())" />
            }
            @default {
                @if (groups.group(); as group) {
                    <div class="mb-4 flex items-end gap-3 border-b-2 border-(--p-text-color) pb-3">
                        <h1 class="m-0 min-w-0 flex-1 break-words">{{ group.name }}</h1>
                        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Más acciones del grupo" (onClick)="groupMenu.toggle($event)" />
                    </div>

                    <div class="mb-3 flex items-center justify-between gap-3">
                        <p class="m-0 text-muted-color">{{ group.activePlayerCount === 1 ? '1 jugador activo' : group.activePlayerCount + ' jugadores activos' }}</p>
                        <p-button label="Agregar jugadores" icon="pi pi-plus" [disabled]="groups.busy()" (onClick)="openAddMembers()" />
                    </div>

                    @if (group.members.length === 0) {
                        <p class="m-0 border-y border-(--p-content-border-color) py-6 text-muted-color">Este grupo aún no tiene jugadores.</p>
                    } @else {
                        <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Integrantes del grupo">
                            @for (member of group.members; track member.playerId) {
                                <li class="flex min-h-13 items-center gap-3 border-b border-(--p-content-border-color) py-1 pl-1">
                                    <a [routerLink]="['/players', member.playerId]" class="block min-w-0 flex-1 truncate py-3 text-color no-underline">
                                        {{ member.firstNames }} {{ member.lastNames }}
                                        @if (member.nickname) {
                                            <span class="text-muted-color"> · {{ member.nickname }}</span>
                                        }
                                    </a>
                                    @if (!member.isActive) {
                                        <p-tag severity="secondary" value="Inactivo" [styleClass]="stamp" />
                                    }
                                    <p-button label="Quitar" [text]="true" severity="secondary" [ariaLabel]="'Quitar a ' + member.firstNames + ' ' + member.lastNames" [disabled]="groups.busy()" (onClick)="removeMember(member)" />
                                </li>
                            }
                        </ul>
                    }

                    <app-group-name-drawer [open]="renameOpen()" [name]="group.name" [busy]="groups.busy()" [error]="formError()" [isTaken]="isTaken" (save)="rename($event)" (closed)="renameOpen.set(false)" />
                }
            }
        }

        <app-add-members-drawer [open]="addOpen()" [candidates]="candidates()" [busy]="groups.busy()" (save)="addMembers($event)" (closed)="addOpen.set(false)" />
        <p-menu #groupMenu [model]="groupMenuItems" [popup]="true" appendTo="body" />
        <p-confirmdialog />
    `
})
export class GroupPage implements OnInit {
    protected readonly groups = inject(GroupsService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly router = inject(Router);
    private readonly renameDrawer = viewChild(GroupNameDrawer);

    /** Parámetro `:id` de la ruta. */
    readonly id = input.required<string>();

    protected readonly stamp = STAMP;
    protected readonly renameOpen = signal(false);
    protected readonly addOpen = signal(false);
    protected readonly formError = signal<string | null>(null);
    protected readonly candidates = signal<readonly GroupMember[]>([]);
    protected readonly isTaken = (name: string) => this.groups.isNameTaken(name, this.id());

    protected readonly groupMenuItems: MenuItem[] = [
        { label: 'Renombrar', icon: 'pi pi-pencil', command: () => this.openRename() },
        { label: 'Eliminar grupo', icon: 'pi pi-trash', command: () => this.confirmRemove() }
    ];

    ngOnInit(): void {
        void this.groups.loadGroup(this.id());
    }

    protected backToList(): void {
        void this.router.navigate(['/players/groups']);
    }

    protected async openAddMembers(): Promise<void> {
        try {
            this.candidates.set(await this.groups.candidates());
            this.addOpen.set(true);
        } catch (error) {
            this.fail(error);
        }
    }

    protected async addMembers(playerIds: string[]): Promise<void> {
        try {
            await this.groups.addMembers(playerIds);
            this.addOpen.set(false);
            this.notify(playerIds.length === 1 ? 'Jugador agregado.' : `${playerIds.length} jugadores agregados.`);
        } catch (error) {
            this.fail(error);
        }
    }

    /** Quitar es reversible (se vuelve a agregar): sin confirmación. */
    protected async removeMember(member: GroupMember): Promise<void> {
        try {
            await this.groups.removeMember(member.playerId);
            this.notify(`${member.firstNames} salió del grupo.`);
        } catch (error) {
            this.fail(error);
        }
    }

    protected async rename(name: string): Promise<void> {
        this.formError.set(null);

        try {
            await this.groups.rename(this.id(), name);
            this.renameDrawer()?.markSaved();
            this.renameOpen.set(false);
            this.notify('Grupo renombrado.');
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                this.renameDrawer()?.markTaken();
                return;
            }

            this.formError.set(this.messageFor(error));
        }
    }

    private openRename(): void {
        this.formError.set(null);
        this.renameOpen.set(true);
    }

    private confirmRemove(): void {
        const group = this.groups.group();

        if (!group) {
            return;
        }

        this.confirmation.confirm({
            header: `¿Eliminar el grupo «${group.name}»?`,
            message: 'Sus jugadores siguen registrados; solo dejan de pertenecer a este grupo.',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () =>
                void (async () => {
                    try {
                        await this.groups.remove(group.id);
                        this.notify('Grupo eliminado.');
                        this.backToList();
                    } catch (error) {
                        this.fail(error);
                    }
                })()
        });
    }

    private notify(summary: string): void {
        this.messages.add({ severity: 'success', summary, life: 4000 });
    }

    private fail(error: unknown): void {
        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
    }

    private messageFor(error: unknown): string {
        return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
    }
}
