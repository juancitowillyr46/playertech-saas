import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página propia para direcciones inexistentes (FR-023). */
@Component({
    selector: 'app-not-found-page',
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="min-h-screen flex items-center justify-center px-4 bg-surface-0 dark:bg-surface-950">
            <div class="max-w-md text-center">
                <span class="block text-2xl font-bold text-primary mb-10">PlayerTech</span>
                <p class="text-6xl font-bold text-primary m-0 mb-4">404</p>
                <h1 class="text-2xl font-semibold m-0 mb-4">Página no encontrada</h1>
                <p class="text-muted-color m-0 mb-8">La dirección que abriste no existe o cambió.</p>
                <a routerLink="/home" class="inline-block py-4 text-primary font-medium">Volver al inicio</a>
            </div>
        </main>
    `
})
export class NotFoundPage {}
