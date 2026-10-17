import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';

/** Academia suspendida: no puede operar y conserva sus datos (DEC-18, FR-022). */
@Component({
    selector: 'app-suspended-page',
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <i class="pi pi-pause-circle text-4xl text-primary mb-4" aria-hidden="true"></i>
        <h1 class="text-3xl font-semibold m-0 mb-4">Academia suspendida</h1>
        <p class="m-0 mb-8 leading-relaxed">Tu academia está suspendida. Tus datos se conservan. Escríbenos para reactivarla.</p>
        <p-button label="Cerrar sesión" icon="pi pi-sign-out" [outlined]="true" (onClick)="auth.signOut()" />
    `
})
export class SuspendedPage {
    protected readonly auth = inject(AuthService);
}
