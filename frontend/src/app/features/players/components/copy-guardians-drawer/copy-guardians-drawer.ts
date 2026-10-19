import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { searchKey } from '../../../../shared/text/search-text';
import { PlayerSummary, Relationship, RELATIONSHIP_LABELS, shortName } from '../../models/player.models';
import { PlayerDetailService } from '../../services/player-detail.service';

interface CopyRow {
    readonly guardianId: string;
    readonly fullName: string;
    readonly phone: string;
    readonly alreadyLinked: boolean;
    selected: boolean;
    relationship: Relationship;
}

/**
 * Copiar a un jugador los acudientes de un hermano (spec 010, CA-005 de HU-035; DEC-43).
 * Usa PlayerDetailService, que provee la ficha; al asignar emite el aviso para la página.
 */
@Component({
    selector: 'app-copy-guardians-drawer',
    imports: [FormsModule, ButtonModule, CheckboxModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, SelectModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer
            [open]="open()"
            title="Copiar acudientes de un hermano"
            [busy]="detail.busy()"
            [dirty]="!!sibling()"
            [saveLabel]="saveLabel()"
            [saveDisabled]="selectedCount() === 0"
            (save)="submit()"
            (closed)="closed.emit()"
        >
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-5">{{ message }}</p-message>
            }

            @if (sibling(); as chosen) {
                <p class="m-0 mb-2 text-sm text-muted-color">Hermano</p>
                <div class="mb-5 flex min-h-13 items-center justify-between gap-2 rounded-border border border-(--p-content-border-color) pl-3">
                    <span class="min-w-0 truncate font-semibold">{{ label(chosen) }}</span>
                    <p-button label="Cambiar" [text]="true" severity="secondary" (onClick)="sibling.set(null)" />
                </div>

                <p class="m-0 mb-2 text-sm text-muted-color">Acudientes que pasan a {{ playerName() }}</p>
                <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Acudientes del hermano">
                    @for (row of rows(); track row.guardianId) {
                        <li class="flex items-center gap-3 border-b border-(--p-content-border-color) py-2">
                            <p-checkbox [binary]="true" [inputId]="'copy-' + row.guardianId" [disabled]="row.alreadyLinked" [(ngModel)]="row.selected" (ngModelChange)="touch()" />
                            <label [for]="'copy-' + row.guardianId" class="flex min-w-0 flex-1 flex-col" [class.text-muted-color]="row.alreadyLinked">
                                <span class="truncate font-semibold">{{ row.fullName }}</span>
                                <span class="text-sm">{{ row.alreadyLinked ? 'Ya es acudiente de ' + playerName() : row.phone }}</span>
                            </label>
                            @if (!row.alreadyLinked) {
                                <p-select
                                    [options]="relationshipOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    [ariaLabel]="'Parentesco de ' + row.fullName"
                                    appendTo="body"
                                    styleClass="w-36"
                                    [(ngModel)]="row.relationship"
                                />
                            }
                        </li>
                    }
                </ul>
                @if (allLinked()) {
                    <p class="m-0 mt-3 text-muted-color">Todos sus acudientes ya son de {{ playerName() }}.</p>
                } @else {
                    <p class="m-0 mt-3 text-sm text-muted-color">El parentesco viene del hermano y se puede cambiar. No se pide de nuevo la autorización de datos.</p>
                }
            } @else {
                <p-iconfield class="mb-4 block">
                    <p-inputicon class="pi pi-search" />
                    <input pInputText type="search" aria-label="Buscar hermano" placeholder="Nombre o apodo" class="w-full" [ngModel]="query()" (ngModelChange)="query.set($event)" />
                </p-iconfield>
                <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Jugadores con acudientes">
                    @for (player of visibleSiblings(); track player.id) {
                        <li class="border-b border-(--p-content-border-color)">
                            <button type="button" class="flex min-h-13 w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent px-1 text-left text-color" (click)="choose(player)">
                                <span class="min-w-0 truncate font-semibold">{{ label(player) }}</span>
                                <span class="shrink-0 text-sm text-muted-color">{{ player.guardianCount === 1 ? '1 acudiente' : player.guardianCount + ' acudientes' }}</span>
                            </button>
                        </li>
                    } @empty {
                        <li class="py-4 text-muted-color">Ningún jugador coincide con la búsqueda.</li>
                    }
                </ul>
            }
        </app-form-drawer>
    `
})
export class CopyGuardiansDrawer {
    protected readonly detail = inject(PlayerDetailService);

    readonly open = input.required<boolean>();
    readonly siblings = input<readonly PlayerSummary[]>([]);
    readonly playerName = input('');

    /** Asignación hecha: el texto del aviso de confirmación. */
    readonly saved = output<string>();
    readonly closed = output<void>();

    protected readonly relationshipOptions = (Object.keys(RELATIONSHIP_LABELS) as Relationship[]).map((value) => ({ value, label: RELATIONSHIP_LABELS[value] }));
    protected readonly query = signal('');
    protected readonly sibling = signal<PlayerSummary | null>(null);
    protected readonly rows = signal<CopyRow[]>([]);
    protected readonly error = signal<string | null>(null);
    /** Las casillas cambian filas mutables: este contador hace recalcular los totales. */
    private readonly version = signal(0);

    protected readonly visibleSiblings = computed(() => {
        const query = searchKey(this.query());

        return this.siblings().filter((player) => !query || searchKey(`${player.firstNames} ${player.lastNames} ${player.nickname ?? ''}`).includes(query));
    });

    protected readonly selectedCount = computed(() => {
        this.version();

        return this.rows().filter((row) => row.selected && !row.alreadyLinked).length;
    });

    protected readonly allLinked = computed(() => this.rows().length > 0 && this.rows().every((row) => row.alreadyLinked));

    protected readonly saveLabel = computed(() => {
        const count = this.selectedCount();

        return count === 0 ? 'Asignar' : count === 1 ? 'Asignar 1 acudiente' : `Asignar ${count} acudientes`;
    });

    constructor() {
        effect(() => {
            if (this.open()) {
                this.query.set('');
                this.sibling.set(null);
                this.rows.set([]);
                this.error.set(null);
            }
        });
    }

    protected label(player: PlayerSummary): string {
        return player.nickname ? `${shortName(player)} · ${player.nickname}` : shortName(player);
    }

    protected touch(): void {
        this.version.update((value) => value + 1);
    }

    protected async choose(player: PlayerSummary): Promise<void> {
        this.error.set(null);

        try {
            const linked = new Set(this.detail.guardians().map((guardian) => guardian.guardianId));
            const guardians = await this.detail.siblingGuardians(player.id);

            this.rows.set(
                guardians.map((guardian) => ({
                    guardianId: guardian.guardianId,
                    fullName: guardian.fullName,
                    phone: guardian.phone,
                    alreadyLinked: linked.has(guardian.guardianId),
                    selected: !linked.has(guardian.guardianId),
                    relationship: guardian.relationship
                }))
            );
            this.sibling.set(player);
        } catch (error) {
            this.error.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }

    protected async submit(): Promise<void> {
        const assignments = this.rows()
            .filter((row) => row.selected && !row.alreadyLinked)
            .map((row) => ({ guardianId: row.guardianId, relationship: row.relationship }));

        if (assignments.length === 0 || this.detail.busy()) {
            return;
        }

        this.error.set(null);

        try {
            const assigned = await this.detail.assignGuardians(assignments);
            this.saved.emit(assigned === 1 ? `1 acudiente asignado a ${this.playerName()}.` : `${assigned} acudientes asignados a ${this.playerName()}.`);
        } catch (error) {
            this.error.set(error instanceof AppError ? error.message : ERROR_MESSAGES.unknown);
        }
    }
}
