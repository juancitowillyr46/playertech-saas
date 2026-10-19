import { ChangeDetectionStrategy, Component, effect, inject, input, output, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { fieldA11y } from '../../../../shared/forms/field-a11y';

const MESSAGES: Record<string, string> = { required: 'Ingresa el nombre del grupo.', taken: 'Ya existe un grupo con ese nombre.' };

/** Crear o renombrar un grupo (spec 009, HU-004): un solo campo, en drawer. */
@Component({
    selector: 'app-group-name-drawer',
    imports: [ReactiveFormsModule, InputTextModule, MessageModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="name() ? 'Renombrar grupo' : 'Crear grupo'" [busy]="busy()" [dirty]="form.dirty" [saveLabel]="name() ? 'Guardar' : 'Crear grupo'" (save)="submit()" (closed)="closed.emit()">
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }
            <form [formGroup]="form" class="flex flex-col gap-2" novalidate (ngSubmit)="submit()">
                <label for="groupName" class="font-medium">Nombre del grupo</label>
                <input pInputText id="groupName" formControlName="name" maxlength="60" autocomplete="off" placeholder="Por ejemplo, Sub-12" class="w-full" [invalid]="!!errorText()" [attr.aria-invalid]="a11y()['aria-invalid']" [attr.aria-describedby]="a11y()['aria-describedby']" />
                @if (errorText(); as message) {
                    <p-message id="groupName-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                }
            </form>
        </app-form-drawer>
    `
})
export class GroupNameDrawer {
    readonly open = input.required<boolean>();
    /** Nombre actual al renombrar; vacío al crear. */
    readonly name = input('');
    readonly busy = input(false);
    readonly error = input<string | null>(null);
    /** Aviso temprano de nombre en uso. */
    readonly isTaken = input<(name: string) => boolean>(() => false);

    readonly save = output<string>();
    readonly closed = output<void>();

    protected readonly form = inject(FormBuilder).nonNullable.group({
        name: ['', (control: AbstractControl<string>) => this.validate(control)]
    });

    private readonly formState = toSignal(this.form.events, { initialValue: null });
    private submitted = false;

    constructor() {
        effect(() => {
            // Solo `open` dispara el reinicio: las señales internas de PrimeNG que se leen al
            // reiniciar el formulario no deben volver a ejecutarlo (reiniciaba al elegir un valor).
            if (this.open()) {
                untracked(() => {
                    this.submitted = false;
                    this.form.reset({ name: this.name() });
                });
            }
        });
    }

    protected errorText(): string | null {
        this.formState();
        const control = this.form.controls.name;

        return control.invalid && (control.touched || this.submitted) ? MESSAGES[Object.keys(control.errors ?? {})[0]] : null;
    }

    protected a11y() {
        return fieldA11y('groupName', !!this.errorText());
    }

    /** La página lo llama si la base de datos rechaza el nombre por repetido. */
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
            this.save.emit(this.form.getRawValue().name);
        }
    }

    private validate(control: AbstractControl<string>): ValidationErrors | null {
        const value = control.value?.trim() ?? '';

        if (!value) {
            return { required: true };
        }

        return value.toLocaleLowerCase('es-CO') !== this.name()?.trim().toLocaleLowerCase('es-CO') && this.isTaken()(value) ? { taken: true } : null;
    }
}
