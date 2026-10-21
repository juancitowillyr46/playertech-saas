import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { fromInstant, QUARTER_HOURS, timeLabel, toInstant } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { GroupRef, PlayerSummary, shortName } from '../../../players/models/player.models';
import { CallUp, CallUpListInput } from '../../models/call-up.models';
import { CallUpAdjustment } from '../../services/call-up.service';

/** Clave de la lista única sin grupo al crear. */
const NO_GROUP = 'none';

interface ListDef {
    readonly key: string;
    readonly groupId: string | null;
    readonly label: string;
}

interface PlayerName {
    readonly firstNames: string;
    readonly lastNames: string;
    readonly nickname: string | null;
}

const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateFrom = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};
const nameOf = (player: PlayerName) => (player.nickname ? `${shortName(player)} · ${player.nickname}` : shortName(player));

/**
 * Convocar a una actividad o ajustar sus convocados (spec 012; HU-007 y HU-008). Al crear,
 * se eligen grupos y se quitan o suman jugadores de cualquier grupo; al ajustar, se trabaja
 * sobre las listas existentes. Emite el resultado; la página lo guarda.
 */
@Component({
    selector: 'app-call-up-drawer',
    imports: [FormsModule, ButtonModule, CheckboxModule, DatePickerModule, MessageModule, SelectModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="callUp() ? 'Ajustar convocados' : 'Convocar'" [busy]="busy()" [dirty]="dirty()" [saveLabel]="saveLabel()" (save)="submit()" (closed)="closed.emit()">
            @if (error() ?? localError(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }

            @if (!callUp()) {
                <fieldset class="m-0 mb-5 flex flex-col gap-1 border-0 p-0">
                    <legend class="mb-2 p-0 font-medium">Grupos</legend>
                    @for (group of groupOptions(); track group.id) {
                        <div class="flex min-h-11 items-center gap-3">
                            <p-checkbox [binary]="true" [inputId]="'callup-group-' + group.id" [ngModel]="selectedGroups().includes(group.id)" (ngModelChange)="toggleGroup(group.id)" />
                            <label [for]="'callup-group-' + group.id"
                                >{{ group.name }} <span class="text-muted-color">· {{ group.count === 1 ? '1 jugador' : group.count + ' jugadores' }}</span></label
                            >
                        </div>
                    } @empty {
                        <p class="m-0 text-muted-color">Aún no hay grupos: suma jugadores uno a uno.</p>
                    }
                </fieldset>
            }

            @for (list of lists(); track list.key) {
                <section class="mb-4" [attr.aria-label]="'Lista ' + list.label">
                    <h3 class="m-0 mb-1 text-base font-semibold">Lista {{ list.label }} · {{ list.players.length === 1 ? '1 convocado' : list.players.length + ' convocados' }}</h3>
                    <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0">
                        @for (player of list.players; track player.id) {
                            <!-- Con varias listas, en el celular el nombre va en su línea y los controles debajo. -->
                            <li class="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b border-(--p-content-border-color) py-1">
                                <span class="min-w-0 flex-1 truncate" [class.basis-full]="lists().length > 1" [class.sm:basis-0]="lists().length > 1">{{ player.name }}</span>
                                @if (lists().length > 1) {
                                    <p-select
                                        [options]="listOptions()"
                                        optionLabel="label"
                                        optionValue="key"
                                        appendTo="body"
                                        class="flex-1 sm:flex-none"
                                        styleClass="w-full sm:w-28"
                                        [ariaLabel]="'Lista de ' + player.name"
                                        [ngModel]="list.key"
                                        (ngModelChange)="move(player.id, $event)"
                                    />
                                }
                                <p-button label="Quitar" [text]="true" severity="secondary" [ariaLabel]="'Quitar a ' + player.name" (onClick)="remove(player.id)" />
                            </li>
                        } @empty {
                            <li class="py-3 text-muted-color">Sin convocados en esta lista.</li>
                        }
                    </ul>
                </section>
            }

            <div class="mb-5 flex flex-col gap-2">
                <label for="callupAdd" class="font-medium">Sumar jugador</label>
                <p-select
                    inputId="callupAdd"
                    [options]="addOptions()"
                    optionLabel="label"
                    optionValue="id"
                    [filter]="true"
                    filterBy="label"
                    placeholder="Busca por nombre"
                    emptyMessage="No hay más jugadores activos"
                    emptyFilterMessage="Ningún jugador coincide"
                    appendTo="body"
                    styleClass="w-full"
                    [ngModel]="addPlayerId()"
                    (ngModelChange)="addPlayerId.set($event)"
                />
                @if (lists().length > 1) {
                    <p-select [options]="listOptions()" optionLabel="label" optionValue="key" appendTo="body" styleClass="w-full" ariaLabel="Lista donde queda" [ngModel]="addTarget()" (ngModelChange)="addTarget.set($event)" />
                }
                <p-button label="Sumar" icon="pi pi-plus" [outlined]="true" styleClass="w-full" [disabled]="!addPlayerId()" (onClick)="addPlayer()" />
            </div>

            <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
                <legend class="mb-2 p-0 font-medium">Responder hasta <span class="font-normal text-muted-color">(opcional)</span></legend>
                <div class="grid grid-cols-2 gap-2">
                    <p-datepicker
                        inputId="callupDeadlineDate"
                        dateFormat="dd/mm/yy"
                        placeholder="dd/mm/aaaa"
                        [minDate]="today"
                        [maxDate]="maxDate()"
                        [showIcon]="true"
                        [showOnFocus]="false"
                        iconDisplay="button"
                        buttonAriaLabel="Abrir calendario"
                        appendTo="body"
                        styleClass="w-full"
                        ariaLabel="Fecha límite"
                        [ngModel]="deadlineDate()"
                        (ngModelChange)="deadlineDate.set($event)"
                    />
                    <p-select
                        [options]="timeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Hora"
                        [showClear]="true"
                        appendTo="body"
                        styleClass="w-full"
                        ariaLabel="Hora límite"
                        [ngModel]="deadlineTime()"
                        (ngModelChange)="deadlineTime.set($event)"
                    />
                </div>
                <p class="m-0 text-sm text-muted-color">Sin fecha límite, se responde hasta que empiece la actividad.</p>
            </fieldset>
        </app-form-drawer>
    `
})
export class CallUpDrawer {
    readonly open = input.required<boolean>();
    /** Convocatoria a ajustar; null para convocar. */
    readonly callUp = input<CallUp | null>(null);
    readonly candidates = input<readonly PlayerSummary[]>([]);
    readonly groups = input<readonly GroupRef[]>([]);
    readonly activityStartsAt = input.required<string>();
    readonly busy = input(false);
    readonly error = input<string | null>(null);

    readonly create = output<{ deadline: string | null; lists: CallUpListInput[] }>();
    readonly adjust = output<CallUpAdjustment>();
    readonly closed = output<void>();

    protected readonly today = dateFrom(todayInColombia());
    protected readonly timeOptions = QUARTER_HOURS.map((value) => ({ value, label: timeLabel(value) }));
    protected readonly selectedGroups = signal<readonly string[]>([]);
    /** Cambios sobre la asignación base: lista elegida o `null` (quitado). */
    private readonly overrides = signal<ReadonlyMap<string, string | null>>(new Map());
    protected readonly addPlayerId = signal<string | null>(null);
    protected readonly addTarget = signal<string | null>(null);
    protected readonly deadlineDate = signal<Date | null>(null);
    protected readonly deadlineTime = signal<string | null>(null);
    protected readonly localError = signal<string | null>(null);
    private initialDeadline: string | null = null;

    protected readonly maxDate = computed(() => dateFrom(fromInstant(this.activityStartsAt()).date));

    protected readonly groupOptions = computed(() => this.groups().map((group) => ({ id: group.id, name: group.name, count: this.candidates().filter((player) => player.groups.some((ref) => ref.id === group.id)).length })));

    private readonly defs = computed<readonly ListDef[]>(() => {
        const callUp = this.callUp();

        if (callUp) {
            return callUp.lists.map((list) => ({ key: list.id, groupId: list.groupId, label: list.groupName ?? 'convocados' }));
        }

        const selected = this.selectedGroups()
            .map((id) => this.groups().find((group) => group.id === id))
            .filter((group): group is GroupRef => !!group);

        return selected.length > 0 ? selected.map((group) => ({ key: group.id, groupId: group.id, label: group.name })) : [{ key: NO_GROUP, groupId: null, label: 'convocados' }];
    });

    protected readonly listOptions = computed(() => this.defs().map((def) => ({ key: def.key, label: def.label })));

    /** Asignación antes de los cambios: la convocatoria actual o, al crear, los grupos elegidos en orden. */
    private readonly base = computed<ReadonlyMap<string, string>>(() => {
        const callUp = this.callUp();
        const base = new Map<string, string>();

        if (callUp) {
            callUp.lists.forEach((list) => list.players.forEach((player) => base.set(player.playerId, list.id)));
            return base;
        }

        for (const groupId of this.selectedGroups()) {
            for (const player of this.candidates()) {
                if (!base.has(player.id) && player.groups.some((ref) => ref.id === groupId)) {
                    base.set(player.id, groupId);
                }
            }
        }

        return base;
    });

    /** Asignación final: base más cambios; una lista que ya no existe pasa a la primera. */
    private readonly assignment = computed<ReadonlyMap<string, string>>(() => {
        const keys = this.defs().map((def) => def.key);
        const final = new Map(this.base());

        this.overrides().forEach((key, playerId) => {
            if (key === null) {
                final.delete(playerId);
            } else {
                final.set(playerId, keys.includes(key) ? key : keys[0]);
            }
        });

        return final;
    });

    private readonly names = computed(() => {
        const names = new Map<string, string>();

        this.callUp()?.lists.forEach((list) => list.players.forEach((player) => names.set(player.playerId, nameOf(player))));
        this.candidates().forEach((player) => names.set(player.id, nameOf(player)));

        return names;
    });

    protected readonly lists = computed(() => {
        const assignment = this.assignment();
        const names = this.names();

        return this.defs().map((def) => ({
            ...def,
            players: [...assignment]
                .filter(([, key]) => key === def.key)
                .map(([id]) => ({ id, name: names.get(id) ?? '—' }))
                .sort((a, b) => a.name.localeCompare(b.name, 'es-CO'))
        }));
    });

    protected readonly total = computed(() => this.assignment().size);

    protected readonly addOptions = computed(() => {
        const assigned = this.assignment();

        return this.candidates()
            .filter((player) => !assigned.has(player.id))
            .map((player) => ({ id: player.id, label: [nameOf(player), player.groups.map((group) => group.name).join(', ')].filter(Boolean).join(' · ') }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es-CO'));
    });

    protected readonly saveLabel = computed(() => (this.callUp() ? 'Guardar' : this.total() === 1 ? 'Convocar 1' : `Convocar ${this.total()}`));

    protected readonly dirty = computed(() => this.selectedGroups().length > 0 || this.overrides().size > 0 || this.deadlineValue() !== this.initialDeadline);

    constructor() {
        // Solo `open` dispara el reinicio (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => this.reset());
            }
        });
    }

    protected toggleGroup(groupId: string): void {
        const selected = this.selectedGroups();
        this.selectedGroups.set(selected.includes(groupId) ? selected.filter((id) => id !== groupId) : [...selected, groupId]);
    }

    protected remove(playerId: string): void {
        this.setOverride(playerId, null);
    }

    protected move(playerId: string, key: string): void {
        this.setOverride(playerId, key);
    }

    protected addPlayer(): void {
        const playerId = this.addPlayerId();

        if (playerId) {
            this.setOverride(playerId, this.addTarget() ?? this.defs()[0].key);
            this.addPlayerId.set(null);
        }
    }

    protected submit(): void {
        if (this.busy()) {
            return;
        }

        const deadline = this.deadlineValue();
        const problem = this.validate(deadline);
        this.localError.set(problem);

        if (problem) {
            return;
        }

        const callUp = this.callUp();

        if (!callUp) {
            this.create.emit({
                deadline,
                lists: this.lists()
                    .filter((list) => list.players.length > 0)
                    .map((list) => ({ groupId: list.groupId, playerIds: list.players.map((player) => player.id) }))
            });
            return;
        }

        this.adjust.emit(this.diff(callUp, deadline));
    }

    private validate(deadline: string | null): string | null {
        if (this.total() === 0) {
            return 'Agrega al menos un jugador a la convocatoria.';
        }

        if (!!this.deadlineDate() !== !!this.deadlineTime()) {
            return 'Para la fecha límite, elige la fecha y la hora.';
        }

        if (deadline && (new Date(deadline).getTime() <= Date.now() || new Date(deadline).getTime() >= new Date(this.activityStartsAt()).getTime())) {
            return 'La fecha límite debe estar entre ahora y el inicio de la actividad.';
        }

        return null;
    }

    private diff(callUp: CallUp, deadline: string | null): CallUpAdjustment {
        const original = new Map<string, string>();
        callUp.lists.forEach((list) => list.players.forEach((player) => original.set(player.playerId, list.id)));
        const final = this.assignment();
        const added = new Map<string, string[]>();

        final.forEach((listId, playerId) => {
            if (!original.has(playerId)) {
                added.set(listId, [...(added.get(listId) ?? []), playerId]);
            }
        });

        return {
            removed: [...original.keys()].filter((playerId) => !final.has(playerId)),
            moved: [...original].filter(([playerId, listId]) => final.has(playerId) && final.get(playerId) !== listId).map(([playerId]) => ({ playerId, listId: final.get(playerId)! })),
            added: [...added].map(([listId, playerIds]) => ({ listId, playerIds })),
            // Se compara con el valor normalizado: la base de datos devuelve otro formato de texto.
            deadline: deadline === this.initialDeadline ? undefined : deadline
        };
    }

    private deadlineValue(): string | null {
        const date = this.deadlineDate();
        const time = this.deadlineTime();

        return date && time ? toInstant(isoDate(date), time) : null;
    }

    private setOverride(playerId: string, key: string | null): void {
        const next = new Map(this.overrides());
        next.set(playerId, key);
        this.overrides.set(next);
    }

    private reset(): void {
        const deadline = this.callUp()?.deadline ?? null;
        const local = deadline ? fromInstant(deadline) : null;

        this.selectedGroups.set([]);
        this.overrides.set(new Map());
        this.addPlayerId.set(null);
        this.addTarget.set(null);
        this.localError.set(null);
        this.deadlineDate.set(local ? dateFrom(local.date) : null);
        this.deadlineTime.set(local?.time ?? null);
        this.initialDeadline = deadline ? toInstant(local!.date, local!.time) : null;
    }
}
