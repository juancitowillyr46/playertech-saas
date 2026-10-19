import { ChangeDetectionStrategy, Component, effect, inject, input, output, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { fieldA11y } from '../../../../shared/forms/field-a11y';
import { ExternalField, ExternalFieldInput } from '../../models/activity.models';

const MESSAGES: Record<string, string> = { required: 'Ingresa el nombre de la cancha.', taken: 'Ya existe una cancha con ese nombre.' };

/** Crear o editar una cancha externa (spec 011, HU-037): solo el nombre es obligatorio. */
@Component({
    selector: 'app-external-field-drawer',
    imports: [ReactiveFormsModule, InputTextModule, MessageModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="field() ? 'Editar cancha' : 'Nueva cancha'" [busy]="busy()" [dirty]="form.dirty" (save)="submit()" (closed)="closed.emit()">
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }
            <form [formGroup]="form" class="flex flex-col gap-5" novalidate (ngSubmit)="submit()">
                <div class="flex flex-col gap-2">
                    <label for="fieldName" class="font-medium">Nombre de la cancha</label>
                    <input pInputText id="fieldName" formControlName="name" maxlength="80" autocomplete="off" class="w-full" [invalid]="!!nameError()" [attr.aria-invalid]="a11y()['aria-invalid']" [attr.aria-describedby]="a11y()['aria-describedby']" />
                    @if (nameError(); as message) {
                        <p-message id="fieldName-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="fieldAddress" class="font-medium">Dirección <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="fieldAddress" formControlName="address" maxlength="160" autocomplete="off" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="fieldCity" class="font-medium">Ciudad <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="fieldCity" formControlName="city" maxlength="80" autocomplete="off" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="fieldDirections" class="font-medium">Indicaciones <span class="font-normal text-muted-color">(opcional)</span></label>
                    <textarea pTextarea id="fieldDirections" formControlName="directions" rows="3" maxlength="500" class="w-full"></textarea>
                </div>
            </form>
        </app-form-drawer>
    `
})
export class ExternalFieldDrawer {
    readonly open = input.required<boolean>();
    readonly field = input<ExternalField | null>(null);
    readonly busy = input(false);
    readonly error = input<string | null>(null);
    readonly isTaken = input<(name: string) => boolean>(() => false);

    readonly save = output<ExternalFieldInput>();
    readonly closed = output<void>();

    protected readonly form = inject(FormBuilder).nonNullable.group({
        name: ['', (control: AbstractControl<string>) => this.validateName(control)],
        address: [''],
        city: [''],
        directions: ['']
    });

    private readonly formState = toSignal(this.form.events, { initialValue: null });
    private submitted = false;

    constructor() {
        effect(() => {
            // Solo `open` dispara el reinicio: las señales internas de PrimeNG que se leen al
            // reiniciar el formulario no deben volver a ejecutarlo (reiniciaba al elegir un valor).
            if (this.open()) {
                untracked(() => {
                    const field = this.field();
                    this.submitted = false;
                    this.form.reset({ name: field?.name ?? '', address: field?.address ?? '', city: field?.city ?? '', directions: field?.directions ?? '' });
                });
            }
        });
    }

    protected nameError(): string | null {
        this.formState();
        const control = this.form.controls.name;

        return control.invalid && (control.touched || this.submitted) ? MESSAGES[Object.keys(control.errors ?? {})[0]] : null;
    }

    protected a11y() {
        return fieldA11y('fieldName', !!this.nameError());
    }

    markTaken(): void {
        this.form.controls.name.setErrors({ taken: true });
    }

    markSaved(): void {
        this.form.markAsPristine();
    }

    protected submit(): void {
        this.submitted = true;
        this.form.markAllAsTouched();
        this.form.controls.name.updateValueAndValidity();

        if (this.form.valid && !this.busy()) {
            this.save.emit(this.form.getRawValue());
        }
    }

    private validateName(control: AbstractControl<string>): ValidationErrors | null {
        const value = control.value?.trim() ?? '';

        if (!value) {
            return { required: true };
        }

        const unchanged = value.toLocaleLowerCase('es-CO') === this.field()?.name.trim().toLocaleLowerCase('es-CO');

        return !unchanged && this.isTaken()(value) ? { taken: true } : null;
    }
}
