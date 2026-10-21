import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { map } from 'rxjs';

/** Por debajo de `md` (768 px) el formulario ocupa toda la pantalla. */
const MOBILE_QUERY = '(max-width: 767.98px)';

let nextId = 0;

/**
 * Armazón de los formularios en drawer (patrón de página de gestión de ui.md, el de Sedes):
 * a la derecha en escritorio, a pantalla completa en el celular, con Cancelar y Guardar.
 * Cerrar con cambios sin guardar pide confirmación; la página provee ConfirmationService
 * y su `<p-confirmdialog>`.
 */
@Component({
    selector: 'app-form-drawer',
    imports: [ButtonModule, DrawerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-drawer
            [visible]="open()"
            position="right"
            [fullScreen]="isMobile()"
            [showCloseIcon]="false"
            [closeOnEscape]="false"
            [dismissible]="false"
            [blockScroll]="true"
            styleClass="w-full md:w-[30rem]"
            [pt]="{ root: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId } }"
        >
            <ng-template #header>
                <div class="flex w-full items-center justify-between gap-2">
                    <h2 [id]="titleId" class="m-0 text-xl">{{ title() }}</h2>
                    <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Cerrar" (onClick)="requestClose()" />
                </div>
            </ng-template>

            <ng-content />

            <ng-template #footer>
                <div class="flex gap-2">
                    <p-button [label]="cancelLabel()" [outlined]="true" styleClass="w-full" class="flex-1" (onClick)="requestClose()" />
                    <p-button [label]="saveLabel()" styleClass="w-full" class="flex-1" [loading]="busy()" [disabled]="saveDisabled()" (onClick)="save.emit()" />
                </div>
            </ng-template>
        </p-drawer>
    `
})
export class FormDrawer {
    private readonly confirmation = inject(ConfirmationService);

    readonly open = input.required<boolean>();
    readonly title = input.required<string>();
    readonly busy = input(false);
    /** Hay cambios sin guardar: cerrar pide confirmación. */
    readonly dirty = input(false);
    readonly saveLabel = input('Guardar');
    readonly cancelLabel = input('Cancelar');
    readonly saveDisabled = input(false);

    readonly save = output<void>();
    readonly closed = output<void>();

    protected readonly titleId = `form-drawer-title-${++nextId}`;
    protected readonly isMobile = toSignal(inject(BreakpointObserver).observe(MOBILE_QUERY).pipe(map((state) => state.matches)), { initialValue: false });

    protected requestClose(): void {
        if (!this.dirty()) {
            this.closed.emit();
            return;
        }

        this.confirmation.confirm({
            header: '¿Descartar los cambios?',
            message: 'Lo que escribiste en el formulario se perderá.',
            acceptLabel: 'Descartar',
            rejectLabel: 'Seguir editando',
            rejectButtonProps: { outlined: true },
            accept: () => this.closed.emit()
        });
    }
}
