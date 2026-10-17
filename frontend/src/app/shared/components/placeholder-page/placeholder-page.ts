import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Marcador de una pantalla que construye una HU posterior. Lo usan varias
 * features (inicio y configuración), por eso vive en `shared/`.
 */
@Component({
    selector: 'app-placeholder-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="card">
            <h1 class="text-2xl font-semibold m-0 mb-2">{{ title() }}</h1>
            <p class="text-muted-color m-0">Disponible pronto.</p>
        </div>
    `
})
export class PlaceholderPage {
    readonly title = input.required<string>();
}
