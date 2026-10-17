import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AppError } from '../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../core/errors/error-messages';
import { CurrentLegalDocuments } from '../../../core/legal/models/legal.models';
import { checkboxPt, FieldA11y, fieldA11y, passwordPt } from '../forms/field-a11y';
import { RegistrationService } from '../services/registration.service';
import { MIN_PASSWORD_LENGTH, passwordsMatch } from '../validators/passwords-match';

/**
 * Registro de una academia (Historia 7 de la spec 002, FR-036; rediseño Planilla de la
 * spec 003). Campos agrupados en «Tu academia» y «Tu cuenta», un solo borde izquierdo
 * y la regla de la contraseña visible antes de equivocarse (T043). HU-014 la completa.
 */
@Component({
    selector: 'app-register-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, CheckboxModule, InputTextModule, MessageModule, PasswordModule, ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="mb-6 border-b-2 border-(--p-text-color) pb-4">
            <h1 class="m-0 text-3xl">Registra tu academia</h1>
            <p class="m-0 mt-2 text-muted-color">Crea tu academia y tu cuenta para administrarla. Es gratis.</p>
        </div>

        @if (loadError()) {
            <p-message severity="error" styleClass="mb-4">{{ loadError() }}</p-message>
            <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="loadLegalDocuments()" />
        } @else if (!legal()) {
            <div class="flex py-10">
                <p-progressSpinner strokeWidth="4" ariaLabel="Cargando" styleClass="w-12 h-12" />
            </div>
        } @else {
            @if (errorMessage()) {
                <p-message severity="error" styleClass="mb-6">{{ errorMessage() }}</p-message>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-5" novalidate>
                <h2 class="m-0 text-base">Tu academia</h2>
                <div class="flex flex-col gap-2">
                    <label for="academyName" class="font-medium">Nombre de la academia</label>
                    <input pInputText id="academyName" formControlName="academyName" autocomplete="organization" class="w-full" [invalid]="invalid('academyName')" [attr.aria-invalid]="a11y('academyName')['aria-invalid']" [attr.aria-describedby]="a11y('academyName')['aria-describedby']" />
                    @if (showError('academyName', 'required')) {
                        <p-message id="academyName-error" severity="error" variant="simple" size="small">Ingresa el nombre de la academia.</p-message>
                    }
                </div>

                <h2 class="m-0 mt-3 border-t border-(--p-content-border-color) pt-5 text-base">Tu cuenta</h2>
                <div class="flex flex-col gap-2">
                    <label for="fullName" class="font-medium">Tu nombre</label>
                    <input pInputText id="fullName" formControlName="fullName" autocomplete="name" class="w-full" [invalid]="invalid('fullName')" [attr.aria-invalid]="a11y('fullName')['aria-invalid']" [attr.aria-describedby]="a11y('fullName')['aria-describedby']" />
                    @if (showError('fullName', 'required')) {
                        <p-message id="fullName-error" severity="error" variant="simple" size="small">Ingresa tu nombre.</p-message>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="email" class="font-medium">Correo</label>
                    <input pInputText id="email" type="email" formControlName="email" autocomplete="email" class="w-full" [invalid]="invalid('email')" [attr.aria-invalid]="a11y('email')['aria-invalid']" [attr.aria-describedby]="a11y('email')['aria-describedby']" />
                    @if (showError('email', 'required')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa tu correo.</p-message>
                    } @else if (showError('email', 'email')) {
                        <p-message id="email-error" severity="error" variant="simple" size="small">Ingresa un correo válido.</p-message>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="password" class="font-medium">Contraseña</label>
                    <p-password inputId="password" formControlName="password" [feedback]="false" [toggleMask]="true" autocomplete="new-password" styleClass="w-full" inputStyleClass="w-full" [invalid]="invalid('password')" [pt]="passwordPt('password', invalid('password'))" />
                    @if (showError('password', 'required') || showError('password', 'minlength')) {
                        <p-message id="password-error" severity="error" variant="simple" size="small">{{ passwordLengthMessage }}</p-message>
                    } @else {
                        <small class="text-muted-color">Mínimo {{ minPasswordLength }} caracteres.</small>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <label for="passwordConfirmation" class="font-medium">Confirmar contraseña</label>
                    <p-password inputId="passwordConfirmation" formControlName="passwordConfirmation" [feedback]="false" [toggleMask]="true" autocomplete="new-password" styleClass="w-full" inputStyleClass="w-full" [invalid]="invalid('passwordConfirmation')" [pt]="passwordPt('passwordConfirmation', invalid('passwordConfirmation'))" />
                    @if (form.controls.passwordConfirmation.touched && form.hasError('passwordsMismatch')) {
                        <p-message id="passwordConfirmation-error" severity="error" variant="simple" size="small">Las contraseñas no coinciden.</p-message>
                    }
                </div>

                <div class="mt-3 flex flex-col gap-2 border-t border-(--p-content-border-color) pt-5">
                    <div class="flex min-h-11 items-center gap-3">
                        <p-checkbox inputId="acceptTerms" formControlName="acceptTerms" [binary]="true" [invalid]="invalid('acceptTerms')" [pt]="checkboxPt('acceptTerms', invalid('acceptTerms'))" />
                        <label for="acceptTerms" class="flex-1 py-2.5">
                            Acepto los
                            <a [href]="legal()!.terms.url" target="_blank" rel="noopener" class="font-semibold text-primary underline underline-offset-4">Términos y Condiciones</a>
                        </label>
                    </div>
                    @if (showError('acceptTerms', 'required')) {
                        <p-message id="acceptTerms-error" severity="error" variant="simple" size="small">Debes aceptar los Términos y Condiciones.</p-message>
                    }
                </div>

                <div class="flex flex-col gap-2">
                    <div class="flex min-h-11 items-center gap-3">
                        <p-checkbox inputId="acceptPrivacy" formControlName="acceptPrivacy" [binary]="true" [invalid]="invalid('acceptPrivacy')" [pt]="checkboxPt('acceptPrivacy', invalid('acceptPrivacy'))" />
                        <label for="acceptPrivacy" class="flex-1 py-2.5">
                            Acepto la
                            <a [href]="legal()!.privacyPolicy.url" target="_blank" rel="noopener" class="font-semibold text-primary underline underline-offset-4">Política de Tratamiento de Datos</a>
                        </label>
                    </div>
                    @if (showError('acceptPrivacy', 'required')) {
                        <p-message id="acceptPrivacy-error" severity="error" variant="simple" size="small">Debes aceptar la Política de Tratamiento de Datos.</p-message>
                    }
                </div>

                <p-button type="submit" label="Crear cuenta" [loading]="submitting()" styleClass="w-full mt-1" />
            </form>
        }

        <p class="m-0 mt-6 border-t border-(--p-content-border-color) pt-5 text-muted-color">
            ¿Ya tienes cuenta?
            <a routerLink="/auth/login" class="font-semibold text-primary underline underline-offset-4">Inicia sesión</a>
        </p>
    `
})
export class RegisterPage implements OnInit {
    private readonly registration = inject(RegistrationService);
    private readonly router = inject(Router);

    protected readonly passwordLengthMessage = ERROR_MESSAGES.weak_password;
    protected readonly minPasswordLength = MIN_PASSWORD_LENGTH;
    protected readonly form = inject(FormBuilder).nonNullable.group(
        {
            academyName: ['', Validators.required],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
            passwordConfirmation: [''],
            acceptTerms: [false, Validators.requiredTrue],
            acceptPrivacy: [false, Validators.requiredTrue]
        },
        { validators: passwordsMatch('password', 'passwordConfirmation') }
    );
    protected readonly legal = signal<CurrentLegalDocuments | null>(null);
    protected readonly loadError = signal<string | null>(null);
    protected readonly submitting = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    ngOnInit(): void {
        void this.loadLegalDocuments();
    }

    protected async loadLegalDocuments(): Promise<void> {
        this.loadError.set(null);

        try {
            this.legal.set(await this.registration.loadLegalDocuments());
        } catch (error) {
            this.loadError.set(toMessage(error));
        }
    }

    protected readonly passwordPt = passwordPt;
    protected readonly checkboxPt = checkboxPt;

    /** Inválido y ya tocado. La confirmación es inválida si no coincide con la contraseña. */
    protected invalid(control: keyof typeof this.form.controls): boolean {
        const field = this.form.controls[control];
        const mismatch = control === 'passwordConfirmation' && this.form.hasError('passwordsMismatch');

        return field.touched && (field.invalid || mismatch);
    }

    protected a11y(control: keyof typeof this.form.controls): FieldA11y {
        return fieldA11y(control, this.invalid(control));
    }

    protected showError(control: keyof typeof this.form.controls, error: string): boolean {
        const field = this.form.controls[control];

        return field.touched && field.hasError(error);
    }

    protected async submit(): Promise<void> {
        const legal = this.legal();

        if (this.submitting() || !legal) {
            return;
        }

        this.form.markAllAsTouched();

        if (this.form.invalid) {
            return;
        }

        this.submitting.set(true);
        this.errorMessage.set(null);

        try {
            const value = this.form.getRawValue();
            const email = value.email.trim();

            await this.registration.register({
                email,
                password: value.password,
                academyName: value.academyName.trim(),
                fullName: value.fullName.trim(),
                legalAcceptances: { terms: legal.terms.version, privacyPolicy: legal.privacyPolicy.version }
            });
            await this.router.navigateByUrl(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        } catch (error) {
            this.errorMessage.set(toMessage(error));
        } finally {
            this.submitting.set(false);
        }
    }
}

function toMessage(error: unknown): string {
    return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
}
