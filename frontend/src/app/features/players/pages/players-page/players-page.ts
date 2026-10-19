import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { PageHeader, PageHeaderAction } from '../../../../shared/components/page-header/page-header';
import { ageOn, todayInColombia } from '../../../../shared/text/search-text';
import { PlayerFormDrawer } from '../../components/player-form-drawer/player-form-drawer';
import { GroupsNotSavedError } from '../../data/player.repository';
import { PlayerInput, PlayerSummary, shortName } from '../../models/player.models';
import { PlayersService, PlayerStatusFilter } from '../../services/players.service';

/** Sellos de estado de la planilla (DESIGN.md), como en Sedes. */
const STAMP = 'border-2 border-current uppercase tracking-wider';

/**
 * Pestaña Jugadores (spec 009; HU-002 y HU-003): listado con búsqueda y filtros, y el
 * registro en drawer con el aviso de jugador ya registrado (DEC-42).
 */
@Component({
    selector: 'app-players-page',
    imports: [
        FormsModule,
        RouterLink,
        ButtonModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        MessageModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        PageHeader,
        PageHeaderAction,
        PlayerFormDrawer
    ],
    providers: [PlayersService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Jugadores" description="Los jugadores de tu academia y sus grupos.">
            <p-button appPageHeaderAction label="Registrar jugador" icon="pi pi-plus" [disabled]="players.busy()" (onClick)="openCreate()" />
        </app-page-header>

        @switch (players.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando jugadores">
                    @for (row of [1, 2, 3]; track row) {
                        <p-skeleton height="4rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar los jugadores. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="players.load()" />
            }
            @case ('empty') {
                <div class="border-y border-(--p-content-border-color) py-8">
                    <p class="m-0 text-lg font-semibold">Aún no hay jugadores.</p>
                    <p class="m-0 mt-1 text-muted-color">Registra el primero con «Registrar jugador».</p>
                </div>
            }
            @default {
                <div class="mb-3 flex flex-col gap-2 sm:flex-row">
                    <p-iconfield class="min-w-0 flex-1">
                        <p-inputicon class="pi pi-search" />
                        <input pInputText type="search" aria-label="Buscar jugador" placeholder="Nombre, apellido o apodo" class="w-full" [ngModel]="players.query()" (ngModelChange)="players.query.set($event)" />
                    </p-iconfield>
                    <div class="flex gap-2">
                        <p-select [options]="groupOptions()" optionLabel="label" optionValue="value" ariaLabel="Filtrar por grupo" styleClass="w-full sm:w-44" class="min-w-0 flex-1" [ngModel]="players.groupFilter()" (ngModelChange)="players.groupFilter.set($event)" />
                        <p-select [options]="statusOptions" optionLabel="label" optionValue="value" ariaLabel="Filtrar por estado" styleClass="w-full sm:w-36" class="min-w-0 flex-1" [ngModel]="players.statusFilter()" (ngModelChange)="players.statusFilter.set($event)" />
                    </div>
                </div>
                <p class="m-0 mb-3 text-sm text-muted-color" aria-live="polite">{{ countLabel() }}</p>

                @if (rows().length === 0) {
                    <div class="border-y border-(--p-content-border-color) py-8">
                        <p class="m-0 text-lg font-semibold">Ningún jugador coincide con la búsqueda.</p>
                        <p-button label="Limpiar búsqueda" [text]="true" styleClass="mt-2 -ml-3" (onClick)="clearFilters()" />
                    </div>
                } @else {
                    <!-- Celular: filas regladas que abren la ficha. -->
                    <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0 md:hidden" aria-label="Jugadores de la academia">
                        @for (row of rows(); track row.player.id) {
                            <li class="border-b border-(--p-content-border-color)">
                                <a [routerLink]="[row.player.id]" class="flex min-h-16 flex-col justify-center gap-0.5 py-2.5 pl-1 text-color no-underline">
                                    <span class="flex min-w-0 items-center gap-2">
                                        <span class="truncate font-semibold">{{ row.name }}</span>
                                        @if (!row.player.isActive) {
                                            <p-tag severity="secondary" value="Inactivo" [styleClass]="stamp" />
                                        }
                                    </span>
                                    <span class="truncate text-sm text-muted-color">{{ row.details }}</span>
                                </a>
                            </li>
                        }
                    </ul>

                    <!-- Escritorio: tabla con ordenamiento y paginación. -->
                    <div class="hidden md:block">
                        <p-table [value]="rows()" [paginator]="rows().length > 20" [rows]="20" dataKey="id">
                            <ng-template #header>
                                <tr>
                                    <th scope="col" pSortableColumn="fullName" class="whitespace-nowrap">Jugador <p-sortIcon field="fullName" /></th>
                                    <th scope="col" pSortableColumn="age" class="whitespace-nowrap">Edad <p-sortIcon field="age" /></th>
                                    <th scope="col">Grupos</th>
                                    <th scope="col">Acudientes</th>
                                    <th scope="col">Estado</th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-row>
                                <tr>
                                    <td>
                                        <a [routerLink]="[row.player.id]" class="font-semibold text-color">{{ row.fullName }}</a>
                                        @if (row.player.nickname) {
                                            <span class="text-muted-color"> · {{ row.player.nickname }}</span>
                                        }
                                    </td>
                                    <td>{{ row.age }} años</td>
                                    <td>{{ row.groupNames || 'Sin grupo' }}</td>
                                    <td>{{ row.player.guardianCount }}</td>
                                    <td><p-tag [severity]="row.player.isActive ? 'success' : 'secondary'" [value]="row.player.isActive ? 'Activo' : 'Inactivo'" [styleClass]="stamp" /></td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                }
            }
        }

        <app-player-form-drawer
            [open]="drawerOpen()"
            [groups]="players.groups()"
            [busy]="players.busy()"
            [duplicate]="duplicate()"
            [error]="formError()"
            (save)="create($event)"
            (replace)="replaceDuplicate($event)"
            (closed)="closeDrawer()"
        />

        <p-confirmdialog />
    `
})
export class PlayersPage implements OnInit {
    protected readonly players = inject(PlayersService);
    private readonly messages = inject(MessageService);
    private readonly drawer = viewChild.required(PlayerFormDrawer);

    protected readonly stamp = STAMP;
    protected readonly statusOptions: { label: string; value: PlayerStatusFilter }[] = [
        { label: 'Activos', value: 'active' },
        { label: 'Inactivos', value: 'inactive' },
        { label: 'Todos', value: 'all' }
    ];
    protected readonly groupOptions = computed(() => [{ label: 'Todos los grupos', value: 'all' }, ...this.players.groups().map((group) => ({ label: group.name, value: group.id }))]);

    protected readonly drawerOpen = signal(false);
    protected readonly duplicate = signal<PlayerSummary | null>(null);
    protected readonly formError = signal<string | null>(null);

    private readonly today = todayInColombia();

    protected readonly rows = computed(() =>
        this.players.visiblePlayers().map((player) => {
            const age = ageOn(player.birthDate, this.today);
            const groupNames = player.groups.map((group) => group.name).join(', ');
            const guardians = player.guardianCount === 0 ? 'Sin acudientes' : player.guardianCount === 1 ? '1 acudiente' : `${player.guardianCount} acudientes`;

            return {
                id: player.id,
                player,
                age,
                fullName: `${player.firstNames} ${player.lastNames}`,
                name: player.nickname ? `${shortName(player)} · ${player.nickname}` : shortName(player),
                groupNames,
                details: [`${age} años`, groupNames || 'Sin grupo', guardians].join(' · ')
            };
        })
    );

    protected readonly countLabel = computed(() => {
        const count = this.rows().length;

        return count === 1 ? '1 jugador' : `${count} jugadores`;
    });

    ngOnInit(): void {
        void this.players.load();
    }

    protected clearFilters(): void {
        this.players.query.set('');
        this.players.groupFilter.set('all');
        this.players.statusFilter.set('active');
    }

    protected openCreate(): void {
        this.duplicate.set(null);
        this.formError.set(null);
        this.drawerOpen.set(true);
    }

    protected closeDrawer(): void {
        this.drawerOpen.set(false);
    }

    protected async create(input: PlayerInput): Promise<void> {
        await this.attempt(async () => {
            const result = await this.players.create(input);

            if ('duplicate' in result) {
                this.duplicate.set(result.duplicate);
                return false;
            }

            return true;
        }, 'Jugador registrado.');
    }

    protected async replaceDuplicate(input: PlayerInput): Promise<void> {
        const existing = this.duplicate();

        if (existing) {
            await this.attempt(async () => {
                await this.players.replaceDuplicate(existing, input);
                return true;
            }, existing.isActive ? 'Datos del jugador actualizados.' : 'Jugador reactivado y actualizado.');
        }
    }

    /** Guarda; si termina, cierra el drawer con su aviso. Los errores quedan en el formulario. */
    private async attempt(operation: () => Promise<boolean>, success: string): Promise<void> {
        this.formError.set(null);

        try {
            if (await operation()) {
                this.finish(success);
            }
        } catch (error) {
            if (error instanceof GroupsNotSavedError) {
                this.finish('El jugador se guardó, pero no sus grupos. Inténtalo de nuevo desde su ficha.', 'warn');
                return;
            }

            this.formError.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }

    private finish(summary: string, severity: 'success' | 'warn' = 'success'): void {
        this.drawer().markSaved();
        this.duplicate.set(null);
        this.closeDrawer();
        this.messages.add({ severity, summary, life: severity === 'success' ? 4000 : 8000 });
    }
}
