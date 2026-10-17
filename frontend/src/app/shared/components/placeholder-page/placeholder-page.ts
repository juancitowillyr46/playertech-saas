import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeader } from '../page-header/page-header';

/**
 * Marcador de una pantalla que construye una HU posterior (hoy, Configuración >
 * Academia, HU-017). Usa el encabezado común de página (spec 003, FR-014).
 */
@Component({
    selector: 'app-placeholder-page',
    imports: [PageHeader],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header [title]="title()" />
        <p class="m-0 text-muted-color">Disponible pronto.</p>
    `
})
export class PlaceholderPage {
    readonly title = input.required<string>();
}
