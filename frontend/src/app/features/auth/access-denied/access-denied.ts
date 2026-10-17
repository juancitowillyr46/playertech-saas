import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/auth/auth.service';

/** Usuario con sesión pero sin membresía activa (FR-022). */
@Component({
    selector: 'app-access-denied-page',
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <i class="pi pi-lock text-4xl text-primary mb-4" aria-hidden="true"></i>
        <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Sin acceso a una academia</h1>
        <p class="m-0 mb-8 leading-relaxed">Tu cuenta no tiene acceso a una academia. Si crees que es un error, escríbenos.</p>
        <p-button label="Cerrar sesión" icon="pi pi-sign-out" [outlined]="true" (onClick)="auth.signOut()" />
    `
})
export class AccessDeniedPage {
    protected readonly auth = inject(AuthService);
}
