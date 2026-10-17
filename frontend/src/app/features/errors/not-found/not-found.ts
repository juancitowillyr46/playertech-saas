import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMark } from '../../../shared/components/brand-mark/brand-mark';

/** Página propia para direcciones inexistentes (FR-023). */
@Component({
    selector: 'app-not-found-page',
    imports: [RouterLink, BrandMark],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="flex min-h-screen items-start justify-center bg-surface-0 px-4 pt-8 pb-10 md:items-center dark:bg-surface-950">
            <div class="w-full max-w-md">
                <app-brand-mark class="mb-10 block" size="lg" />
                <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Página no encontrada</h1>
                <p class="m-0 mb-6 text-muted-color">La dirección que abriste no existe o cambió.</p>
                <a routerLink="/home" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Volver al inicio</a>
            </div>
        </main>
    `
})
export class NotFoundPage {}
