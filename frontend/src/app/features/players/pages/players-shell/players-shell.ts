import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteTab, RouteTabs } from '../../../../shared/components/route-tabs/route-tabs';

/** Jugadores › pestañas Jugadores y Grupos (opción B de navegación aprobada, ui-contracts.md). */
@Component({
    selector: 'app-players-shell',
    imports: [RouteTabs],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<app-route-tabs [tabs]="tabs" />`
})
export class PlayersShell {
    protected readonly tabs: readonly RouteTab[] = [
        { label: 'Jugadores', route: '/players' },
        { label: 'Grupos', route: '/players/groups' }
    ];
}
