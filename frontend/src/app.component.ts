import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from './app/layout/service/layout.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToastModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-toast />
        <router-outlet />
    `
})
export class AppComponent {
    constructor() {
        // Aplica el modo claro/oscuro guardado desde el arranque, también en las
        // pantallas de acceso, que no usan el layout de la aplicación (FR-032).
        inject(LayoutService);
    }
}
