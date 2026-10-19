import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { PageHeader, PageHeaderAction } from '../../../../shared/components/page-header/page-header';
import { ExternalFieldDrawer } from '../../components/external-field-drawer/external-field-drawer';
import { ExternalField, ExternalFieldInput } from '../../models/activity.models';
import { ExternalFieldsService } from '../../services/external-fields.service';

/** Pestaña Canchas (spec 011, HU-037): catálogo de canchas externas con editar y retirar. */
@Component({
    selector: 'app-fields-page',
    imports: [ButtonModule, ConfirmDialogModule, MenuModule, MessageModule, SkeletonModule, PageHeader, PageHeaderAction, ExternalFieldDrawer],
    providers: [ExternalFieldsService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Canchas" description="Las canchas donde juegan torneos. Las sedes se gestionan en Sedes.">
            <p-button appPageHeaderAction label="Nueva cancha" icon="pi pi-plus" [disabled]="fields.busy()" (onClick)="openDrawer(null)" />
        </app-page-header>

        @switch (fields.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando canchas">
                    @for (row of [1, 2]; track row) {
                        <p-skeleton height="3.75rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar las canchas. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="fields.load()" />
            }
            @case ('empty') {
                <div class="border-y border-(--p-content-border-color) py-8">
                    <p class="m-0 text-lg font-semibold">Aún no hay canchas.</p>
                    <p class="m-0 mt-1 text-muted-color">Agrégalas aquí o desde el formulario de una actividad.</p>
                </div>
            }
            @default {
                <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Canchas de la academia">
                    @for (field of fields.fields(); track field.id) {
                        <li class="flex min-h-15 items-center gap-3 border-b border-(--p-content-border-color) py-2 pl-1">
                            <div class="min-w-0 flex-1">
                                <p class="m-0 truncate font-semibold">{{ field.name }}</p>
                                <p class="m-0 truncate text-sm text-muted-color">{{ field.city ?? 'Sin ciudad' }}</p>
                            </div>
                            <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'Acciones de ' + field.name" (onClick)="openMenu($event, field, menu)" />
                        </li>
                    }
                </ul>
            }
        }

        <p-menu #menu [model]="menuItems()" [popup]="true" appendTo="body" />
        <app-external-field-drawer [open]="drawerOpen()" [field]="editing()" [busy]="fields.busy()" [error]="formError()" [isTaken]="isTaken" (save)="save($event)" (closed)="drawerOpen.set(false)" />
        <p-confirmdialog />
    `
})
export class FieldsPage implements OnInit {
    protected readonly fields = inject(ExternalFieldsService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly drawer = viewChild.required(ExternalFieldDrawer);

    protected readonly drawerOpen = signal(false);
    protected readonly editing = signal<ExternalField | null>(null);
    protected readonly formError = signal<string | null>(null);
    private readonly menuField = signal<ExternalField | null>(null);
    protected readonly isTaken = (name: string) => this.fields.isNameTaken(name, this.editing()?.id);

    protected readonly menuItems = computed<MenuItem[]>(() => {
        const field = this.menuField();

        return field
            ? [
                  { label: 'Editar', icon: 'pi pi-pencil', command: () => this.openDrawer(field) },
                  { label: 'Retirar', icon: 'pi pi-trash', command: () => this.confirmRetire(field) }
              ]
            : [];
    });

    ngOnInit(): void {
        void this.fields.load();
    }

    protected openMenu(event: Event, field: ExternalField, menu: Menu): void {
        if (!this.fields.busy()) {
            this.menuField.set(field);
            menu.toggle(event);
        }
    }

    protected openDrawer(field: ExternalField | null): void {
        this.editing.set(field);
        this.formError.set(null);
        this.drawerOpen.set(true);
    }

    protected async save(input: ExternalFieldInput): Promise<void> {
        const editing = this.editing();
        this.formError.set(null);

        try {
            if (editing) {
                await this.fields.update(editing.id, input);
            } else {
                await this.fields.create(input);
            }

            this.drawer().markSaved();
            this.drawerOpen.set(false);
            this.messages.add({ severity: 'success', summary: editing ? 'Cambios guardados.' : 'Cancha creada.', life: 4000 });
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                this.drawer().markTaken();
                return;
            }

            this.formError.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }

    private confirmRetire(field: ExternalField): void {
        this.confirmation.confirm({
            header: `¿Retirar «${field.name}»?`,
            message: 'Dejará de ofrecerse como lugar. Las actividades que ya la usan la conservan.',
            acceptLabel: 'Retirar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () =>
                void (async () => {
                    try {
                        await this.fields.retire(field.id);
                        this.messages.add({ severity: 'success', summary: 'Cancha retirada.', life: 4000 });
                    } catch (error) {
                        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: error instanceof AppError ? error.message : ERROR_MESSAGES.unknown, life: 6000 });
                    }
                })()
        });
    }
}
