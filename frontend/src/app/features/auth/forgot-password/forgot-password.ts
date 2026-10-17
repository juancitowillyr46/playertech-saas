import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { FieldA11y, fieldA11y } from '../forms/field-a11y';

/** Errores que sí se muestran: no revelan si la cuenta existe (DEC-12). */
const VISIBLE_ERRORS = new Set(['rate_limited', 'network']);

/** Solicitud de recuperación de contraseña, versión básica (Historia 7 de la spec 002). HU-016 la completa. */
@Component({
    selector: 'app-forgot-password-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <h1 class="text-3xl font-semibold m-0 mb-2">Recuperar contraseña</h1>
        <p class="text-muted-color m-0 mb-8">Te enviaremos un enlace para crear una nueva contraseña.</p>

        @if (sent()) {
            <p-message severity="success" styleClass="mb-6">
                Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Ábrelo desde este mismo navegador.
            </p-message>
        } @else {
            @if (errorMessage()) {
                <p-message severity="error" styleClass="mb-6">{{ errorMessage() }}</p-message>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5" novalidate>
                <div class="flex flex-col gap-2">
                    <label for="email" class="font-medium">Correo</label>
                    <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" [invalid]="emailInvalid()" [attr.aria-invalid]="emailA11y()['aria-invalid']" [attr.aria-describedby]="emailA11y()['aria-describedby']" />
                    @if (form.controls.email.touched && form.controls.email.hasError('required')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa tu correo.</p-message>
                    } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa un correo válido.</p-message>
                    }
                </div>

                <p-button type="submit" label="Enviar enlace" [loading]="submitting()" styleClass="w-full" />
            </form>
        }

        <p class="text-center mt-8 mb-0">
            <a routerLink="/auth/login" class="text-primary font-medium">Volver a iniciar sesión</a>
        </p>
    `
})
export class ForgotPasswordPage {
    private readonly auth = inject(AuthService);

    protected readonly form = inject(FormBuilder).nonNullable.group({
        email: ['', [Validators.required, Validators.email]]
    });
    protected readonly submitting = signal(false);
    protected readonly sent = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    protected emailInvalid(): boolean {
        return this.form.controls.email.touched && this.form.controls.email.invalid;
    }

    protected emailA11y(): FieldA11y {
        return fieldA11y('email', this.emailInvalid());
    }

    protected async submit(): Promise<void> {
        if (this.submitting()) {
            return;
        }

        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        this.submitting.set(true);
        this.errorMessage.set(null);

        try {
            await this.auth.requestPasswordReset(this.form.getRawValue().email.trim());
            this.sent.set(true);
        } catch (error) {
            if (error instanceof AppError && VISIBLE_ERRORS.has(error.code)) {
                this.errorMessage.set(error.message);
            } else {
                this.sent.set(true);
            }
        } finally {
            this.submitting.set(false);
        }
    }
}
