import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AcademyContextService } from '@/app/core/academy-context/academy-context.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { LayoutService } from '@/app/layout/service/layout.service';
import { BrandMark } from '@/app/shared/components/brand-mark/brand-mark';
import { InitialsPipe } from '@/app/shared/pipes/initials.pipe';

/**
 * Barra superior de PlayerTech (docs/architecture/ui.md; spec 003, FR-012a).
 * En el celular es la barra de una app: la academia (iniciales y nombre) y el menú
 * de usuario; la navegación vive en la barra inferior. En escritorio: menú lateral,
 * marca y academia. El cambio de modo está en el menú de usuario. Sin configurador
 * de temas (ADR-015, FE-05).
 */
@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, MenuModule, BrandMark, InitialsPipe],
    template: ` <header class="layout-topbar">
        <div class="layout-topbar-main">
            <button type="button" class="layout-menu-button layout-topbar-action" aria-label="Abrir o cerrar el menú" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars" aria-hidden="true"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/home" aria-label="PlayerTech, ir al inicio">
                <app-brand-mark size="sm" tone="inverse" />
            </a>
            @if (academyName(); as name) {
                <span class="layout-topbar-academy-inline" [attr.title]="name">{{ name }}</span>
                <!-- En el celular, la academia ocupa el lugar de la marca: es el contexto que el owner necesita. -->
                <a class="layout-topbar-academy" routerLink="/home" [attr.title]="name" [attr.aria-label]="name + ', ir al inicio'">
                    <span class="layout-topbar-academy-badge" aria-hidden="true">{{ name | initials }}</span>
                    <span class="layout-topbar-academy-name">{{ name }}</span>
                </a>
            }

            <div class="layout-topbar-actions">
                <button type="button" class="layout-topbar-action" aria-label="Menú de usuario" aria-haspopup="true" (click)="userMenu.toggle($event)">
                    <span class="layout-topbar-avatar" aria-hidden="true">{{ initials() }}</span>
                </button>
                <p-menu #userMenu [model]="userMenuItems()" [popup]="true" appendTo="body">
                    <ng-template #start>
                        <div class="px-4 py-3 text-sm text-muted-color truncate">{{ email() }}</div>
                    </ng-template>
                </p-menu>
            </div>
        </div>
    </header>`
})
export class AppTopbar {
    protected readonly layoutService = inject(LayoutService);
    private readonly auth = inject(AuthService);
    private readonly academyContext = inject(AcademyContextService);

    protected readonly academyName = computed(() => this.academyContext.academy()?.name ?? null);
    protected readonly email = computed(() => this.auth.user()?.email ?? '');
    protected readonly initials = computed(() => this.email().charAt(0).toUpperCase() || '?');

    protected readonly userMenuItems = computed<MenuItem[]>(() => {
        const dark = this.layoutService.isDarkTheme();

        return [
            { label: dark ? 'Modo claro' : 'Modo oscuro', icon: dark ? 'pi pi-sun' : 'pi pi-moon', command: () => this.toggleDarkMode() },
            { separator: true },
            { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => void this.auth.signOut() }
        ];
    });

    protected toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
