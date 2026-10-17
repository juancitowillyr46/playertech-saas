import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AcademyContextService } from '@/app/core/academy-context/academy-context.service';
import { AuthService } from '@/app/core/auth/auth.service';
import { LayoutService } from '@/app/layout/service/layout.service';

/**
 * Barra superior de PlayerTech (docs/architecture/ui.md): marca, academia actual,
 * modo claro/oscuro y menú de usuario. Sin configurador de temas (ADR-015, FE-05).
 */
@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, MenuModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container min-w-0">
            <button type="button" class="layout-menu-button layout-topbar-action" aria-label="Abrir o cerrar el menú" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars" aria-hidden="true"></i>
            </button>
            <!-- En el celular la academia reemplaza a la marca: es el dato que el owner necesita ver. -->
            <a class="layout-topbar-logo min-w-0" routerLink="/home">
                <span [class.hidden]="academyName()" [class.sm:inline]="academyName()">PlayerTech</span>
                @if (academyName(); as name) {
                    <span class="truncate text-base font-semibold sm:font-medium sm:text-muted-color sm:ml-2" [attr.title]="name">{{ name }}</span>
                }
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" [attr.aria-label]="layoutService.isDarkTheme() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" (click)="toggleDarkMode()">
                    <i class="pi" [class.pi-moon]="layoutService.isDarkTheme()" [class.pi-sun]="!layoutService.isDarkTheme()" aria-hidden="true"></i>
                </button>
                <button type="button" class="layout-topbar-action layout-topbar-action-highlight font-semibold" aria-label="Menú de usuario" aria-haspopup="true" (click)="userMenu.toggle($event)">
                    {{ initials() }}
                </button>
                <p-menu #userMenu [model]="userMenuItems" [popup]="true" appendTo="body">
                    <ng-template #start>
                        <div class="px-3 py-2 text-sm text-muted-color truncate">{{ email() }}</div>
                    </ng-template>
                </p-menu>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    protected readonly layoutService = inject(LayoutService);
    private readonly auth = inject(AuthService);
    private readonly academyContext = inject(AcademyContextService);

    protected readonly academyName = computed(() => this.academyContext.academy()?.name ?? null);
    protected readonly email = computed(() => this.auth.user()?.email ?? '');
    protected readonly initials = computed(() => this.email().charAt(0).toUpperCase() || '?');
    protected readonly userMenuItems: MenuItem[] = [{ label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => void this.auth.signOut() }];

    protected toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}
