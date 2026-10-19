import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { filter, map, startWith } from 'rxjs';

const TABS = [
    { label: 'Jugadores', route: '/players' },
    { label: 'Grupos', route: '/players/groups' }
] as const;

/** Jugadores › pestañas Jugadores y Grupos (opción B de navegación aprobada, ui-contracts.md). */
@Component({
    selector: 'app-players-shell',
    imports: [RouterLink, RouterOutlet, TabsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-tabs [value]="active()" styleClass="mb-5">
            <p-tablist>
                @for (tab of tabs; track tab.route) {
                    <p-tab [value]="tab.route" [routerLink]="tab.route">{{ tab.label }}</p-tab>
                }
            </p-tablist>
        </p-tabs>
        <router-outlet />
    `
})
export class PlayersShell {
    private readonly router = inject(Router);

    protected readonly tabs = TABS;
    protected readonly active = toSignal(
        this.router.events.pipe(
            filter((event) => event instanceof NavigationEnd),
            startWith(null),
            map(() => (this.router.url.startsWith('/players/groups') ? '/players/groups' : '/players'))
        ),
        { initialValue: '/players' }
    );
}
