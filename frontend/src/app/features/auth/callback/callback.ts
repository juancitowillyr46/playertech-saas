import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';

type CallbackState = 'processing' | 'invalid' | 'other_browser';

/** Destinos permitidos para `next`: evita redirecciones abiertas (research R7). */
const ALLOWED_NEXT = ['/home', '/auth/reset-password'];

/**
 * Retorno de los enlaces de correo (verificación y recuperación) con el flujo
 * PKCE (FR-021; contracts/routes.md).
 */
@Component({
    selector: 'app-callback-page',
    imports: [RouterLink, ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @switch (state()) {
            @case ('processing') {
                <div class="flex flex-col items-start gap-4 py-10" role="status">
                    <p-progressSpinner strokeWidth="4" ariaLabel="Verificando" styleClass="w-12 h-12" />
                    <p class="m-0 text-lg">Verificando…</p>
                </div>
            }
            @case ('other_browser') {
                <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Abre el enlace en tu navegador</h1>
                <p class="m-0 mb-8 leading-relaxed">{{ messages.other_browser }}</p>
                <div class="flex flex-col">
                    <a routerLink="/auth/login" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Ir a iniciar sesión</a>
                    <a routerLink="/auth/forgot-password" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Solicitar un enlace nuevo</a>
                </div>
            }
            @default {
                <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Enlace no válido</h1>
                <p class="m-0 mb-8 leading-relaxed">{{ messages.link_invalid }}</p>
                <a routerLink="/auth/login" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Ir a iniciar sesión</a>
            }
        }
    `
})
export class CallbackPage implements OnInit {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

    protected readonly messages = ERROR_MESSAGES;
    protected readonly state = signal<CallbackState>('processing');

    ngOnInit(): void {
        void this.complete();
    }

    private async complete(): Promise<void> {
        const code = this.params.get('code');

        if (this.params.has('error') || this.params.has('error_code') || !code) {
            this.state.set('invalid');

            return;
        }

        try {
            await this.auth.completeEmailLink(code);
            await this.router.navigateByUrl(this.safeNext(), { replaceUrl: true });
        } catch (error) {
            this.state.set(error instanceof AppError && error.code === 'other_browser' ? 'other_browser' : 'invalid');
        }
    }

    private safeNext(): string {
        const next = this.params.get('next');

        return next && ALLOWED_NEXT.includes(next) ? next : '/home';
    }
}
