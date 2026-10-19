import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { fieldA11y } from '../../../../shared/forms/field-a11y';
import { addDays, fromInstant, timeLabel, toInstant } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { Activity, ACTIVITY_TYPE_LABELS, ActivityType, PlaceRef } from '../../models/activity.models';
import { ActivityDraft, draftDates, PlaceGroups } from '../../services/activities.service';

type Field = 'type' | 'date' | 'start' | 'end' | 'call' | 'place' | 'until';

const ERRORS: Record<Field, Record<string, string>> = {
    type: { required: 'Elige el tipo de actividad.' },
    date: { required: 'Ingresa la fecha.', past: 'La fecha y la hora ya pasaron.' },
    start: { required: 'Ingresa la hora de inicio.' },
    end: { order: 'La hora de fin debe ser posterior a la de inicio.' },
    call: { order: 'La citación no puede ser después del inicio.' },
    place: { required: 'Elige el lugar.' },
    until: { required: 'Ingresa hasta cuándo se repite.', range: 'Debe ser posterior a la fecha y de máximo 6 meses.', none: 'Elige al menos un día que caiga en ese periodo.' }
};

const WEEKDAYS = [
    { value: 1, short: 'L', label: 'Lunes' },
    { value: 2, short: 'M', label: 'Martes' },
    { value: 3, short: 'X', label: 'Miércoles' },
    { value: 4, short: 'J', label: 'Jueves' },
    { value: 5, short: 'V', label: 'Viernes' },
    { value: 6, short: 'S', label: 'Sábado' },
    { value: 0, short: 'D', label: 'Domingo' }
];

const placeKey = (place: PlaceRef) => `${place.kind}:${place.id}`;

/** `Date` local del selector ⇄ `yyyy-mm-dd` o `HH:mm`, sin pasar por UTC. */
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateFrom = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};
/** Horas de 5:00 a. m. a 11:00 p. m. cada 15 minutos (`HH:mm`): selección con un toque, sin teclado. */
const BASE_TIMES = Array.from({ length: (23 - 5) * 4 + 1 }, (_, index) => {
    const minutes = 5 * 60 + index * 15;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/**
 * Programar o editar una actividad (spec 011; HU-005 y HU-036), en drawer. Presentacional:
 * emite el borrador con fecha y horas de Colombia; la página guarda y abre «Nueva cancha».
 * Las mismas reglas las garantiza la base de datos.
 */
@Component({
    selector: 'app-activity-form-drawer',
    imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, DatePickerModule, InputTextModule, MessageModule, RadioButtonModule, SelectModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="activity() ? 'Editar actividad' : 'Nueva actividad'" [busy]="busy()" [dirty]="form.dirty" [saveLabel]="saveLabel()" (save)="submit()" (closed)="closed.emit()">
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }

            <form [formGroup]="form" class="flex flex-col gap-5" novalidate (ngSubmit)="submit()">
                <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend class="mb-2 p-0 font-medium">Tipo</legend>
                    <div class="grid grid-cols-2 gap-2">
                        @for (option of typeOptions; track option.value) {
                            <label [for]="'activity-type-' + option.value" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-border border border-(--p-content-border-color) px-3">
                                <p-radiobutton formControlName="type" [value]="option.value" [inputId]="'activity-type-' + option.value" />
                                <span>{{ option.label }}</span>
                            </label>
                        }
                    </div>
                    @if (errorOf('type'); as message) {
                        <p-message id="activityType-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </fieldset>

                <div class="flex flex-col gap-2">
                    <label for="activityDate" class="font-medium">Fecha</label>
                    <p-datepicker inputId="activityDate" formControlName="date" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" [minDate]="today" [showIcon]="true" [showOnFocus]="false" iconDisplay="button" buttonAriaLabel="Abrir calendario" appendTo="body" styleClass="w-full" [invalid]="!!errorOf('date')" [pt]="{ pcInputText: { root: a11y('date') } }" />
                    @if (errorOf('date'); as message) {
                        <p-message id="activityDate-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                </div>

                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div class="flex min-w-0 flex-col gap-2">
                        <label for="activityStart" class="font-medium">Inicio</label>
                        <p-select inputId="activityStart" formControlName="start" [options]="startOptions()" optionLabel="label" optionValue="value" placeholder="—" [showClear]="false" appendTo="body" styleClass="w-full" [invalid]="!!errorOf('start')" [ariaLabel]="'Hora de inicio'" />
                    </div>
                    <div class="flex min-w-0 flex-col gap-2">
                        <label for="activityEnd" class="font-medium">Fin <span class="font-normal text-muted-color">(opc.)</span></label>
                        <p-select inputId="activityEnd" formControlName="end" [options]="endOptions()" optionLabel="label" optionValue="value" placeholder="—" [showClear]="true" appendTo="body" styleClass="w-full" [invalid]="!!errorOf('end')" [ariaLabel]="'Hora de fin'" />
                    </div>
                    <div class="flex min-w-0 flex-col gap-2">
                        <label for="activityCall" class="font-medium">Citación <span class="font-normal text-muted-color">(opc.)</span></label>
                        <p-select inputId="activityCall" formControlName="call" [options]="callOptions()" optionLabel="label" optionValue="value" placeholder="—" [showClear]="true" appendTo="body" styleClass="w-full" [invalid]="!!errorOf('call')" [ariaLabel]="'Hora de citación'" />
                    </div>
                </div>
                @for (field of timeFields; track field) {
                    @if (errorOf(field); as message) {
                        <p-message [id]="'activity' + capitalize(field) + '-error'" severity="error" variant="simple" size="small" styleClass="-mt-3">{{ message }}</p-message>
                    }
                }

                <div class="flex flex-col gap-2">
                    <label for="activityPlace" class="font-medium">Lugar</label>
                    <p-select
                        inputId="activityPlace"
                        formControlName="place"
                        [options]="placeGroups()"
                        [group]="true"
                        optionLabel="label"
                        optionValue="key"
                        optionGroupLabel="label"
                        optionGroupChildren="items"
                        placeholder="Elige una sede o una cancha"
                        emptyMessage="Aún no hay sedes ni canchas"
                        appendTo="body"
                        styleClass="w-full"
                        [invalid]="!!errorOf('place')"
                        [ariaLabel]="'Lugar'"
                    />
                    @if (errorOf('place'); as message) {
                        <p-message id="activityPlace-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                    }
                    <p-button label="Nueva cancha" icon="pi pi-plus" [text]="true" styleClass="-ml-3 self-start" (onClick)="newField.emit()" />
                </div>

                @if (form.controls.type.value === 'competition') {
                    <div class="flex flex-col gap-2">
                        <label for="activityOpponent" class="font-medium">Rival <span class="font-normal text-muted-color">(opcional)</span></label>
                        <input pInputText id="activityOpponent" formControlName="opponent" maxlength="80" autocomplete="off" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="activityTournament" class="font-medium">Torneo <span class="font-normal text-muted-color">(opcional)</span></label>
                        <input pInputText id="activityTournament" formControlName="tournament" maxlength="80" autocomplete="off" class="w-full" />
                    </div>
                }

                <div class="flex flex-col gap-2">
                    <label for="activityNotes" class="font-medium">Observaciones <span class="font-normal text-muted-color">(opcional)</span></label>
                    <textarea pTextarea id="activityNotes" formControlName="notes" rows="2" maxlength="500" placeholder="Uniforme, qué llevar…" class="w-full"></textarea>
                </div>

                @if (!activity()) {
                    <div class="flex flex-col gap-3 rounded-border border border-(--p-content-border-color) p-3">
                        <div class="flex min-h-11 items-center gap-3">
                            <p-checkbox formControlName="repeat" [binary]="true" inputId="activityRepeat" />
                            <label for="activityRepeat" class="font-medium">Repetir cada semana</label>
                        </div>
                        @if (form.controls.repeat.value) {
                            <div class="grid grid-cols-7 gap-1" role="group" aria-label="Días de la semana">
                                @for (day of weekdays; track day.value) {
                                    <p-button
                                        [label]="day.short"
                                        [ariaLabel]="day.label"
                                        [outlined]="!weekdaySelected(day.value)"
                                        [attr.aria-pressed]="weekdaySelected(day.value)"
                                        styleClass="w-full px-0"
                                        (onClick)="toggleWeekday(day.value)"
                                    />
                                }
                            </div>
                            <div class="flex flex-col gap-2">
                                <label for="activityUntil" class="font-medium">Hasta</label>
                                <p-datepicker inputId="activityUntil" formControlName="until" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" [minDate]="today" [showIcon]="true" [showOnFocus]="false" iconDisplay="button" buttonAriaLabel="Abrir calendario" appendTo="body" styleClass="w-full" [invalid]="!!errorOf('until')" [pt]="{ pcInputText: { root: a11y('until') } }" />
                                @if (errorOf('until'); as message) {
                                    <p-message id="activityUntil-error" severity="error" variant="simple" size="small">{{ message }}</p-message>
                                }
                            </div>
                            @if (repeatCount() > 0) {
                                <p class="m-0 font-semibold" aria-live="polite">Se crearán {{ repeatCount() }} actividades.</p>
                            }
                        }
                    </div>
                }
            </form>
        </app-form-drawer>
    `
})
export class ActivityFormDrawer {
    readonly open = input.required<boolean>();
    /** Actividad a editar (próxima); null para programar. */
    readonly activity = input<Activity | null>(null);
    readonly places = input<PlaceGroups>({ venues: [], fields: [] });
    readonly busy = input(false);
    readonly error = input<string | null>(null);

    readonly save = output<ActivityDraft>();
    readonly newField = output<void>();
    readonly closed = output<void>();

    protected readonly typeOptions = (Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((value) => ({ value, label: ACTIVITY_TYPE_LABELS[value] }));
    protected readonly weekdays = WEEKDAYS;
    protected readonly timeFields: Field[] = ['start', 'end', 'call'];
    protected readonly today = dateFrom(todayInColombia());
    private readonly selectedWeekdays = signal<readonly number[]>([]);
    /** Horas de la actividad editada que no están en los pasos de 15 minutos. */
    private readonly extraTimes = signal<readonly string[]>([]);

    private readonly allTimes = computed(() => [...new Set([...BASE_TIMES, ...this.extraTimes()])].sort());

    /** Primera hora disponible: si la fecha es hoy, después de la hora actual de Colombia. */
    private readonly earliest = computed(() => {
        this.formState();
        const date = this.form.controls.date.value;

        return date && isoDate(date) === todayInColombia() ? fromInstant(new Date().toISOString()).time : null;
    });

    /** Inicio: sin las horas que ya pasaron hoy. */
    protected readonly startOptions = computed(() => this.toOptions(this.allTimes().filter((time) => !this.earliest() || time > this.earliest()!)));

    /** Fin: solo después del inicio. */
    protected readonly endOptions = computed(() => {
        this.formState();
        const start = this.form.controls.start.value;

        return this.toOptions(this.allTimes().filter((time) => !start || time > start));
    });

    /** Citación: antes o a la hora del inicio, y sin las horas que ya pasaron hoy. */
    protected readonly callOptions = computed(() => {
        this.formState();
        const start = this.form.controls.start.value;
        const earliest = this.earliest();

        return this.toOptions(this.allTimes().filter((time) => (!start || time <= start) && (!earliest || time > earliest)));
    });
    private submitted = false;

    protected readonly placeGroups = computed(() => {
        const toItems = (options: PlaceGroups['venues']) => options.map((option) => ({ label: option.label, key: placeKey(option.value) }));
        const { venues, fields } = this.places();

        return [
            { label: 'Sedes', items: toItems(venues) },
            { label: 'Canchas', items: toItems(fields) }
        ].filter((group) => group.items.length > 0);
    });

    protected readonly form = inject(FormBuilder).group(
        {
            type: [null as ActivityType | null, Validators.required],
            date: [null as Date | null, Validators.required],
            start: [null as string | null, Validators.required],
            end: [null as string | null],
            call: [null as string | null],
            place: [null as string | null, Validators.required],
            opponent: [''],
            tournament: [''],
            notes: [''],
            repeat: [false],
            until: [null as Date | null]
        },
        { validators: (group: AbstractControl) => this.crossValidate(group) }
    );

    private readonly formState = toSignal(this.form.events, { initialValue: null });

    protected readonly repeatCount = computed(() => {
        this.formState();
        this.selectedWeekdays();
        const draft = this.form.controls.repeat.value ? this.partialDraft() : null;

        return draft?.repeat ? draftDates(draft).length : 0;
    });

    protected readonly saveLabel = computed(() => {
        const count = this.repeatCount();

        return this.activity() ? 'Guardar' : count > 1 ? `Crear ${count}` : 'Guardar';
    });

    constructor() {
        effect(() => {
            // Solo `open` dispara el reinicio: las señales internas de PrimeNG que se leen al
            // reiniciar el formulario no deben volver a ejecutarlo (reiniciaba al elegir un valor).
            if (this.open()) {
                untracked(() => {
                    this.reset(this.activity());
                });
            }
        });
    }

    private toOptions(times: readonly string[]) {
        return times.map((value) => ({ value, label: timeLabel(value) }));
    }

    /** La página lo llama al crear una cancha desde el formulario: queda elegida. */
    selectPlace(place: PlaceRef): void {
        this.form.controls.place.setValue(placeKey(place));
        this.form.controls.place.markAsDirty();
    }

    markSaved(): void {
        this.form.markAsPristine();
    }

    protected capitalize(field: string): string {
        return field.charAt(0).toUpperCase() + field.slice(1);
    }

    protected weekdaySelected(day: number): boolean {
        return this.selectedWeekdays().includes(day);
    }

    protected toggleWeekday(day: number): void {
        const days = this.selectedWeekdays();
        this.selectedWeekdays.set(days.includes(day) ? days.filter((value) => value !== day) : [...days, day]);
        this.form.markAsDirty();
        this.form.updateValueAndValidity();
    }

    protected errorOf(field: Field): string | null {
        this.formState();
        const control = this.form.controls[field];
        const visible = control.touched || this.submitted;
        const own = control.errors ? Object.keys(control.errors)[0] : null;
        const cross = (this.form.errors?.[field] as string | undefined) ?? null;
        const code = own ?? cross;

        return visible && code ? (ERRORS[field][code] ?? null) : null;
    }

    protected a11y(field: Field) {
        return fieldA11y(`activity${this.capitalize(field)}`, !!this.errorOf(field));
    }

    protected submit(): void {
        if (this.busy()) {
            return;
        }

        this.submitted = true;
        this.form.markAllAsTouched();
        this.form.updateValueAndValidity();
        const draft = this.partialDraft();

        if (this.form.valid && draft) {
            this.save.emit(draft);
        }
    }

    private partialDraft(): ActivityDraft | null {
        const raw = this.form.getRawValue();
        const place = raw.place?.split(':');

        if (!raw.type || !raw.date || !raw.start || !place) {
            return null;
        }

        return {
            type: raw.type,
            date: isoDate(raw.date),
            start: raw.start,
            end: raw.end ?? null,
            call: raw.call ?? null,
            place: { kind: place[0] as PlaceRef['kind'], id: place[1] },
            notes: raw.notes ?? null,
            opponent: raw.opponent ?? null,
            tournament: raw.tournament ?? null,
            repeat: !this.activity() && raw.repeat && raw.until ? { weekdays: this.selectedWeekdays(), until: isoDate(raw.until) } : null
        };
    }

    /** Reglas que cruzan campos (HU-005, CA-003 y CA-006): el error se asigna al campo que lo muestra. */
    private crossValidate(group: AbstractControl): ValidationErrors | null {
        const { date, start, end, call, repeat, until } = group.value as { date: Date | null; start: string | null; end: string | null; call: string | null; repeat: boolean; until: Date | null };
        const errors: Record<string, string> = {};

        if (date && start) {
            const startsAt = toInstant(isoDate(date), start);

            if (new Date(startsAt).getTime() <= Date.now()) {
                errors['date'] = 'past';
            }
        }

        if (start && end && end <= start) {
            errors['end'] = 'order';
        }

        if (start && call && call > start) {
            errors['call'] = 'order';
        }

        if (repeat && !this.activity?.()) {
            if (!until) {
                errors['until'] = 'required';
            } else if (date) {
                const from = isoDate(date);
                const to = isoDate(until);

                if (to < from || to > addDays(from, 183)) {
                    errors['until'] = 'range';
                } else if (draftDates({ date: from, repeat: { weekdays: this.selectedWeekdays(), until: to } }).length === 0) {
                    errors['until'] = 'none';
                }
            }
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }

    private reset(activity: Activity | null): void {
        this.submitted = false;
        this.selectedWeekdays.set([]);
        this.extraTimes.set([]);

        if (!activity) {
            this.form.reset({ type: null, date: null, start: null, end: null, call: null, place: null, opponent: '', tournament: '', notes: '', repeat: false, until: null });
            return;
        }

        const start = fromInstant(activity.startsAt);
        const end = activity.endsAt ? fromInstant(activity.endsAt).time : null;
        const call = activity.callAt ? fromInstant(activity.callAt).time : null;
        this.extraTimes.set([start.time, end, call].filter((time): time is string => !!time && !BASE_TIMES.includes(time)));

        this.form.reset({
            type: activity.type,
            date: dateFrom(start.date),
            start: start.time,
            end,
            call,
            place: placeKey(activity.place),
            opponent: activity.opponent ?? '',
            tournament: activity.tournament ?? '',
            notes: activity.notes ?? '',
            repeat: false,
            until: null
        });
    }
}
