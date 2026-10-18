import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { FieldA11y, fieldA11y } from '../../../../shared/forms/field-a11y';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { AcademyProfileInput } from '../../models/academy-profile.models';
import { AcademyProfileService } from '../../services/academy-profile.service';
import { LOGO_FILE_MESSAGES } from '../../validators/logo-file';

type Field = 'name' | 'contactEmail';

/** El nombre es obligatorio aunque se escriban solo espacios (CA-003 de HU-017). */
function requiredTrimmed(control: AbstractControl<string>): ValidationErrors | null {
    return control.value?.trim() ? null : { required: true };
}

/**
 * Perfil de la academia (spec 007; HU-017): datos de identificación y contacto, plan de solo
 * consulta y logo. La pantalla solo usa AcademyProfileService; la escritura la autoriza RLS.
 */
@Component({
    selector: 'app-academy-profile-page',
    imports: [ReactiveFormsModule, RouterLink, ButtonModule, ConfirmDialogModule, InputTextModule, MessageModule, SkeletonModule, PageHeader, InitialsPipe],
    providers: [AcademyProfileService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Academia" description="Identificación y contacto de tu academia." />

        @switch (profile.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando la academia">
                    @for (row of [1, 2, 3, 4]; track row) {
                        <p-skeleton height="3.5rem" />
                    }
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar los datos de la academia. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="reload()" />
            }
            @default {
                @if (profile.profile(); as data) {
                    <section aria-labelledby="logo-title" class="mb-6 border-b border-(--p-content-border-color) pb-6">
                        <h2 id="logo-title" class="m-0 mb-4 text-xl">Logo</h2>
                        <div class="flex items-center gap-4">
                            @if (data.logoUrl) {
                                <img [src]="data.logoUrl" [alt]="'Logo de ' + data.academy.name" class="size-20 shrink-0 rounded-full border border-(--p-content-border-color) object-cover" />
                            } @else {
                                <span class="grid size-20 shrink-0 place-items-center rounded-full border-2 border-current text-xl font-extrabold tracking-wide" aria-hidden="true">{{ data.academy.name | initials }}</span>
                            }
                            <div class="flex min-w-0 flex-col items-start gap-1">
                                <input #logoInput type="file" accept="image/jpeg,image/png" class="sr-only" tabindex="-1" aria-hidden="true" (change)="onLogoSelected($event)" />
                                <p-button
                                    [label]="data.logo ? 'Cambiar logo' : 'Subir logo'"
                                    icon="pi pi-upload"
                                    [outlined]="true"
                                    [loading]="logoBusy()"
                                    [disabled]="profile.busy()"
                                    [ariaLabel]="(data.logo ? 'Cambiar logo' : 'Subir logo') + '. JPG o PNG, hasta 5 MB.'"
                                    (onClick)="logoInput.click()"
                                />
                                @if (data.logo) {
                                    <p-button label="Retirar logo" [text]="true" [disabled]="profile.busy()" (onClick)="confirmRemoveLogo()" />
                                }
                                <p class="m-0 text-sm text-muted-color">JPG o PNG, hasta 5 MB.</p>
                            </div>
                        </div>
                        @if (logoError(); as message) {
                            <p-message severity="error" variant="simple" size="small" styleClass="mt-3" role="alert">{{ message }}</p-message>
                        }
                    </section>

                    <dl class="m-0 mb-6 flex items-baseline gap-2">
                        <dt class="text-muted-color">Plan</dt>
                        <dd class="m-0 font-semibold">{{ data.planName ?? 'Sin plan' }}</dd>
                    </dl>

                    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-5" novalidate>
                        <div class="flex flex-col gap-2">
                            <label for="academyName" class="font-medium">Nombre de la academia</label>
                            <input pInputText id="academyName" formControlName="name" autocomplete="organization" class="w-full" [invalid]="invalid('name')" [attr.aria-invalid]="a11y('name')['aria-invalid']" [attr.aria-describedby]="a11y('name')['aria-describedby']" />
                            @if (invalid('name')) {
                                <p-message id="academyName-error" severity="error" variant="simple" size="small">Ingresa el nombre de la academia.</p-message>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="academyPhone" class="font-medium">Teléfono <span class="font-normal text-muted-color">(opcional)</span></label>
                            <input pInputText id="academyPhone" type="tel" formControlName="contactPhone" autocomplete="tel" class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="academyEmail" class="font-medium">Correo de contacto <span class="font-normal text-muted-color">(opcional)</span></label>
                            <input
                                pInputText
                                id="academyEmail"
                                type="email"
                                formControlName="contactEmail"
                                autocomplete="email"
                                class="w-full"
                                [invalid]="invalid('contactEmail')"
                                [attr.aria-invalid]="a11y('contactEmail')['aria-invalid']"
                                [attr.aria-describedby]="invalid('contactEmail') ? 'academyEmail-error' : 'academyEmail-help'"
                            />
                            <small id="academyEmail-help" class="text-muted-color">No cambia el correo con el que inicias sesión.</small>
                            @if (invalid('contactEmail')) {
                                <p-message id="academyEmail-error" severity="error" variant="simple" size="small">Ingresa un correo válido.</p-message>
                            }
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="academyAddress" class="font-medium">Dirección <span class="font-normal text-muted-color">(opcional)</span></label>
                            <input pInputText id="academyAddress" formControlName="address" autocomplete="street-address" class="w-full" aria-describedby="academyAddress-help" />
                            <small id="academyAddress-help" class="text-muted-color">
                                Dirección de contacto de la academia. Las de tus sedes se editan en
                                <a routerLink="/settings/venues" class="font-semibold text-primary underline underline-offset-4">Sedes</a>.
                            </small>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="academyCity" class="font-medium">Ciudad <span class="font-normal text-muted-color">(opcional)</span></label>
                            <input pInputText id="academyCity" formControlName="city" autocomplete="address-level2" class="w-full" />
                        </div>

                        <p-button type="submit" label="Guardar" [loading]="saving()" [disabled]="profile.busy() && !saving()" styleClass="w-full md:w-auto" />
                    </form>
                }
            }
        }

        <p-confirmdialog />
    `
})
export class AcademyProfilePage implements OnInit {
    protected readonly profile = inject(AcademyProfileService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);

    protected readonly form = inject(FormBuilder).nonNullable.group({
        name: ['', requiredTrimmed],
        contactPhone: [''],
        contactEmail: ['', Validators.email],
        address: [''],
        city: ['']
    });
    protected readonly submitted = signal(false);
    protected readonly saving = signal(false);
    protected readonly logoBusy = signal(false);
    protected readonly logoError = signal<string | null>(null);

    /** Estado de los campos; se recalcula con cada cambio del formulario. */
    private readonly formState = toSignal(this.form.events, { initialValue: null });
    private readonly invalidFields = computed(() => {
        this.formState();
        const controls = this.form.controls;
        const show = (field: Field) => controls[field].invalid && (controls[field].touched || this.submitted());

        return { name: show('name'), contactEmail: show('contactEmail') };
    });

    async ngOnInit(): Promise<void> {
        await this.reload();
    }

    protected async reload(): Promise<void> {
        await this.profile.load();
        this.resetForm();
    }

    protected invalid(field: Field): boolean {
        return this.invalidFields()[field];
    }

    protected a11y(field: Field): FieldA11y {
        return fieldA11y(field === 'name' ? 'academyName' : 'academyEmail', this.invalid(field));
    }

    protected async save(): Promise<void> {
        this.submitted.set(true);
        this.form.markAllAsTouched();

        if (this.form.invalid || this.profile.busy()) {
            return;
        }

        const value = this.form.getRawValue();
        const input: AcademyProfileInput = { name: value.name, contactEmail: value.contactEmail, contactPhone: value.contactPhone, address: value.address, city: value.city };

        this.saving.set(true);

        try {
            await this.profile.save(input);
            this.resetForm();
            this.messages.add({ severity: 'success', summary: 'Cambios guardados.', life: 4000 });
        } catch (error) {
            this.notifyError(error);

            if (error instanceof AppError && error.code === 'not_found') {
                this.resetForm();
            }
        } finally {
            this.saving.set(false);
        }
    }

    protected async onLogoSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        // Se limpia para que elegir el mismo archivo otra vez vuelva a disparar el cambio.
        input.value = '';

        if (!file) {
            return;
        }

        this.logoError.set(null);
        this.logoBusy.set(true);

        try {
            const problem = await this.profile.replaceLogo(file);

            if (problem) {
                this.logoError.set(LOGO_FILE_MESSAGES[problem]);
            } else {
                this.messages.add({ severity: 'success', summary: 'Logo actualizado.', life: 4000 });
            }
        } catch (error) {
            this.notifyError(error);
        } finally {
            this.logoBusy.set(false);
        }
    }

    /** Retirar deja la academia sin imagen: se confirma (spec 007, supuestos). */
    protected confirmRemoveLogo(): void {
        this.confirmation.confirm({
            header: '¿Retirar el logo?',
            message: 'Tu academia se mostrará con sus iniciales hasta que subas otro.',
            acceptLabel: 'Retirar',
            rejectLabel: 'Cancelar',
            rejectButtonProps: { outlined: true },
            accept: () => void this.removeLogo()
        });
    }

    /** Lo consulta el guard de salida: con cambios sin guardar, pide confirmación (FR-008). */
    canLeave(): boolean | Promise<boolean> {
        if (!this.form.dirty) {
            return true;
        }

        return new Promise((resolve) => {
            this.confirmation.confirm({
                header: 'Tienes cambios sin guardar',
                message: 'Si sales ahora, se perderán.',
                acceptLabel: 'Descartar',
                rejectLabel: 'Seguir editando',
                rejectButtonProps: { outlined: true },
                accept: () => resolve(true),
                reject: () => resolve(false)
            });
        });
    }

    private async removeLogo(): Promise<void> {
        this.logoError.set(null);
        this.logoBusy.set(true);

        try {
            await this.profile.removeLogo();
            this.messages.add({ severity: 'success', summary: 'Logo retirado.', life: 4000 });
        } catch (error) {
            this.notifyError(error);
        } finally {
            this.logoBusy.set(false);
        }
    }

    /** El formulario refleja lo guardado y queda sin cambios pendientes. */
    private resetForm(): void {
        const academy = this.profile.profile()?.academy;

        if (!academy) {
            return;
        }

        this.form.reset({
            name: academy.name,
            contactPhone: academy.contactPhone ?? '',
            contactEmail: academy.contactEmail ?? '',
            address: academy.address ?? '',
            city: academy.city ?? ''
        });
        this.submitted.set(false);
    }

    private notifyError(error: unknown): void {
        const detail = error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;

        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail, life: 6000 });
    }
}
