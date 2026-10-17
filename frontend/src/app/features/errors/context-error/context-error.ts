import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BrandMark } from '../../../shared/components/brand-mark/brand-mark';
import { AcademyContextService } from '../../../core/academy-context/academy-context.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';

/** No se pudo cargar la academia (caso límite de conexión de la spec 002). */
@Component({
    selector: 'app-context-error-page',
    imports: [ButtonModule, BrandMark],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="flex min-h-screen items-start justify-center bg-surface-0 px-4 pt-8 pb-10 md:items-center dark:bg-surface-950">
            <div class="w-full max-w-md">
                <app-brand-mark class="mb-10 block" size="lg" />
                <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">No pudimos cargar tu academia</h1>
                <p class="m-0 mb-6 text-muted-color">{{ message }}</p>
                <div class="flex flex-col gap-3 sm:flex-row">
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
