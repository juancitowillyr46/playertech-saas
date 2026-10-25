import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
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
import { dayLabel, fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { AbsenceSection } from '../../../absences/components/absence-section/absence-section';
import { CallUpSection } from '../../../call-ups/components/call-up-section/call-up-section';
import { ActivityFormDrawer } from '../../components/activity-form-drawer/activity-form-drawer';
import { ExternalFieldDrawer } from '../../components/external-field-drawer/external-field-drawer';
import { Activity, activityTitle, ExternalFieldInput, isPast } from '../../models/activity.models';
import { ActivitiesService, ActivityDraft, PlaceGroups, toActivityInput } from '../../services/activities.service';
import { ExternalFieldsService } from '../../services/external-fields.service';

const STAMP = 'border-2 border-current uppercase tracking-wider';

type DetailStatus = 'loading' | 'ready' | 'not_found' | 'error';

/**
 * Detalle de una actividad (spec 011; CA-004 de HU-006 y HU-036). Una próxima se edita,
 * cancela o reactiva; una pasada solo se elimina (la base de datos lo garantiza).
 */
@Component({
    selector: 'app-activity-page',
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, MenuModule, MessageModule, SkeletonModule, TagModule, ActivityFormDrawer, ExternalFieldDrawer, CallUpSection, AbsenceSection],
    providers: [ActivitiesService, ExternalFieldsService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <a routerLink="/activities" class="mb-3 inline-flex min-h-11 items-center gap-2 text-color no-underline"><i class="pi pi-arrow-left" aria-hidden="true"></i>Actividades</a>

        @switch (status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando actividad">
                    <p-skeleton height="2.5rem" width="70%" />
                    <p-skeleton height="10rem" />
                </div>
            }
            @case ('not_found') {
                <p-message severity="warn" styleClass="mb-4">Esta actividad ya no existe.</p-message>
                <p-button label="Ver actividades" [outlined]="true" (onClick)="backToList()" />
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar la actividad. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="load()" />
            }
            @default {
                @if (activity(); as current) {
                    <div class="mb-4 flex items-end gap-3 border-b-2 border-(--p-text-color) pb-3">
                        <h1 class="m-0 min-w-0 flex-1 break-words">{{ title() }}</h1>
                        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Más acciones de la actividad" (onClick)="menu.toggle($event)" />
                    </div>

                    @if (past()) {
                        <p-message severity="info" styleClass="mb-4">Esta actividad ya pasó: no se puede modificar.</p-message>
                    }
                    @if (current.status === 'cancelled') {
                        <p-tag severity="secondary" value="Cancelada" [styleClass]="stamp + ' mb-4'" />
                    }

                    <dl class="m-0 mb-5 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-3">
                        <dt class="text-muted-color">Fecha</dt>
                        <dd class="m-0 font-semibold">{{ date() }}</dd>
                        @if (current.callAt) {
                            <dt class="text-muted-color">Citación</dt>
                            <dd class="m-0">{{ time(current.callAt) }}</dd>
                        }
                        <dt class="text-muted-color">{{ current.endsAt ? 'Inicio · fin' : 'Inicio' }}</dt>
                        <dd class="m-0">
                            {{ time(current.startsAt) }}
                            @if (current.endsAt) {
                                – {{ time(current.endsAt) }}
                            }
                        </dd>
                        @if (current.tournament) {
                            <dt class="text-muted-color">Torneo</dt>
                            <dd class="m-0">{{ current.tournament }}</dd>
                        }
                        <dt class="text-muted-color">Lugar</dt>
                        <dd class="m-0">
                            <span class="font-semibold">{{ current.place.name }}</span>
                            @if (placeDetails(); as details) {
                                <span class="block text-muted-color">{{ details }}</span>
                            }
                        </dd>
                        @if (current.notes) {
                            <dt class="text-muted-color">Observaciones</dt>
                            <dd class="m-0 break-words whitespace-pre-line">{{ current.notes }}</dd>
                        }
                    </dl>

                    @if (!past()) {
                        <div class="flex gap-2">
                            @if (current.status === 'scheduled') {
                                <p-button label="Editar" icon="pi pi-pencil" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="activities.busy()" (onClick)="openEdit()" />
                                <p-button label="Cancelar" ariaLabel="Cancelar actividad" icon="pi pi-ban" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="activities.busy()" (onClick)="confirmCancel()" />
                            } @else {
                                <p-button label="Reactivar" icon="pi pi-replay" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="activities.busy()" (onClick)="reactivate()" />
                            }
                        </div>
                    }

                    <app-call-up-section [activity]="current" />
                    <app-absence-section [activity]="current" />

                    <app-activity-form-drawer [open]="editOpen()" [activity]="current" [places]="places()" [busy]="activities.busy()" [error]="formError()" (save)="update($event)" (newField)="fieldOpen.set(true)" (closed)="editOpen.set(false)" />
                    <app-external-field-drawer [open]="fieldOpen()" [busy]="fields.busy()" [error]="fieldError()" [isTaken]="isFieldTaken" (save)="createField($event)" (closed)="fieldOpen.set(false)" />
                }
            }
        }

        <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body" />
        <p-confirmdialog />
    `
})
export class ActivityPage implements OnInit {
    protected readonly activities = inject(ActivitiesService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly router = inject(Router);
    protected readonly fields = inject(ExternalFieldsService);
    private readonly editDrawer = viewChild(ActivityFormDrawer);
    private readonly fieldDrawer = viewChild(ExternalFieldDrawer);
    private readonly callUpSection = viewChild(CallUpSection);

    /** Parámetro `:id` de la ruta. */
    readonly id = input.required<string>();

    protected readonly stamp = STAMP;
    protected readonly activity = signal<Activity | null>(null);
    protected readonly status = signal<DetailStatus>('loading');
    protected readonly editOpen = signal(false);
    protected readonly formError = signal<string | null>(null);
    protected readonly places = signal<PlaceGroups>({ venues: [], fields: [] });
    protected readonly fieldOpen = signal(false);
    protected readonly fieldError = signal<string | null>(null);
    protected readonly isFieldTaken = (name: string) => this.fields.isNameTaken(name);

    protected readonly past = computed(() => {
        const current = this.activity();

        return !!current && isPast(current);
    });
    protected readonly title = computed(() => (this.activity() ? activityTitle(this.activity()!) : ''));
    protected readonly date = computed(() => (this.activity() ? dayLabel(fromInstant(this.activity()!.startsAt).date, todayInColombia()) : ''));
    protected readonly placeDetails = computed(() => {
        const place = this.activity()?.place;

        return place ? [place.address, place.city, place.directions].filter(Boolean).join(' · ') : '';
    });

    protected readonly menuItems: MenuItem[] = [{ label: 'Eliminar actividad', icon: 'pi pi-trash', command: () => this.confirmRemove() }];

    ngOnInit(): void {
        void this.load();
    }

    async load(): Promise<void> {
        try {
            this.activity.set(await this.activities.get(this.id()));
            this.status.set('ready');
        } catch (error) {
            this.status.set(error instanceof AppError && error.code === 'not_found' ? 'not_found' : 'error');
        }
    }

    protected time(iso: string): string {
        return timeLabel(fromInstant(iso).time);
    }

    protected backToList(): void {
        void this.router.navigate(['/activities']);
    }

    protected async openEdit(): Promise<void> {
        this.formError.set(null);

        try {
            const [places] = await Promise.all([this.activities.placeOptions(), this.fields.load()]);
            this.places.set(places);
            this.editOpen.set(true);
        } catch (error) {
            this.toastError(error);
        }
    }

    protected async update(draft: ActivityDraft): Promise<void> {
        this.formError.set(null);
        const before = this.activity();
        const section = this.callUpSection();

        // La base de datos rechaza mover el inicio antes de la fecha límite de una convocatoria abierta.
        if (section?.deadlineConflicts(toActivityInput(draft).startsAt)) {
            this.formError.set('La fecha límite de la convocatoria quedaría después del inicio: cámbiala primero.');
            return;
        }

        const callUpOpen = !!section?.isOpen();

        try {
            await this.activities.update(this.id(), draft);
            this.editDrawer()?.markSaved();
            this.editOpen.set(false);
            await this.load();
            this.notify('Cambios guardados.');

            const after = this.activity();

            // Aviso de cambio solo si cambian la fecha, la hora o el lugar (HU-038).
            if (callUpOpen && before && after && (before.startsAt !== after.startsAt || before.callAt !== after.callAt || before.place.id !== after.place.id)) {
                await section!.offerNotice({ kind: 'change', before, after });
            }
        } catch (error) {
            this.formError.set(error instanceof AppError && error.code === 'rule_violation' ? 'Revisa la fecha, las horas y el lugar: alguno ya no es válido, o la actividad ya empezó.' : this.messageFor(error));
        }
    }

    /** «Nueva cancha» desde el formulario de edición: se crea y queda elegida (CA-001 de HU-037). */
    protected async createField(input: ExternalFieldInput): Promise<void> {
        this.fieldError.set(null);

        try {
            const field = await this.fields.create(input);

            if (field) {
                this.fieldDrawer()?.markSaved();
                this.fieldOpen.set(false);
                this.places.set(await this.activities.placeOptions());
                this.editDrawer()?.selectPlace({ kind: 'field', id: field.id });
                this.notify('Cancha creada.');
            }
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                this.fieldDrawer()?.markTaken();
                return;
            }

            this.fieldError.set(this.messageFor(error));
        }
    }

    protected confirmCancel(): void {
        this.confirmation.confirm({
            header: '¿Cancelar la actividad?',
            message: 'Seguirá en el listado marcada como cancelada, y podrás reactivarla.',
            acceptLabel: 'Cancelar actividad',
            rejectLabel: 'Volver',
            rejectButtonProps: { outlined: true },
            accept: () => void this.changeStatus('cancelled', 'Actividad cancelada.')
        });
    }

    protected reactivate(): Promise<void> {
        return this.changeStatus('scheduled', 'Actividad reactivada.');
    }

    private async changeStatus(status: 'scheduled' | 'cancelled', success: string): Promise<void> {
        const section = this.callUpSection();
        const callUpOpen = status === 'cancelled' && !!section?.isOpen();

        try {
            await this.activities.setStatus(this.id(), status);
            await this.load();
            this.notify(success);

            // Cancelar cierra la convocatoria (base de datos); se ofrece el aviso (HU-038).
            const current = this.activity();

            if (callUpOpen && current) {
                await section!.offerNotice({ kind: 'cancel', activity: current });
            }
        } catch (error) {
            await this.load();
            this.toastError(error);
        }
    }

    private confirmRemove(): void {
        const current = this.activity();

        if (!current) {
            return;
        }

        this.confirmation.confirm({
            header: `¿Eliminar «${activityTitle(current)}»?`,
            message: `${this.date()}, ${this.time(current.startsAt)}. Dejará de aparecer en PlayerTech; esta acción no se puede deshacer desde la aplicación.`,
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () =>
                void (async () => {
                    try {
                        await this.activities.remove(this.id());
                        this.notify('Actividad eliminada.');
                        this.backToList();
                    } catch (error) {
                        this.toastError(error);
                    }
                })()
        });
    }

    private notify(summary: string): void {
        this.messages.add({ severity: 'success', summary, life: 4000 });
    }

    private toastError(error: unknown): void {
        const detail = error instanceof AppError && error.code === 'rule_violation' ? 'La actividad ya empezó: no se puede modificar.' : this.messageFor(error);

        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail, life: 6000 });
    }

    private messageFor(error: unknown): string {
        return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
    }
}
