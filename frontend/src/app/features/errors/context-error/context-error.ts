import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';

/** No se pudo cargar la academia (caso límite de conexión de la spec 002). */
@Component({
    selector: 'app-context-error-page',
    imports: [ButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="min-h-screen flex items-center justify-center px-4 bg-surface-0 dark:bg-surface-950">
            <div class="max-w-md text-center">
                <span class="block text-2xl font-bold text-primary mb-10">PlayerTech</span>
                <i class="pi pi-wifi text-4xl text-primary mb-4" aria-hidden="true"></i>
                <h1 class="text-2xl font-semibold m-0 mb-4">No pudimos cargar tu academia</h1>
                <p class="text-muted-color m-0 mb-8">{{ message }}</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <p-button label="Reintentar" icon="pi pi-refresh" [loading]="retrying()" (onClick)="retry()" />
                    <p-button label="Cerrar sesión" [text]="true" (onClick)="auth.signOut()" />
                </div>
            </div>
        </main>
    `
})
export class ContextErrorPage {
    protected readonly auth = inject(AuthService);
    private readonly context = inject(AcademyContextService);
    private readonly router = inject(Router);

    protected readonly message = ERROR_MESSAGES.network;
    protected readonly retrying = signal(false);

    protected async retry(): Promise<void> {
        this.retrying.set(true);

        try {
            await this.context.reload();
            await this.router.navigateByUrl('/home');
        } finally {
            this.retrying.set(false);
        }
    }
}
