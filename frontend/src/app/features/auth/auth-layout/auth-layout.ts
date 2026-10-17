import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandMark } from '../../../shared/components/brand-mark/brand-mark';

/**
 * Layout compartido de las pantallas públicas (docs/architecture/ui.md; spec 003,
 * dirección Planilla). Todo alineado a un solo borde izquierdo y anclado arriba en
 * el celular, para que el formulario no salte al abrir el teclado (observaciones
 * del responsable de producto, T043). En escritorio, panel de marca en tinta.
 */
@Component({
    selector: 'app-auth-layout',
    imports: [RouterOutlet, BrandMark],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex min-h-screen bg-surface-0 dark:bg-surface-950">
            <aside class="hidden flex-col justify-between bg-(--shell-background) p-12 text-(--shell-color) md:flex md:w-5/12 lg:w-1/2 lg:p-16">
                <app-brand-mark size="lg" tone="inverse" />
                <div class="max-w-md">
                    <p class="m-0 text-4xl leading-tight font-extrabold tracking-tight">Tu academia, en orden.</p>
                    <!-- Solo lo que PlayerTech ofrece hoy (PRODUCT.md: no se anuncian capacidades que aún no existen). -->
                    <ul class="m-0 mt-8 list-none border-t border-(--shell-rule) p-0 text-lg">
                        @for (benefit of benefits; track benefit) {
                            <li class="border-b border-(--shell-rule) py-4">{{ benefit }}</li>
                        }
                    </ul>
                </div>
                <span class="text-sm text-(--shell-muted-color)">Hecho para academias deportivas de Colombia</span>
            </aside>

            <main class="flex flex-1 items-start justify-center px-4 pt-8 pb-10 sm:px-8 md:items-center md:pt-10">
                <div class="w-full max-w-md">
                    <app-brand-mark class="mb-10 block md:hidden" size="lg" />
                    <router-outlet />
                </div>
            </main>
        </div>
    `
})
export class AuthLayout {
    protected readonly benefits = [
        'Los datos de tu academia y sus sedes, en un solo lugar',
        'Pensado para el celular, también en la cancha',
        'Tu información protegida y solo para tu academia'
    ];
}
