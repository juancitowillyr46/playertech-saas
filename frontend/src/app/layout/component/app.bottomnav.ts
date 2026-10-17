import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { APP_NAVIGATION } from '@/app/core/navigation/navigation';

/** Destinos de primer nivel de APP_NAVIGATION, sin los grupos (General, Configuración). */
function primaryDestinations(navigation: MenuItem[]): MenuItem[] {
    return navigation.flatMap((group) => group.items ?? []).filter((item) => item.routerLink);
}

/**
 * Navegación inferior del celular (spec 003, FR-012a; contracts/ui-contracts.md):
 * los destinos principales al alcance del pulgar. Solo se ve por debajo de 992 px;
 * en escritorio navega el menú lateral. Las demos de desarrollo no aparecen aquí.
 */
@Component({
    selector: 'app-bottomnav',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <nav class="layout-bottomnav" aria-label="Navegación principal">
            <ul>
                @for (item of destinations; track item.label) {
                    <li>
                        <a class="layout-bottomnav-item" [routerLink]="item.routerLink" routerLinkActive="active-route" ariaCurrentWhenActive="page">
                            <span class="layout-bottomnav-icon"><i [class]="item.icon" aria-hidden="true"></i></span>
                            <span>{{ item.label }}</span>
                        </a>
                    </li>
                }
            </ul>
        </nav>
    `
})
export class AppBottomnav {
    protected readonly destinations = primaryDestinations(APP_NAVIGATION);
}
