import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { passwordPt } from '../forms/field-a11y';
import { MIN_PASSWORD_LENGTH, passwordsMatch } from '../validators/passwords-match';

/**
 * Nueva contraseña tras abrir el enlace de recuperación, versión básica
 * (Historia 7 de la spec 002). Usa la sesión temporal de recuperación. HU-016 la completa.
 */
@Component({
    selector: 'app-reset-password-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, MessageModule, PasswordModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <h1 class="m-0 mb-6 border-b-2 border-(--p-text-color) pb-4 text-3xl">Crea una nueva contraseña</h1>

        @if (!auth.isAuthenticated()) {
            <p class="m-0 mb-6">El enlace de recuperación ya no es válido.</p>
            <a routerLink="/auth/forgot-password" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Solicitar un enlace nuevo</a>
        } @else {
            <p class="text-muted-color m-0 mb-6">Elige una contraseña de al menos 8 caracteres.</p>

            @if (errorMessage()) {
                <p-message severity="error" styleClass="mb-6">{{ errorMessage() }}</p-message>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5" novalidate>
                <div class="flex flex-col gap-2">
                    <label for="password" class="font-medium">Nueva contraseña</label>
                    <p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="new-password" styleClass="w-full" inputStyleClass="w-full" [invalid]="invalid('password')" [pt]="passwordPt('password', invalid('password'))" />
                    @if (form.controls.password.touched && form.controls.password.invalid) {
                        <p-message id="password-error" severity="error" variant="simple" size="small">{{ passwordLengthMessage }}</p-message>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="passwordConfirmation" class="font-medium">Confirmar contraseña</label>
                    <p-password inputId="passwordConfirmation" formControlName="passwordConfirmation" [feedback]="false" [toggleMask]="true" autocomplete="new-password" styleClass="w-full" inputStyleClass="w-full" [invalid]="invalid('passwordConfirmation')" [pt]="passwordPt('passwordConfirmation', invalid('passwordConfirmation'))" />
                    @if (form.controls.passwordConfirmation.touched && form.hasError('passwordsMismatch')) {
                        <p-message id="passwordConfirmation-error" severity="error" variant="simple" size="small">Las contraseñas no coinciden.</p-message>
                    }
                </div>

                <p-button type="submit" label="Guardar contraseña" [loading]="submitting()" styleClass="w-full" />
            </form>
        }
    `
})
export class ResetPasswordPage {
    protected readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly passwordLengthMessage = ERROR_MESSAGES.weak_password;
    protected readonly form = inject(FormBuilder).nonNullable.group(
        {
            password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
            passwordConfirmation: ['']
        },
        { validators: passwordsMatch('password', 'passwordConfirmation') }
    );
    protected readonly submitting = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    protected readonly passwordPt = passwordPt;

    /** Inválido y ya tocado. La confirmación es inválida si no coincide con la contraseña. */
    protected invalid(control: 'password' | 'passwordConfirmation'): boolean {
        const field = this.form.controls[control];
        const mismatch = control === 'passwordConfirmation' && this.form.hasError('passwordsMismatch');

        return field.touched && (field.invalid || mismatch);
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
            await this.auth.updatePassword(this.form.getRawValue().password);
            await this.router.navigateByUrl('/home');
        } catch (error) {
            this.errorMessage.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        } finally {
            this.submitting.set(false);
        }
    }
}
