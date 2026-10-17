import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Aviso tras el registro, versión básica (Historia 7 de la spec 002). HU-014 la completa. */
@Component({
    selector: 'app-verify-email-page',
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <i class="pi pi-envelope text-4xl text-primary mb-4" aria-hidden="true"></i>
        <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Verifica tu correo</h1>
        <p class="m-0 mb-8 leading-relaxed">
            Te enviamos un enlace a <strong>{{ email || 'tu correo' }}</strong>. Ábrelo desde este mismo navegador para activar tu cuenta.
        </p>
        <a routerLink="/auth/login" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Ir a iniciar sesión</a>
    `
})
export class VerifyEmailPage {
    protected readonly email = inject(ActivatedRoute).snapshot.queryParamMap.get('email');
}
