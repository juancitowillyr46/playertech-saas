import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { APP_NAVIGATION } from '@/app/core/navigation/navigation';
import { DEV_NAVIGATION } from '@/app/features/dev/dev-extras';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    /**
     * Menú definido por PlayerTech en core/navigation (ADR-015, FE-01). Las demos solo en
     * desarrollo: en producción DEV_NAVIGATION está vacío (dev-extras, FR-024).
     */
    readonly model: MenuItem[] = [...APP_NAVIGATION, ...DEV_NAVIGATION];
}
