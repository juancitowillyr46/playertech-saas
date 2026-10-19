import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { fieldA11y } from '../../../../shared/forms/field-a11y';
import { PHONE_ERROR, phoneValidator } from '../../../../shared/forms/phone.validator';
import { todayInColombia } from '../../../../shared/text/search-text';
import { GroupRef, PlayerInput, PlayerSummary } from '../../models/player.models';

type Field = 'firstNames' | 'lastNames' | 'birthDate' | 'phone';

const ERRORS: Record<Field, Record<string, string>> = {
    firstNames: { required: 'Ingresa los nombres.' },
    lastNames: { required: 'Ingresa los apellidos.' },
    birthDate: { required: 'Ingresa la fecha de nacimiento.', range: 'La fecha no puede ser futura ni de hace más de 100 años.' },
    phone: { phone: PHONE_ERROR }
};

function requiredTrimmed(control: AbstractControl<string>): ValidationErrors | null {
    return control.value?.trim() ? null : { required: true };
}

/** `Date` local ⇄ `yyyy-mm-dd`, sin pasar por UTC. */
function toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

/**
 * Registrar o editar un jugador (spec 009; HU-002 y HU-033), en drawer como en Sedes.
 * Presentacional: la página decide qué hacer con lo guardado y le pasa el jugador ya
 * registrado (`duplicate`) para mostrar el aviso de DEC-42.
 */
@Component({
    selector: 'app-player-form-drawer',
    imports: [DatePipe, ReactiveFormsModule, ButtonModule, DatePickerModule, InputTextModule, MessageModule, MultiSelectModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="player() ? 'Editar jugador' : 'Registrar jugador'" [busy]="busy()" [dirty]="form.dirty" (save)="submit()" (closed)="closed.emit()">
            @if (duplicate(); as existing) {
                <p-message severity="warn" styleClass="mb-5">
                    <div class="flex flex-col gap-2">
                        <strong>Este jugador ya está registrado</strong>
                        <span>
                            {{ existing.firstNames }} {{ existing.lastNames }} · {{ existing.birthDate | date: 'dd/MM/yyyy' : 'UTC' }}
                            @for (group of existing.groups; track group.id) {
                                · {{ group.name }}
                            }
                            @if (!existing.isActive) {
                                · Inactivo
                            }
                        </span>
                        <div class="flex flex-wrap gap-2">
                            <p-button [label]="existing.isActive ? 'Actualizar sus datos' : 'Reactivarlo y actualizar'" [loading]="busy()" (onClick)="replace.emit(value())" />
                            <p-button label="Cancelar" [outlined]="true" (onClick)="closed.emit()" />
                        </div>
                    </div>
                </p-message>
            }

            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }

            <form [formGroup]="form" class="flex flex-col gap-5" novalidate (ngSubmit)="submit()">
                <div class="flex flex-col gap-2">
                    <label for="playerFirstNames" class="font-medium">Nombres</label>
                    <input pInputText id="playerFirstNames" formControlName="firstNames" maxlength="80" autocomplete="off" class="w-full" [invalid]="!!errorOf('firstNames')" [attr.aria-invalid]="a11y('firstNames')['aria-invalid']" [attr.aria-describedby]="a11y('firstNames')['aria-describedby']" />
                    @if (errorOf('firstNames'); as message) {
                        <p-message id="playerFirstNames-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="playerLastNames" class="font-medium">Apellidos</label>
                    <input pInputText id="playerLastNames" formControlName="lastNames" maxlength="80" autocomplete="off" class="w-full" [invalid]="!!errorOf('lastNames')" [attr.aria-invalid]="a11y('lastNames')['aria-invalid']" [attr.aria-describedby]="a11y('lastNames')['aria-describedby']" />
                    @if (errorOf('lastNames'); as message) {
                        <p-message id="playerLastNames-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="playerNickname" class="font-medium">Apodo <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="playerNickname" formControlName="nickname" maxlength="40" autocomplete="off" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label for="playerBirthDate" class="font-medium">Fecha de nacimiento</label>
                    <p-datepicker
                        inputId="playerBirthDate"
                        formControlName="birthDate"
                        dateFormat="dd/mm/yy"
                        placeholder="dd/mm/aaaa"
                        [minDate]="minDate"
                        [maxDate]="maxDate"
                        [showIcon]="true"
                        iconDisplay="input"
                        appendTo="body"
                        styleClass="w-full"
                        [invalid]="!!errorOf('birthDate')"
                        [pt]="{ pcInputText: { root: a11y('birthDate') } }"
                    />
                    @if (errorOf('birthDate'); as message) {
                        <p-message id="playerBirthDate-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="playerPhone" class="font-medium">Celular <span class="font-normal text-muted-color">(opcional)</span></label>
                    <input pInputText id="playerPhone" type="tel" inputmode="tel" formControlName="phone" autocomplete="off" class="w-full" [invalid]="!!errorOf('phone')" [attr.aria-invalid]="a11y('phone')['aria-invalid']" [attr.aria-describedby]="a11y('phone')['aria-describedby']" />
                    @if (errorOf('phone'); as message) {
                        <p-message id="playerPhone-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>
                <div class="flex flex-col gap-2">
                    <label for="playerGroups" class="font-medium">Grupos <span class="font-normal text-muted-color">(opcional)</span></label>
                    <p-multiselect
                        inputId="playerGroups"
                        formControlName="groupIds"
                        [options]="groupOptions()"
                        optionLabel="name"
                        optionValue="id"
                        display="chip"
                        placeholder="Elige uno o varios"
                        emptyMessage="Aún no hay grupos"
                        [showToggleAll]="false"
                        appendTo="body"
                        styleClass="w-full"
                    />
                </div>
            </form>
        </app-form-drawer>
    `
})
export class PlayerFormDrawer {
    readonly open = input.required<boolean>();
    /** Jugador a editar; null para registrar. */
    readonly player = input<PlayerSummary | null>(null);
    readonly groups = input<readonly GroupRef[]>([]);
    protected readonly groupOptions = computed(() => [...this.groups()]);
    readonly busy = input(false);
    readonly duplicate = input<PlayerSummary | null>(null);
    readonly error = input<string | null>(null);

    readonly save = output<PlayerInput>();
    /** Guardar lo escrito sobre el jugador ya registrado (DEC-42). */
    readonly replace = output<PlayerInput>();
    readonly closed = output<void>();

    private readonly today = fromIsoDate(todayInColombia());
    protected readonly maxDate = this.today;
    protected readonly minDate = new Date(this.today.getFullYear() - 100, this.today.getMonth(), this.today.getDate());

    protected readonly form = inject(FormBuilder).group({
        firstNames: ['', requiredTrimmed],
        lastNames: ['', requiredTrimmed],
        nickname: [''],
        birthDate: [null as Date | null, [Validators.required, (control: AbstractControl<Date | null>) => this.rangeValidator(control)]],
        phone: ['', phoneValidator],
        groupIds: [[] as string[]]
    });

    private readonly formState = toSignal(this.form.events, { initialValue: null });
    private submitted = false;

    constructor() {
        // Cada apertura parte de los datos del jugador (o vacío) y sin errores visibles.
        effect(() => {
            if (this.open()) {
                const player = this.player();
                this.submitted = false;
                this.form.reset({
                    firstNames: player?.firstNames ?? '',
                    lastNames: player?.lastNames ?? '',
                    nickname: player?.nickname ?? '',
                    birthDate: player ? fromIsoDate(player.birthDate) : null,
                    phone: player?.phone ?? '',
                    groupIds: player?.groups.map((group) => group.id) ?? []
                });
            }
        });
    }

    protected errorOf(field: Field): string | null {
        this.formState();
        const control = this.form.controls[field];

        if (!control.invalid || !(control.touched || this.submitted)) {
            return null;
        }

        const code = Object.keys(control.errors ?? {})[0];

        return ERRORS[field][code] ?? null;
    }

    protected a11y(field: Field) {
        return fieldA11y(`player${field.charAt(0).toUpperCase()}${field.slice(1)}`, !!this.errorOf(field));
    }

    protected submit(): void {
        if (this.busy()) {
            return;
        }

        this.submitted = true;
        this.form.markAllAsTouched();
        this.form.updateValueAndValidity();

        if (this.form.valid) {
            this.save.emit(this.value());
        }
    }

    /** Marca el formulario como guardado (la página lo llama tras guardar con éxito). */
    markSaved(): void {
        this.form.markAsPristine();
    }

    protected value(): PlayerInput {
        const raw = this.form.getRawValue();

        return {
            firstNames: raw.firstNames ?? '',
            lastNames: raw.lastNames ?? '',
            nickname: raw.nickname ?? null,
            birthDate: raw.birthDate ? toIsoDate(raw.birthDate) : '',
            phone: raw.phone ?? null,
            groupIds: raw.groupIds ?? []
        };
    }

    private rangeValidator(control: AbstractControl<Date | null>): ValidationErrors | null {
        const date = control.value;

        return date && (date > this.maxDate || date < this.minDate) ? { range: true } : null;
    }
}
