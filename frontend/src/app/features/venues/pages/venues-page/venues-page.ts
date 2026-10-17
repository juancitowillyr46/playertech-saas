import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { map } from 'rxjs';
import { PageHeader, PageHeaderAction } from '../../../../shared/components/page-header/page-header';
import { Venue, VENUE_TYPE_LABELS, VenueType } from '../../models/venue.models';
import { VenuesService, VenueStatusFilter } from '../../services/venues.service';

/** Por debajo de `md` (768 px): tarjetas y formulario a pantalla completa (research R8). */
const MOBILE_QUERY = '(max-width: 767.98px)';

/** Estados de la sede como sellos de la planilla (DESIGN.md): sin relleno y con borde. */
const STAMP = 'border-2 border-current uppercase tracking-wider';

/**
 * Pantalla modelo de Sedes (spec 003, US5 y US6; contracts/ui-contracts.md): patrón de
 * página de gestión de ui.md con datos reales de solo lectura. La escritura es una
 * maqueta (FR-018a): el formulario se abre, pero no guarda; HU-029 y HU-031 la completan.
 */
@Component({
    selector: 'app-venues-page',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        ConfirmDialogModule,
        DrawerModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        MenuModule,
        MessageModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        PageHeader,
        PageHeaderAction
    ],
    providers: [VenuesService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Sedes" description="Lugares donde funciona tu academia.">
            <p-button appPageHeaderAction label="Nueva sede" icon="pi pi-plus" (onClick)="openCreate()" />
        </app-page-header>

        @switch (venues.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando sedes">
                    @for (row of [1, 2, 3]; track row) {
                        <p-skeleton height="4.5rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar las sedes. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="venues.load()" />
            }
            @case ('empty') {
                <div class="border-y border-(--p-content-border-color) py-8">
                    <p class="m-0 text-lg font-semibold">Aún no hay sedes.</p>
                    <p class="m-0 mt-1 text-muted-color">Registra la primera con «Nueva sede».</p>
                </div>
            }
            @default {
                <div class="mb-4 flex gap-2">
                    <p-iconfield class="min-w-0 flex-1">
                        <p-inputicon class="pi pi-search" />
                        <input
                            pInputText
                            type="search"
                            aria-label="Buscar sede"
                            placeholder="Buscar sede"
                            class="w-full"
                            [ngModel]="venues.query()"
                            (ngModelChange)="venues.query.set($event)"
                        />
                    </p-iconfield>
                    <p-select
                        [options]="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        ariaLabel="Filtrar por estado"
                        styleClass="w-36 shrink-0"
                        [ngModel]="venues.statusFilter()"
                        (ngModelChange)="venues.statusFilter.set($event)"
                    />
                </div>

                @if (venues.visibleVenues().length === 0) {
                    <div class="border-y border-(--p-content-border-color) py-8">
                        <p class="m-0 text-lg font-semibold">Ninguna sede coincide con la búsqueda.</p>
                        <p-button label="Limpiar búsqueda" [text]="true" styleClass="mt-2 -ml-3" (onClick)="clearFilters()" />
                    </div>
                } @else {
                    <!-- Celular: filas regladas y numeradas, como una planilla. -->
                    <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0 md:hidden" aria-label="Sedes de la academia">
                        @for (venue of venues.visibleVenues(); track venue.id; let index = $index) {
                            <li class="flex items-start gap-3 border-b border-(--p-content-border-color) py-3 pl-1">
                                <span class="w-7 shrink-0 pt-0.5 font-mono text-sm text-muted-color" aria-hidden="true">{{ rowNumber(index) }}</span>
                                <div class="min-w-0 flex-1">
                                    <p class="m-0 truncate font-semibold" [attr.title]="venue.name">{{ venue.name }}</p>
                                    <p class="m-0 mt-0.5 text-sm text-muted-color">{{ typeLabel(venue.type) }} · {{ venue.city ?? 'Sin ciudad' }}</p>
                                    <div class="mt-2 flex flex-wrap gap-1.5">
                                        @if (venue.isPrimary) {
                                            <p-tag severity="contrast" value="Principal" [styleClass]="stamp" />
                                        }
                                        <p-tag [severity]="venue.isActive ? 'success' : 'secondary'" [value]="venue.isActive ? 'Activa' : 'Inactiva'" [styleClass]="stamp" />
                                    </div>
                                </div>
                                <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'Acciones de ' + venue.name" (onClick)="openRowMenu($event, venue, rowMenu)" />
                            </li>
                        }
                    </ul>

                    <!-- Escritorio: tabla con ordenamiento y paginación. -->
                    <div class="hidden md:block">
                        <p-table [value]="tableRows()" [paginator]="tableRows().length > 10" [rows]="10" dataKey="id">
                            <ng-template #header>
                                <tr>
                                    <th scope="col" class="w-16">Nº</th>
                                    <th scope="col" pSortableColumn="name" class="whitespace-nowrap">Nombre <p-sortIcon field="name" /></th>
                                    <th scope="col">Tipo</th>
                                    <th scope="col" pSortableColumn="cityLabel" class="whitespace-nowrap">Ciudad <p-sortIcon field="cityLabel" /></th>
                                    <th scope="col">Estado</th>
                                    <th scope="col" class="w-16"><span class="sr-only">Acciones</span></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-row>
                                <tr>
                                    <td class="font-mono text-sm text-muted-color">{{ row.number }}</td>
                                    <td>
                                        <span class="font-semibold">{{ row.venue.name }}</span>
                                        @if (row.venue.isPrimary) {
                                            <p-tag severity="contrast" value="Principal" [styleClass]="stamp + ' ml-2'" />
                                        }
                                    </td>
                                    <td>{{ typeLabel(row.venue.type) }}</td>
                                    <td>{{ row.cityLabel }}</td>
                                    <td>
                                        <p-tag [severity]="row.venue.isActive ? 'success' : 'secondary'" [value]="row.venue.isActive ? 'Activa' : 'Inactiva'" [styleClass]="stamp" />
                                    </td>
                                    <td>
                                        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'Acciones de ' + row.venue.name" (onClick)="openRowMenu($event, row.venue, rowMenu)" />
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                }
            }
        }

        <p-menu #rowMenu [model]="rowMenuItems()" [popup]="true" appendTo="body" />

        <!-- Formulario de maqueta (FR-018a): a la derecha en escritorio, a pantalla completa en el celular. -->
        <p-drawer
            [visible]="drawerOpen()"
            position="right"
            [fullScreen]="isMobile()"
            [showCloseIcon]="false"
            [closeOnEscape]="false"
            [dismissible]="false"
            [blockScroll]="true"
            styleClass="w-full md:w-[30rem]"
            [pt]="{ root: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'venue-drawer-title' } }"
        >
            <ng-template #header>
                <div class="flex w-full items-center justify-between gap-2">
                    <h2 id="venue-drawer-title" class="m-0 text-xl">{{ editing() ? 'Editar sede' : 'Nueva sede' }}</h2>
                    <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Cerrar" (onClick)="requestClose()" />
                </div>
            </ng-template>

            <form [formGroup]="form" class="flex flex-col gap-5" novalidate (ngSubmit)="$event.preventDefault()">
                <div class="flex flex-col gap-2">
                    <label for="venueName" class="font-medium">Nombre de la sede</label>
                    <input pInputText id="venueName" formControlName="name" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="venueType" class="font-medium">Tipo</label>
                    <p-select inputId="venueType" formControlName="type" [options]="typeOptions" optionLabel="label" optionValue="value" styleClass="w-full" appendTo="body" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="venueAddress" class="font-medium">Dirección <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="venueAddress" formControlName="address" autocomplete="street-address" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="venueCity" class="font-medium">Ciudad <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="venueCity" formControlName="city" autocomplete="address-level2" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="venueDirections" class="font-medium">Indicaciones <span class="font-normal text-muted-color">(opcional)</span></label>
                    <textarea pTextarea id="venueDirections" formControlName="directions" rows="3" class="w-full"></textarea>
                </div>
            </form>

            <ng-template #footer>
                <div class="flex flex-col gap-3">
                    <p-message severity="info" size="small">Disponible próximamente: aún no se pueden guardar sedes.</p-message>
                    <div class="flex gap-2">
                        <p-button label="Cancelar" [outlined]="true" styleClass="w-full" class="flex-1" (onClick)="requestClose()" />
                        <p-button label="Guardar" [disabled]="true" styleClass="w-full" class="flex-1" />
                    </div>
                </div>
            </ng-template>
        </p-drawer>

        <p-confirmdialog />
    `
})
export class VenuesPage implements OnInit {
    protected readonly venues = inject(VenuesService);
    private readonly confirmation = inject(ConfirmationService);

    protected readonly stamp = STAMP;
    protected readonly isMobile = toSignal(inject(BreakpointObserver).observe(MOBILE_QUERY).pipe(map((state) => state.matches)), { initialValue: false });

    protected readonly statusOptions: { label: string; value: VenueStatusFilter }[] = [
        { label: 'Todas', value: 'all' },
        { label: 'Activas', value: 'active' },
        { label: 'Inactivas', value: 'inactive' }
    ];
    protected readonly typeOptions = (Object.keys(VENUE_TYPE_LABELS) as VenueType[]).map((value) => ({ label: VENUE_TYPE_LABELS[value], value }));

    /** Filas de la tabla: el número de fila (orden de la planilla) y la ciudad ordenable. */
    protected readonly tableRows = computed(() =>
        this.venues.visibleVenues().map((venue, index) => ({ venue, number: this.rowNumber(index), name: venue.name, cityLabel: venue.city ?? 'Sin ciudad' }))
    );

    protected readonly drawerOpen = signal(false);
    protected readonly editing = signal<Venue | null>(null);
    private readonly menuVenue = signal<Venue | null>(null);

    protected readonly form = inject(FormBuilder).nonNullable.group({
        name: ['', Validators.required],
        type: ['training_ground' as VenueType],
        address: [''],
        city: [''],
        directions: ['']
    });

    protected readonly rowMenuItems = computed<MenuItem[]>(() => {
        const venue = this.menuVenue();

        return [
            { label: 'Editar', icon: 'pi pi-pencil', command: () => venue && this.openEdit(venue) },
            { label: 'Desactivar (próximamente)', icon: 'pi pi-ban', disabled: true },
            { label: 'Eliminar (próximamente)', icon: 'pi pi-trash', disabled: true }
        ];
    });

    ngOnInit(): void {
        void this.venues.load();
    }

    protected rowNumber(index: number): string {
        return String(index + 1).padStart(2, '0');
    }

    protected typeLabel(type: VenueType): string {
        return VENUE_TYPE_LABELS[type];
    }

    protected clearFilters(): void {
        this.venues.query.set('');
        this.venues.statusFilter.set('all');
    }

    protected openRowMenu(event: Event, venue: Venue, menu: Menu): void {
        this.menuVenue.set(venue);
        menu.toggle(event);
    }

    protected openCreate(): void {
        this.editing.set(null);
        this.form.reset();
        this.drawerOpen.set(true);
    }

    protected openEdit(venue: Venue): void {
        this.editing.set(venue);
        this.form.reset({ name: venue.name, type: venue.type, address: '', city: venue.city ?? '', directions: '' });
        this.drawerOpen.set(true);
    }

    /** Cerrar con cambios sin guardar pide confirmación (patrón de página de gestión de ui.md). */
    protected requestClose(): void {
        if (!this.form.dirty) {
            this.drawerOpen.set(false);
            return;
        }

        this.confirmation.confirm({
            header: '¿Descartar los cambios?',
            message: 'Lo que escribiste en el formulario se perderá.',
            acceptLabel: 'Descartar',
            rejectLabel: 'Seguir editando',
            rejectButtonProps: { outlined: true },
            accept: () => this.drawerOpen.set(false)
        });
    }
}
