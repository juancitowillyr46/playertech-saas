import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { searchKey } from '../../../../shared/text/search-text';
import { GroupMember } from '../../models/group.models';

/** Agregar varios jugadores activos a un grupo con buscador (spec 009, HU-004; SC-004). */
@Component({
    selector: 'app-add-members-drawer',
    imports: [FormsModule, CheckboxModule, IconFieldModule, InputIconModule, InputTextModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" title="Agregar jugadores" [busy]="busy()" [dirty]="selected().size > 0" [saveLabel]="saveLabel()" [saveDisabled]="selected().size === 0" (save)="save.emit([...selected()])" (closed)="closed.emit()">
            <p-iconfield class="mb-4 block">
                <p-inputicon class="pi pi-search" />
                <input pInputText type="search" aria-label="Buscar jugador" placeholder="Nombre o apodo" class="w-full" [ngModel]="query()" (ngModelChange)="query.set($event)" />
            </p-iconfield>

            @if (candidates().length === 0) {
                <p class="m-0 text-muted-color">Todos los jugadores activos ya están en este grupo.</p>
            } @else if (visible().length === 0) {
                <p class="m-0 text-muted-color">Ningún jugador coincide con la búsqueda.</p>
            } @else {
                <ul class="m-0 list-none p-0" aria-label="Jugadores disponibles">
                    @for (player of visible(); track player.playerId) {
                        <li class="border-b border-(--p-content-border-color)">
                            <label [for]="'candidate-' + player.playerId" class="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                                <p-checkbox [binary]="true" [inputId]="'candidate-' + player.playerId" [ngModel]="selected().has(player.playerId)" (ngModelChange)="toggle(player.playerId)" />
                                <span class="min-w-0 truncate">{{ player.firstNames }} {{ player.lastNames }}@if (player.nickname) { · {{ player.nickname }} }</span>
                            </label>
                        </li>
                    }
                </ul>
            }
        </app-form-drawer>
    `
})
export class AddMembersDrawer {
    readonly open = input.required<boolean>();
    readonly candidates = input<readonly GroupMember[]>([]);
    readonly busy = input(false);

    readonly save = output<string[]>();
    readonly closed = output<void>();

    protected readonly query = signal('');
    protected readonly selected = signal<ReadonlySet<string>>(new Set());

    protected readonly visible = computed(() => {
        const query = searchKey(this.query());

        return this.candidates().filter((player) => !query || searchKey(`${player.firstNames} ${player.lastNames} ${player.nickname ?? ''}`).includes(query));
    });

    protected readonly saveLabel = computed(() => {
        const count = this.selected().size;

        return count === 0 ? 'Agregar' : count === 1 ? 'Agregar 1 jugador' : `Agregar ${count} jugadores`;
    });

    constructor() {
        effect(() => {
            if (this.open()) {
                this.query.set('');
                this.selected.set(new Set());
            }
        });
    }

    protected toggle(playerId: string): void {
        const next = new Set(this.selected());

        if (!next.delete(playerId)) {
            next.add(playerId);
        }

        this.selected.set(next);
    }
}
