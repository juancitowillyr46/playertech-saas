import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { PageHeader, PageHeaderAction } from '../../../../shared/components/page-header/page-header';
import { fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { ActivityFormDrawer } from '../../components/activity-form-drawer/activity-form-drawer';
import { ExternalFieldDrawer } from '../../components/external-field-drawer/external-field-drawer';
import { Activity, ACTIVITY_TYPE_LABELS, activityTitle, ActivityType, ExternalFieldInput, isPast } from '../../models/activity.models';
import { ActivitiesService, ActivitiesWhen, ActivityDraft, PlaceGroups } from '../../services/activities.service';
import { ExternalFieldsService } from '../../services/external-fields.service';

const STAMP = 'border-2 border-current uppercase tracking-wider';

/**
 * Pestaña Actividades (spec 011; HU-005 y HU-006): próximas o pasadas agrupadas por día,
 * filtro por tipo y programación en drawer, con «Nueva cancha» sin salir del formulario.
 */
@Component({
    selector: 'app-activities-page',
    imports: [FormsModule, RouterLink, ButtonModule, ConfirmDialogModule, MessageModule, SelectModule, SelectButtonModule, SkeletonModule, TagModule, PageHeader, PageHeaderAction, ActivityFormDrawer, ExternalFieldDrawer],
    providers: [ActivitiesService, ExternalFieldsService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Actividades" description="Entrenamientos y competencias de tu academia.">
            <p-button appPageHeaderAction label="Nueva actividad" icon="pi pi-plus" [disabled]="activities.busy()" (onClick)="openCreate()" />
        </app-page-header>

        <div class="mb-4 flex flex-wrap gap-2">
            <p-selectbutton [options]="whenOptions" optionLabel="label" optionValue="value" [allowEmpty]="false" ariaLabelledBy="activities-when" [ngModel]="activities.when()" (ngModelChange)="activities.load($event)" />
            <span id="activities-when" class="sr-only">Próximas o pasadas</span>
            <p-select [options]="typeOptions" optionLabel="label" optionValue="value" ariaLabel="Filtrar por tipo" styleClass="w-44" [ngModel]="activities.typeFilter()" (ngModelChange)="activities.typeFilter.set($event)" />
        </div>

        @switch (activities.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando actividades">
                    @for (row of [1, 2, 3]; track row) {
                        <p-skeleton height="3.75rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar las actividades. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="activities.load()" />
            }
            @case ('empty') {
                <div class="border-y border-(--p-content-border-color) py-8">
                    @if (activities.when() === 'upcoming') {
                        <p class="m-0 text-lg font-semibold">No hay actividades próximas.</p>
                        <p class="m-0 mt-1 text-muted-color">Programa la primera con «Nueva actividad».</p>
                    } @else {
                        <p class="m-0 text-lg font-semibold">Aún no hay actividades pasadas.</p>
                    }
                </div>
            }
            @default {
                @for (day of activities.days(); track day.key) {
                    <section class="mb-4" [attr.aria-label]="day.label">
                        <h2 class="m-0 mb-1 text-sm font-bold tracking-wider text-muted-color uppercase">{{ day.label }}</h2>
                        <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0">
                            @for (activity of day.activities; track activity.id) {
                                <li class="border-b border-(--p-content-border-color)">
                                    <a [routerLink]="[activity.id]" class="flex min-h-15 items-center gap-3 py-2 pl-1 text-color no-underline" [class.text-muted-color]="activity.status === 'cancelled'">
                                        <span class="w-20 shrink-0 font-semibold">{{ time(activity) }}</span>
                                        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span class="line-clamp-2 font-semibold" [class.line-through]="activity.status === 'cancelled'">{{ title(activity) }}</span>
                                            <span class="truncate text-sm text-muted-color"
                                                >{{ activity.place.name }}
                                                @if (activity.tournament) {
                                                    · {{ activity.tournament }}
                                                }
                                            </span>
                                        </span>
                                        <!-- Estado siempre en la misma columna, para recorrerla con la vista (spec 012). -->
                                        <span class="shrink-0 pr-1 text-right">
                                            @if (activity.status === 'cancelled') {
                                                <p-tag severity="secondary" value="Cancelada" [styleClass]="stamp" />
                                            } @else if (activity.hasCallUp) {
                                                @if (activities.confirmations().get(activity.id); as confirmed) {
                                                    <p-tag severity="info" [value]="confirmed.yes + '/' + confirmed.total" [styleClass]="stamp" [attr.aria-label]="confirmed.yes + ' de ' + confirmed.total + ' confirmados'" />
                                                } @else {
                                                    <p-tag severity="info" value="Convocada" [styleClass]="stamp" />
                                                }
                                            } @else if (!isPast(activity)) {
                                                <span class="text-sm text-muted-color">Por convocar</span>
                                            }
                                        </span>
                                    </a>
                                </li>
                            }
                        </ul>
                    </section>
                } @empty {
                    <p class="m-0 border-y border-(--p-content-border-color) py-8 text-muted-color">Ninguna actividad de ese tipo.</p>
                }
            }
        }

        <app-activity-form-drawer [open]="formOpen()" [places]="places()" [busy]="activities.busy()" [error]="formError()" (save)="create($event)" (newField)="fieldOpen.set(true)" (closed)="formOpen.set(false)" />
        <app-external-field-drawer [open]="fieldOpen()" [busy]="fields.busy()" [error]="fieldError()" [isTaken]="isFieldTaken" (save)="createField($event)" (closed)="fieldOpen.set(false)" />
        <p-confirmdialog />
    `
})
export class ActivitiesPage implements OnInit {
    protected readonly activities = inject(ActivitiesService);
    protected readonly fields = inject(ExternalFieldsService);
    private readonly messages = inject(MessageService);
    private readonly formDrawer = viewChild.required(ActivityFormDrawer);
    private readonly fieldDrawer = viewChild.required(ExternalFieldDrawer);

    protected readonly stamp = STAMP;
    protected readonly isPast = isPast;
    protected readonly whenOptions: { label: string; value: ActivitiesWhen }[] = [
        { label: 'Próximas', value: 'upcoming' },
        { label: 'Pasadas', value: 'past' }
    ];
    protected readonly typeOptions: { label: string; value: ActivityType | 'all' }[] = [
        { label: 'Tipo: todas', value: 'all' },
        { label: ACTIVITY_TYPE_LABELS.training, value: 'training' },
        { label: ACTIVITY_TYPE_LABELS.competition, value: 'competition' }
    ];

    protected readonly formOpen = signal(false);
    protected readonly fieldOpen = signal(false);
    protected readonly formError = signal<string | null>(null);
    protected readonly fieldError = signal<string | null>(null);
    protected readonly places = signal<PlaceGroups>({ venues: [], fields: [] });
    protected readonly isFieldTaken = (name: string) => this.fields.isNameTaken(name);

    ngOnInit(): void {
        void this.activities.load('upcoming');
    }

    protected time(activity: Activity): string {
        return timeLabel(fromInstant(activity.startsAt).time);
    }

    protected title(activity: Activity): string {
        return activityTitle(activity);
    }

    protected async openCreate(): Promise<void> {
        this.formError.set(null);

        try {
            await Promise.all([this.loadPlaces(), this.fields.load()]);
            this.formOpen.set(true);
        } catch (error) {
            this.toastError(error);
        }
    }

    protected async create(draft: ActivityDraft): Promise<void> {
        this.formError.set(null);

        try {
            const created = await this.activities.create(draft);
            this.formDrawer().markSaved();
            this.formOpen.set(false);
            this.messages.add({ severity: 'success', summary: created > 1 ? `Se crearon ${created} actividades.` : 'Actividad creada.', life: 4000 });
        } catch (error) {
            this.formError.set(error instanceof AppError && error.code === 'rule_violation' ? 'Revisa la fecha, las horas y el lugar: alguno ya no es válido.' : this.messageFor(error));
        }
    }

    /** «Nueva cancha» desde el formulario: se crea y queda elegida (CA-001 de HU-037). */
    protected async createField(input: ExternalFieldInput): Promise<void> {
        this.fieldError.set(null);

        try {
            const field = await this.fields.create(input);

            if (field) {
                this.fieldDrawer().markSaved();
                this.fieldOpen.set(false);
                await this.loadPlaces();
                this.formDrawer().selectPlace({ kind: 'field', id: field.id });
                this.messages.add({ severity: 'success', summary: 'Cancha creada.', life: 4000 });
            }
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                this.fieldDrawer().markTaken();
                return;
            }

            this.fieldError.set(this.messageFor(error));
        }
    }

    private async loadPlaces(): Promise<void> {
        this.places.set(await this.activities.placeOptions());
    }

    private toastError(error: unknown): void {
        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
    }

    private messageFor(error: unknown): string {
        return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
    }
}
