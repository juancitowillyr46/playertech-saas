import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { APP_NAVIGATION } from '@/app/core/navigation/navigation';
import { navigationBadge } from '@/app/core/notices/navigation-badge';
import { NoticesService } from '@/app/core/notices/notices.service';

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
    imports: [RouterLink, RouterLinkActive, OverlayBadgeModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <nav class="layout-bottomnav" aria-label="Navegación principal">
            <ul>
                @for (item of destinations; track item.label) {
                    <li>
                        <a class="layout-bottomnav-item" [routerLink]="item.routerLink" routerLinkActive="active-route" ariaCurrentWhenActive="page" [attr.aria-label]="badge(item)?.label ?? null">
                            <span class="layout-bottomnav-icon">
                                @if (badge(item); as count) {
                                    <p-overlaybadge [value]="count.value" severity="danger" size="small">
                                        <i [class]="item.icon" aria-hidden="true"></i>
                                    </p-overlaybadge>
                                } @else {
                                    <i [class]="item.icon" aria-hidden="true"></i>
                                }
                            </span>
                            <span>{{ item.label }}</span>
                        </a>
                    </li>
                }
            </ul>
        </nav>
    `
})
export class AppBottomnav {
    private readonly notices = inject(NoticesService);

    protected readonly destinations = primaryDestinations(APP_NAVIGATION);

    /** Contador de pendientes en «Actividades» (spec 014). */
    protected badge(item: MenuItem) {
        return navigationBadge(item, this.notices.pendingCount());
    }
}
