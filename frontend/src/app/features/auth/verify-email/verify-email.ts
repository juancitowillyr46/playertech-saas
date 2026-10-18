import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { FieldA11y, fieldA11y } from '../../../shared/forms/field-a11y';
import { RegistrationService } from '../services/registration.service';

/** Segundos entre reenvíos (FR-008 de la spec 006). */
const RESEND_WAIT_SECONDS = 60;

/**
 * Aviso tras el registro y reenvío del correo de verificación (HU-014, spec 006).
 * Llega con `?email=` desde el registro o desde el aviso de correo sin verificar; si se abre
 * sin él, pide el correo. El mensaje del reenvío es el mismo exista o no la cuenta (DEC-12).
 */
@Component({
    selector: 'app-verify-email-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <i class="pi pi-envelope text-4xl text-primary mb-4" aria-hidden="true"></i>
        <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Verifica tu correo</h1>
        <p class="m-0 mb-6 leading-relaxed">
            Te enviamos un enlace a <strong>{{ knownEmail || 'tu correo' }}</strong>. Ábrelo desde este mismo navegador para activar tu cuenta.
        </p>

        @if (sent()) {
            <p-message severity="info" styleClass="mb-6">Si tu cuenta está pendiente de verificar, te enviamos un enlace nuevo. Ábrelo desde este mismo navegador. Si ya la verificaste, inicia sesión.</p-message>
        }
        @if (errorMessage()) {
            <p-message severity="error" styleClass="mb-6">{{ errorMessage() }}</p-message>
        }

        <form [formGroup]="form" (ngSubmit)="resend()" class="flex flex-col gap-5" novalidate>
            @if (!knownEmail) {
                <div class="flex flex-col gap-2">
                    <label for="email" class="font-medium">Correo</label>
                    <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" [invalid]="emailInvalid()" [attr.aria-invalid]="emailA11y()['aria-invalid']" [attr.aria-describedby]="emailA11y()['aria-describedby']" />
                    @if (form.controls.email.touched && form.controls.email.hasError('required')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa tu correo.</p-message>
                    } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa un correo válido.</p-message>
                    }
                </div>
            }

            <p-button type="submit" [label]="resendLabel()" [outlined]="true" [loading]="submitting()" [disabled]="secondsLeft() > 0" styleClass="w-full" />
        </form>

        <div class="mt-6 border-t border-(--p-content-border-color) pt-5">
            <!-- Sin revelar si el correo ya tenía cuenta (HU-014 CA-005, DEC-12): orienta a quien sí la tiene. -->
            <p class="m-0 text-muted-color">¿Ya tienes una cuenta con este correo?</p>
            <div class="flex flex-col">
                <a routerLink="/auth/login" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Iniciar sesión</a>
                <a routerLink="/auth/forgot-password" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Recuperar mi contraseña</a>
            </div>
        </div>
    `
})
export class VerifyEmailPage {
    private readonly registration = inject(RegistrationService);

    protected readonly knownEmail = inject(ActivatedRoute).snapshot.queryParamMap.get('email');
    protected readonly form = inject(FormBuilder).nonNullable.group({
        email: [this.knownEmail ?? '', [Validators.required, Validators.email]]
    });
    protected readonly submitting = signal(false);
    protected readonly sent = signal(false);
    protected readonly errorMessage = signal<string | null>(null);
    // Quien llega con el correo acaba de recibir uno: el servidor rechazaría otro inmediato.
    protected readonly secondsLeft = signal(this.knownEmail ? RESEND_WAIT_SECONDS : 0);
    protected readonly resendLabel = computed(() => {
        const seconds = this.secondsLeft();

        return seconds > 0 ? `Reenviar en ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Reenviar correo';
    });

    constructor() {
        const timer = setInterval(() => this.secondsLeft.update((seconds) => Math.max(seconds - 1, 0)), 1000);

        inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }

    protected emailInvalid(): boolean {
        return this.form.controls.email.touched && this.form.controls.email.invalid;
    }

    protected emailA11y(): FieldA11y {
        return fieldA11y('email', this.emailInvalid());
    }

    protected async resend(): Promise<void> {
        if (this.submitting() || this.secondsLeft() > 0) {
            return;
        }

        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        this.submitting.set(true);
        this.sent.set(false);
        this.errorMessage.set(null);

        try {
            await this.registration.resendVerification(this.form.getRawValue().email.trim());
            this.sent.set(true);
            this.secondsLeft.set(RESEND_WAIT_SECONDS);
        } catch (error) {
            this.errorMessage.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        } finally {
            this.submitting.set(false);
        }
    }
}
