import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout compartido de las pantallas públicas (docs/architecture/ui.md):
 * panel de marca en escritorio y solo el formulario en el celular.
 */
@Component({
    selector: 'app-auth-layout',
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="min-h-screen flex bg-surface-0 dark:bg-surface-950">
            <aside class="hidden md:flex md:w-5/12 lg:w-1/2 flex-col justify-between p-10 lg:p-16 bg-primary text-primary-contrast">
                <span class="text-2xl font-bold">PlayerTech</span>
                <div class="flex flex-col gap-6 max-w-md">
                    <h2 class="text-3xl lg:text-4xl font-semibold leading-tight m-0 text-primary-contrast">Tu academia organizada, desde el celular</h2>
                    <ul class="list-none p-0 m-0 flex flex-col gap-4 text-lg">
                        @for (benefit of benefits; track benefit) {
                            <li class="flex items-start gap-3">
                                <i class="pi pi-check-circle mt-1" aria-hidden="true"></i>
                                <span>{{ benefit }}</span>
                            </li>
                        }
                    </ul>
                </div>
                <span class="text-sm opacity-80">Academias deportivas · Colombia</span>
            </aside>

            <main class="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
                <div class="w-full max-w-md">
                    <span class="md:hidden block text-2xl font-bold text-primary mb-8">PlayerTech</span>
                    <router-outlet />
                </div>
            </main>
        </div>
    `
})
export class AuthLayout {
    protected readonly benefits = ['Jugadores, grupos y sedes en un solo lugar', 'Convocatorias a entrenamientos y competencias', 'Confirmaciones de los tutores sin perseguir a nadie'];
}
