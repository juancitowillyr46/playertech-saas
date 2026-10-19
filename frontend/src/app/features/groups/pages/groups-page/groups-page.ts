import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { PageHeader, PageHeaderAction } from '../../../../shared/components/page-header/page-header';
import { GroupNameDrawer } from '../../components/group-name-drawer/group-name-drawer';
import { GroupsService } from '../../services/groups.service';

/** Pestaña Grupos (spec 009, HU-004): listado con el número de jugadores activos y «Crear grupo». */
@Component({
    selector: 'app-groups-page',
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, MessageModule, SkeletonModule, PageHeader, PageHeaderAction, GroupNameDrawer],
    providers: [GroupsService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Grupos" description="Organiza a tus jugadores por categorías o equipos.">
            <p-button appPageHeaderAction label="Crear grupo" icon="pi pi-plus" [disabled]="groups.busy()" (onClick)="openCreate()" />
        </app-page-header>

        @switch (groups.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando grupos">
                    @for (row of [1, 2, 3]; track row) {
                        <p-skeleton height="3.5rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar los grupos. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="groups.load()" />
            }
            @case ('empty') {
                <div class="border-y border-(--p-content-border-color) py-8">
                    <p class="m-0 text-lg font-semibold">Aún no hay grupos.</p>
                    <p class="m-0 mt-1 text-muted-color">Crea el primero con «Crear grupo», por ejemplo «Sub-12».</p>
                </div>
            }
            @default {
                <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Grupos de la academia">
                    @for (group of groups.groups(); track group.id) {
                        <li class="border-b border-(--p-content-border-color)">
                            <a [routerLink]="[group.id]" class="flex min-h-14 items-center justify-between gap-3 py-2 pl-1 text-color no-underline">
                                <span class="min-w-0 truncate font-semibold">{{ group.name }}</span>
                                <span class="shrink-0 text-muted-color">{{ group.activePlayerCount === 1 ? '1 jugador' : group.activePlayerCount + ' jugadores' }} <i class="pi pi-angle-right" aria-hidden="true"></i></span>
                            </a>
                        </li>
                    }
                </ul>
            }
        }

        <app-group-name-drawer [open]="drawerOpen()" [busy]="groups.busy()" [error]="formError()" [isTaken]="isTaken" (save)="create($event)" (closed)="drawerOpen.set(false)" />
        <p-confirmdialog />
    `
})
export class GroupsPage implements OnInit {
    protected readonly groups = inject(GroupsService);
    private readonly messages = inject(MessageService);
    private readonly drawer = viewChild.required(GroupNameDrawer);

    protected readonly drawerOpen = signal(false);
    protected readonly formError = signal<string | null>(null);
    protected readonly isTaken = (name: string) => this.groups.isNameTaken(name);

    ngOnInit(): void {
        void this.groups.load();
    }

    protected openCreate(): void {
        this.formError.set(null);
        this.drawerOpen.set(true);
    }

    protected async create(name: string): Promise<void> {
        this.formError.set(null);

        try {
            await this.groups.create(name);
            this.drawer().markSaved();
            this.drawerOpen.set(false);
            this.messages.add({ severity: 'success', summary: 'Grupo creado.', life: 4000 });
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                this.drawer().markTaken();
                return;
            }

            this.formError.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }
}
