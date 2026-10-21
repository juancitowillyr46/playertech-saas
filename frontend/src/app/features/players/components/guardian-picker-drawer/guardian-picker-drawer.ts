import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { normalizePhone } from '../../../../shared/forms/phone.validator';
import { searchKey } from '../../../../shared/text/search-text';
import { accompaniesLabel, GuardianAssignment, Relationship, RELATIONSHIP_LABELS, relationshipLabel } from '../../models/player.models';
import { GuardianChoice } from '../../services/player-detail.service';

/** Partículas de apellidos compuestos («de la Cruz») que no sirven para sugerir. */
const SURNAME_PARTICLES = new Set(['del', 'las', 'los']);

/**
 * Elegir un acudiente ya registrado y asignarlo al jugador (spec 010, HU-035; DEC-43).
 * Presentacional: la página asigna y abre el registro de uno nuevo.
 */
@Component({
    selector: 'app-guardian-picker-drawer',
    imports: [FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, RadioButtonModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer
            [open]="open()"
            [title]="'Agregar acudiente de ' + playerName()"
            [busy]="busy()"
            [dirty]="!!selectedId()"
            [saveLabel]="'Asignar a ' + playerName()"
            [saveDisabled]="!selectedId() || !relationship()"
            (save)="submit()"
            (closed)="closed.emit()"
        >
            <!-- Los que ya son acudientes van aparte y no se eligen: se distinguen de un vistazo en el celular. -->
            @if (linked().length > 0) {
                <section class="mb-5 rounded-border bg-emphasis p-3" [attr.aria-label]="'Ya son acudientes de ' + playerName()">
                    <p class="m-0 mb-1 font-medium">Ya son acudientes de {{ playerName() }}</p>
                    <ul class="m-0 list-none p-0">
                        @for (option of linked(); track option.guardianId) {
                            <li class="flex items-center gap-2 py-1">
                                <i class="pi pi-check text-primary" aria-hidden="true"></i>
                                <span>{{ option.fullName }} · {{ relationshipLabel(option) }}</span>
                            </li>
                        }
                    </ul>
                </section>
            }

            <p-iconfield class="mb-4 block">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="search" aria-label="Buscar acudiente" placeholder="Nombre o celular" class="w-full" [ngModel]="query()" (ngModelChange)="query.set($event)" />
            </p-iconfield>

            @if (sections().length === 0) {
                <p class="m-0 mb-4 text-muted-color">{{ query() ? 'Ningún acudiente coincide con la búsqueda.' : 'No hay otros acudientes registrados en la academia.' }}</p>
            }
            @for (section of sections(); track section.label) {
                @if (sections().length > 1) {
                    <h3 class="m-0 mt-2 mb-1 text-sm font-bold tracking-wider text-muted-color uppercase">{{ section.title }}</h3>
                }
                <ul class="m-0 mb-3 list-none border-t border-(--p-content-border-color) p-0" [attr.aria-label]="section.label">
                    @for (option of section.options; track option.guardianId) {
                        <li class="border-b border-(--p-content-border-color)">
                            <button
                                type="button"
                                class="flex min-h-16 w-full cursor-pointer flex-col justify-center gap-0.5 border-0 bg-transparent px-1 py-2.5 text-left text-color"
                                [class.bg-emphasis]="option.guardianId === selectedId()"
                                [attr.aria-pressed]="option.guardianId === selectedId()"
                                (click)="select(option)"
                            >
                                <span class="font-semibold">
                                    @if (option.guardianId === selectedId()) {
                                        <i class="pi pi-check mr-1" aria-hidden="true"></i>
                                    }
                                    {{ option.fullName }} · {{ option.phone }}
                                </span>
                                <span class="text-sm text-muted-color">{{ accompanies(option) || 'Sin jugadores activos' }}</span>
                            </button>
                        </li>
                    }
                </ul>
            }

            @if (selectedId()) {
                <fieldset class="m-0 mt-5 flex flex-col gap-2 border-0 p-0">
                    <legend class="mb-2 p-0 font-medium">Parentesco con {{ playerName() }}</legend>
                    <div class="grid grid-cols-2 gap-2">
                        @for (option of relationshipOptions; track option.value) {
                            <label [for]="'pick-relationship-' + option.value" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-border border border-(--p-content-border-color) px-3">
                                <p-radiobutton name="pickRelationship" [value]="option.value" [inputId]="'pick-relationship-' + option.value" [ngModel]="relationship()" (ngModelChange)="relationship.set($event)" />
                                <span>{{ option.label }}</span>
                            </label>
                        }
                    </div>
                    <p class="m-0 text-sm text-muted-color">Ya autorizó el tratamiento de sus datos: no hace falta marcarlo de nuevo.</p>
                </fieldset>
            }

            <p-button label="Registrar un acudiente nuevo" icon="pi pi-plus" [text]="true" styleClass="mt-4 -ml-3" (onClick)="registerNew.emit()" />
        </app-form-drawer>
    `
})
export class GuardianPickerDrawer {
    readonly open = input.required<boolean>();
    readonly options = input<readonly GuardianChoice[]>([]);
    readonly playerName = input('');
    readonly playerLastNames = input('');
    readonly busy = input(false);

    readonly assign = output<GuardianAssignment>();
    readonly registerNew = output<void>();
    readonly closed = output<void>();

    protected readonly relationshipOptions = (Object.keys(RELATIONSHIP_LABELS) as Relationship[]).map((value) => ({ value, label: RELATIONSHIP_LABELS[value] }));
    protected readonly query = signal('');
    protected readonly selectedId = signal<string | null>(null);
    protected readonly relationship = signal<Relationship | null>(null);

    protected readonly linked = computed(() => this.options().filter((option) => option.alreadyLinked));

    /**
     * Con búsqueda, una sola lista de coincidencias. Sin búsqueda, primero los sugeridos:
     * acudientes con uno de los apellidos del jugador (en Colombia, papá y mamá suelen
     * darle sus primeros apellidos), luego todos los demás.
     */
    protected readonly sections = computed(() => {
        const available = this.options().filter((option) => !option.alreadyLinked);
        const query = searchKey(this.query());

        if (query) {
            // Por nombre (sin tildes) o por celular (los dígitos, aunque se escriban con espacios).
            const digits = normalizePhone(query);
            const matches = available.filter((option) => searchKey(option.fullName).includes(query) || (/^\d+$/.test(digits) && option.phone.includes(digits)));

            return matches.length > 0 ? [{ title: 'Resultados', label: 'Acudientes de la academia', options: matches }] : [];
        }

        const surnames = searchKey(this.playerLastNames())
            .split(/\s+/)
            .filter((word) => word.length > 2 && !SURNAME_PARTICLES.has(word));
        const isSuggested = (option: GuardianChoice) =>
            searchKey(option.fullName)
                .split(/\s+/)
                .some((word) => surnames.includes(word));
        const suggested = available.filter(isSuggested);
        const others = available.filter((option) => !isSuggested(option));

        return [
            { title: 'Sugeridos', label: 'Acudientes sugeridos', options: suggested },
            { title: 'Todos', label: 'Acudientes de la academia', options: others }
        ].filter((section) => section.options.length > 0);
    });

    constructor() {
        effect(() => {
            if (this.open()) {
                this.query.set('');
                this.selectedId.set(null);
                this.relationship.set(null);
            }
        });
    }

    protected relationshipLabel(option: GuardianChoice): string {
        return option.linkedAs ? relationshipLabel(option.linkedAs).toLocaleLowerCase('es-CO') : '';
    }

    protected accompanies(option: GuardianChoice): string {
        return accompaniesLabel(option);
    }

    protected select(option: GuardianChoice): void {
        this.selectedId.set(option.guardianId);
        this.relationship.set(null);
    }

    protected submit(): void {
        const guardianId = this.selectedId();
        const relationship = this.relationship();

        if (guardianId && relationship && !this.busy()) {
            this.assign.emit({ guardianId, relationship });
        }
    }
}
