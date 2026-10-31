import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { debounceTime } from 'rxjs';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { LegalDocument } from '../../../../core/legal/models/legal.models';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { LegalDocumentDialog } from '../../../../shared/components/legal-document-dialog/legal-document-dialog';
import { checkboxPt, fieldA11y } from '../../../../shared/forms/field-a11y';
import { normalizePhone, PHONE_ERROR, phoneValidator } from '../../../../shared/forms/phone.validator';
import { Guardian, Relationship, RELATIONSHIP_LABELS } from '../../models/player.models';
import { PlayerDetailService } from '../../services/player-detail.service';

type Field = 'phone' | 'fullName' | 'relationship' | 'consent';

const ERRORS: Record<Field, Record<string, string>> = {
    phone: { required: 'Ingresa el celular del acudiente.', phone: PHONE_ERROR, taken: 'Ese celular ya es de otro acudiente.' },
    fullName: { required: 'Ingresa el nombre del acudiente.' },
    relationship: { required: 'Elige el parentesco.' },
    consent: { required: 'Confirma que el acudiente autorizó el tratamiento de sus datos.' }
};

function requiredTrimmed(control: AbstractControl<string>): ValidationErrors | null {
    return control.value?.trim() ? null : { required: true };
}

/**
 * Agregar o editar un acudiente del jugador (spec 009, HU-034). Usa PlayerDetailService,
 * que provee la ficha: avisa si el celular ya está registrado y guarda con la autorización
 * de datos (DEC-39). Al guardar emite el aviso de confirmación para la página.
 */
@Component({
    selector: 'app-guardian-drawer',
    imports: [ReactiveFormsModule, CheckboxModule, InputTextModule, MessageModule, RadioButtonModule, FormDrawer, LegalDocumentDialog],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="title()" [busy]="detail.busy()" [dirty]="form.dirty" [saveLabel]="guardian() ? 'Guardar' : 'Agregar acudiente'" (save)="submit()" (closed)="closed.emit()">
            @if (formError(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }

            <form [formGroup]="form" class="flex flex-col gap-5" novalidate (ngSubmit)="submit()">
                <div class="flex flex-col gap-2">
                    <label for="guardianPhone" class="font-medium">Celular</label>
                    <input
                        pInputText
                        id="guardianPhone"
                        type="tel"
                        inputmode="tel"
                        formControlName="phone"
                        autocomplete="off"
                        class="w-full"
                        [invalid]="!!errorOf('phone')"
                        [attr.aria-invalid]="a11y('phone')['aria-invalid']"
                        [attr.aria-describedby]="a11y('phone')['aria-describedby']"
                    />
                    @if (errorOf('phone'); as message) {
                        <p-message id="guardianPhone-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                    @if (existingName(); as name) {
                        <p-message severity="info" size="small" role="status">Este celular es de {{ name }}, ya registrado. Se vinculará a la misma persona.</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="guardianFullName" class="font-medium">Nombre completo</label>
                    <input
                        pInputText
                        id="guardianFullName"
                        formControlName="fullName"
                        maxlength="120"
                        autocomplete="off"
                        class="w-full"
                        [readonly]="!!existingName()"
                        [invalid]="!!errorOf('fullName')"
                        [attr.aria-invalid]="a11y('fullName')['aria-invalid']"
                        [attr.aria-describedby]="a11y('fullName')['aria-describedby']"
                    />
                    @if (errorOf('fullName'); as message) {
                        <p-message id="guardianFullName-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <fieldset class="m-0 flex flex-col gap-2 border-0 p-0" [attr.aria-describedby]="a11y('relationship')['aria-describedby']">
                    <legend class="mb-2 p-0 font-medium">Parentesco</legend>
                    <div class="grid grid-cols-2 gap-2">
                        @for (option of relationshipOptions; track option.value) {
                            <label [for]="'relationship-' + option.value" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-border border border-(--p-content-border-color) px-3">
                                <p-radiobutton formControlName="relationship" [value]="option.value" [inputId]="'relationship-' + option.value" />
                                <span>{{ option.label }}</span>
                            </label>
                        }
                    </div>
                    @if (errorOf('relationship'); as message) {
                        <p-message id="guardianRelationship-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </fieldset>
                @if (!guardian()) {
                    <div class="flex flex-col gap-2">
                        <div class="flex items-start gap-3">
                            <p-checkbox formControlName="consent" [binary]="true" inputId="guardianConsent" [pt]="consentPt()" />
                            <span class="leading-normal">
                                <label id="guardianConsent-label" for="guardianConsent">El acudiente autoriza el tratamiento de sus datos según la</label>&ngsp;
                                @if (policy(); as document) {
                                    <button id="guardianConsent-document" type="button" class="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary underline underline-offset-4" (click)="read(document)">
                                        Política de Tratamiento de Datos</button
                                    >.
                                } @else {
                                    <span id="guardianConsent-document">Política de Tratamiento de Datos</span>.
                                }
                            </span>
                        </div>
                        @if (errorOf('consent'); as message) {
                            <p-message id="guardianConsent-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                        }
                    </div>
                }
            </form>
        </app-form-drawer>

        <app-legal-document-dialog [document]="reading()" (closed)="reading.set(null)" />
    `
})
export class GuardianDrawer {
    protected readonly detail = inject(PlayerDetailService);

    readonly open = input.required<boolean>();
    /** Acudiente a editar; null para agregar. */
    readonly guardian = input<Guardian | null>(null);
    readonly playerName = input('');

    /** Guardado con éxito: el texto del aviso de confirmación. */
    readonly saved = output<string>();
    readonly closed = output<void>();

    protected readonly relationshipOptions = (Object.keys(RELATIONSHIP_LABELS) as Relationship[]).map((value) => ({ value, label: RELATIONSHIP_LABELS[value] }));
    protected readonly existingName = signal<string | null>(null);
    protected readonly formError = signal<string | null>(null);
    protected readonly policy = signal<LegalDocument | null>(null);
    /** Política abierta en el dialog (HU-043). */
    protected readonly reading = signal<LegalDocument | null>(null);

    protected readonly form = inject(FormBuilder).nonNullable.group({
        phone: ['', [Validators.required, phoneValidator]],
        fullName: ['', requiredTrimmed],
        relationship: ['' as Relationship | '', Validators.required],
        consent: [false, Validators.requiredTrue]
    });

    private readonly formState = toSignal(this.form.events, { initialValue: null });
    private submitted = false;

    protected readonly title = () => (this.guardian() ? 'Editar acudiente' : `Agregar acudiente${this.playerName() ? ' de ' + this.playerName() : ''}`);
    protected readonly consentPt = () => checkboxPt('guardianConsent', !!this.errorOf('consent'), 'guardianConsent-label guardianConsent-document');

    constructor() {
        effect(() => {
            // Solo `open` dispara el reinicio: las señales internas de PrimeNG que se leen al
            // reiniciar el formulario no deben volver a ejecutarlo (reiniciaba al elegir un valor).
            if (this.open()) {
                untracked(() => {
                    this.reset();
                });
            }
        });

        // Al agregar, un celular válido ya registrado se vincula a la misma persona (FR-011).
        this.form.controls.phone.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((value) => void this.lookUp(value));
    }

    protected errorOf(field: Field): string | null {
        this.formState();
        const control = this.form.controls[field];

        if (!control.invalid || !(control.touched || this.submitted)) {
            return null;
        }

        return ERRORS[field][Object.keys(control.errors ?? {})[0]] ?? null;
    }

    protected a11y(field: Field) {
        return fieldA11y(`guardian${field.charAt(0).toUpperCase()}${field.slice(1)}`, !!this.errorOf(field));
    }

    protected async submit(): Promise<void> {
        if (this.detail.busy()) {
            return;
        }

        const guardian = this.guardian();

        if (guardian) {
            this.form.controls.consent.disable();
        }

        this.submitted = true;
        this.form.markAllAsTouched();
        this.form.updateValueAndValidity();

        if (this.form.invalid) {
            return;
        }

        this.formError.set(null);
        const { phone, fullName, relationship } = this.form.getRawValue();
        const input = { phone, fullName, relationship: relationship as Relationship };

        try {
            if (guardian) {
                await this.detail.updateGuardian(guardian, input);
                this.done('Cambios guardados.');
            } else {
                const result = await this.detail.addGuardian(input);
                this.done(result.guardianExisted ? `${result.guardianName} quedó como acudiente.` : 'Acudiente agregado.');
            }
        } catch (error) {
            if (error instanceof AppError && error.code === 'duplicate') {
                if (guardian) {
                    this.form.controls.phone.setErrors({ taken: true });
                } else {
                    this.formError.set('Esta persona ya es acudiente de este jugador.');
                }

                return;
            }

            this.formError.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }

    private done(message: string): void {
        this.form.markAsPristine();
        this.saved.emit(message);
    }

    private async lookUp(value: string): Promise<void> {
        if (this.guardian() || this.form.controls.phone.invalid) {
            this.clearExisting();
            return;
        }

        try {
            const existing = await this.detail.findGuardianByPhone(normalizePhone(value));

            if (existing) {
                this.existingName.set(existing.fullName);
                this.form.controls.fullName.setValue(existing.fullName);
            } else {
                this.clearExisting();
            }
        } catch {
            // Sin aviso anticipado: la base de datos reutiliza la persona igualmente.
            this.clearExisting();
        }
    }

    private clearExisting(): void {
        if (this.existingName()) {
            this.existingName.set(null);
            this.form.controls.fullName.setValue('');
        }
    }

    private reset(): void {
        const guardian = this.guardian();
        this.submitted = false;
        this.existingName.set(null);
        this.formError.set(null);
        this.form.controls.consent.enable();
        this.form.reset({ phone: guardian?.phone ?? '', fullName: guardian?.fullName ?? '', relationship: guardian?.relationship && guardian.relationship !== 'self' ? guardian.relationship : '', consent: false });

        if (!guardian && !this.policy()) {
            void this.detail.privacyPolicy().then((document) => this.policy.set(document));
        }
    }

    /**
     * Abre el documento en el dialog (HU-043). Su botón va fuera de la etiqueta de la casilla, así
     * que leer no la marca (CA-002); la casilla se nombra con los dos (`aria-labelledby`).
     */
    protected read(document: LegalDocument): void {
        this.reading.set(document);
    }
}
