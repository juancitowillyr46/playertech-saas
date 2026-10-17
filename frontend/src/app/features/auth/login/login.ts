import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { FieldA11y, fieldA11y, passwordPt } from '../forms/field-a11y';

/**
 * Inicio de sesión (Historia 7 de la spec 002; rediseño Planilla de la spec 003).
 * Un solo borde izquierdo y la recuperación debajo de la acción principal (T043).
 * HU-001 la completa.
 */
@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, MessageModule, PasswordModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="mb-6 border-b-2 border-(--p-text-color) pb-4">
            <h1 class="m-0 text-3xl">Inicia sesión</h1>
            <p class="m-0 mt-2 text-muted-color">Entra para gestionar tu academia.</p>
        </div>

        @if (errorMessage()) {
            <p-message severity="error" styleClass="mb-6">{{ errorMessage() }}</p-message>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5" novalidate>
            <div class="flex flex-col gap-2">
                <label for="email" class="font-medium">Correo</label>
                <input
                    pInputText
                    id="email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    class="w-full"
                    [invalid]="invalid('email')"
                    [attr.aria-invalid]="a11y('email')['aria-invalid']"
                    [attr.aria-describedby]="a11y('email')['aria-describedby']"
                />
                @if (showError('email', 'required')) {
                    <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa tu correo.</p-message>
                } @else if (showError('email', 'email')) {
                    <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa un correo válido.</p-message>
                }
            </div>

            <div class="flex flex-col gap-2">
                <label for="password" class="font-medium">Contraseña</label>
                <p-password
                    inputId="password"
                    formControlName="password"
                    [feedback]="false"
                    [toggleMask]="true"
                    autocomplete="current-password"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    [invalid]="invalid('password')"
                    [pt]="passwordPt('password', invalid('password'))"
                />
                @if (showError('password', 'required')) {
                    <p-message id="password-error" severity="error" variant="simple" size="small">Ingresa tu contraseña.</p-message>
                }
            </div>

            <p-button type="submit" label="Iniciar sesión" [loading]="submitting()" styleClass="w-full mt-1" />
        </form>

        <div class="mt-4 flex flex-col items-start">
            <a routerLink="/auth/forgot-password" class="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</a>
            <p class="m-0 mt-4 self-stretch border-t border-(--p-content-border-color) pt-5 text-muted-color">
                ¿Aún no tienes cuenta?
                <a routerLink="/auth/register" class="font-semibold text-primary underline underline-offset-4">Registra tu academia</a>
            </p>
        </div>
    `
})
export class LoginPage {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly form = inject(FormBuilder).nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
    });
    protected readonly submitting = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    protected readonly passwordPt = passwordPt;

    protected showError(control: 'email' | 'password', error: string): boolean {
        const field = this.form.controls[control];

        return field.touched && field.hasError(error);
    }

    protected invalid(control: 'email' | 'password'): boolean {
        const field = this.form.controls[control];

        return field.touched && field.invalid;
    }

    protected a11y(control: 'email' | 'password'): FieldA11y {
        return fieldA11y(control, this.invalid(control));
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
            const { email, password } = this.form.getRawValue();

            await this.auth.signIn(email.trim(), password);
            await this.router.navigateByUrl(this.safeReturnUrl());
        } catch (error) {
            this.errorMessage.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        } finally {
            this.submitting.set(false);
        }
    }

    /** Solo rutas internas: evita redirecciones abiertas. */
    private safeReturnUrl(): string {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

        return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/home';
    }
}
