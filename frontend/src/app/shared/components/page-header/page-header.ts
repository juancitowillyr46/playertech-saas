import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Marca la acción principal que se proyecta en el encabezado de página. */
@Directive({ selector: '[appPageHeaderAction]' })
export class PageHeaderAction {}

/**
 * Encabezado común de las páginas internas (spec 003, FR-014; contracts/ui-contracts.md):
 * título en un único `<h1>`, descripción opcional y acción principal opcional.
 * En el celular la acción flota sobre la navegación inferior, al alcance del pulgar; en escritorio,
 * a la derecha del título; `_main.scss` reserva su alto al final de la página.
 * El filete grueso de tinta es la firma de la planilla.
 */
@Component({
    selector: 'app-page-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="mb-5 flex items-end gap-4 border-b-2 border-(--p-text-color) pb-3">
            <div class="min-w-0 flex-1">
                <h1 class="m-0">{{ title() }}</h1>
                @if (description(); as text) {
                    <p class="m-0 mt-1 text-muted-color">{{ text }}</p>
                }
            </div>
            <div
                class="page-header-action fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 shadow-[0_6px_16px_-4px_rgb(0_0_0/0.3)] empty:hidden lg:static lg:z-auto lg:shrink-0 lg:shadow-none"
            >
                <ng-content select="[appPageHeaderAction]" />
            </div>
        </div>
    `,
    host: { class: 'contents' }
})
export class PageHeader {
    readonly title = input.required<string>();
    readonly description = input<string>();
}
