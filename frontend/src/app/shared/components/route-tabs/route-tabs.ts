import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { filter, map, startWith } from 'rxjs';

export interface RouteTab {
    readonly label: string;
    readonly route: string;
}

/**
 * Pestañas enlazadas a rutas hijas, con su `router-outlet` (Jugadores | Grupos, spec 009;
 * Actividades | Canchas, spec 011). La activa es la de ruta más larga que coincide con la URL.
 */
@Component({
    selector: 'app-route-tabs',
    imports: [RouterLink, RouterOutlet, TabsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-tabs [value]="active()" class="mb-5 block">
            <p-tablist>
                @for (tab of tabs(); track tab.route) {
                    <p-tab [value]="tab.route" [routerLink]="tab.route">{{ tab.label }}</p-tab>
                }
            </p-tablist>
        </p-tabs>
        <router-outlet />
    `
})
export class RouteTabs {
    private readonly router = inject(Router);

    readonly tabs = input.required<readonly RouteTab[]>();

    private readonly url = toSignal(
        this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            startWith(null),
            map(() => this.router.url)
        ),
        { initialValue: this.router.url }
    );

    protected readonly active = computed(() => {
        const url = this.url();
        const matches = this.tabs().filter((tab) => url === tab.route || url.startsWith(`${tab.route}/`) || url.startsWith(`${tab.route}?`));

        return matches.sort((a, b) => b.route.length - a.route.length)[0]?.route ?? this.tabs()[0]?.route;
    });
}
