import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { map } from 'rxjs';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { searchKey } from '../../../../shared/text/search-text';
import { AbsenceCandidate, AbsenceSection } from '../../models/absence.models';
import { AbsenceService } from '../../services/absence.service';

/** Por encima de este número de jugadores aparece el buscador. */
const SEARCH_FROM = 12;

const SECTION_TITLES: Record<Exclude<AbsenceSection, 'group'>, string> = {
    yes: 'Dijeron Sí',
    pending: 'Provisional o sin respuesta',
    no: 'Avisaron que no'
};

/**
 * Lista «¿Quién no llegó?» (spec 015, mockups/Groups y CallUp; CA-002 y CA-003 de HU-042).
 * Un toque marca o desmarca al momento; con un jugador marcado aparece «Avisar».
 */
@Component({
    selector: 'app-absence-list-drawer',
    imports: [FormsModule, ButtonModule, DrawerModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-drawer
            [visible]="open()"
            position="right"
            [fullScreen]="isMobile()"
            [showCloseIcon]="false"
            [blockScroll]="true"
            styleClass="w-full md:w-[30rem]"
            [pt]="{ root: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'absence-list-title' } }"
            (onHide)="closed.emit()"
        >
            <ng-template #header>
                <div class="flex w-full items-center justify-between gap-2">
                    <h2 id="absence-list-title" class="m-0 text-xl">¿Quién no llegó?</h2>
                    <p-button icon="pi pi-times" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Cerrar" (onClick)="closed.emit()" />
                </div>
            </ng-template>

            @if (!service.hasCallUp()) {
                <fieldset class="m-0 mb-4 border-0 p-0">
                    <legend class="mb-2 p-0 text-muted-color">Elige los grupos que vinieron hoy</legend>
                    <div class="flex flex-wrap gap-2">
                        @for (group of service.groups(); track group.id) {
                            <p-button [label]="group.name" [rounded]="true" [outlined]="!isSelected(group.id)" [icon]="isSelected(group.id) ? 'pi pi-check' : ''" [attr.aria-pressed]="isSelected(group.id)" (onClick)="toggleGroup(group.id)" />
                        } @empty {
                            <p class="m-0 text-muted-color">La academia aún no tiene grupos.</p>
                        }
                    </div>
                </fieldset>
            }

            @if (service.candidates().length > searchFrom) {
                <div class="mb-4 flex flex-col gap-2">
                    <label for="absence-search" class="text-sm text-muted-color">Buscar jugador</label>
                    <input pInputText id="absence-search" type="search" placeholder="Nombre o apodo" class="w-full" [ngModel]="query()" (ngModelChange)="query.set($event)" />
                </div>
            }

            @if (service.candidates().length > 0) {
                <p class="m-0 mb-2 text-sm text-muted-color">{{ service.candidates().length === 1 ? '1 jugador' : service.candidates().length + ' jugadores' }}{{ readonly() ? '' : ' · toca a quien no llegó' }}</p>
            }

            @for (section of sections(); track section.key) {
                @if (section.title) {
                    <h3 class="m-0 mt-4 mb-2 text-sm font-semibold tracking-wider text-muted-color uppercase">{{ section.title }} ({{ section.players.length }})</h3>
                }
                <ul class="m-0 flex list-none flex-col gap-2 p-0" [attr.aria-label]="section.title ?? 'Jugadores'">
                    @for (player of section.players; track player.playerId) {
                        <li class="flex min-h-13 items-center gap-2 rounded-border border pr-2" [class]="service.isAbsent(player.playerId) ? 'border-2 border-primary bg-emphasis' : 'border-(--p-content-border-color)'">
                            <button
                                type="button"
                                class="flex min-h-13 min-w-0 flex-1 cursor-pointer flex-col items-start justify-center gap-0.5 border-0 bg-transparent py-1.5 pl-3 text-left text-color disabled:cursor-default"
                                [class.text-muted-color]="player.section === 'no' && !service.isAbsent(player.playerId)"
                                [attr.aria-pressed]="service.isAbsent(player.playerId)"
                                [attr.aria-label]="player.fullName + (service.isAbsent(player.playerId) ? ', no llegó' : '')"
                                [disabled]="readonly()"
                                (click)="toggle(player)"
                            >
                                <span class="max-w-full truncate" [class.font-semibold]="service.isAbsent(player.playerId)">{{ player.fullName }}</span>
                                @if (statusOf(player); as status) {
                                    <span class="max-w-full truncate text-sm">{{ status }}</span>
                                }
                            </button>
                            @if (service.isAbsent(player.playerId) && !readonly()) {
                                <p-button label="Avisar" [outlined]="true" [ariaLabel]="'Avisar sobre ' + player.fullName" (onClick)="notify.emit(player)" />
                            }
                        </li>
                    }
                </ul>
            } @empty {
                @if (!service.hasCallUp() && service.selectedGroups().length === 0) {
                    <p class="m-0 text-muted-color">Elige uno o varios grupos para ver a sus jugadores.</p>
                } @else {
                    <p class="m-0 text-muted-color">No hay jugadores que coincidan.</p>
                }
            }

            <ng-template #footer>
                <div class="flex flex-col gap-2">
                    <p class="m-0 text-center font-semibold" aria-live="polite">{{ service.summary() }}</p>
                    <p-button label="Listo" [outlined]="true" styleClass="w-full" (onClick)="closed.emit()" />
                </div>
            </ng-template>
        </p-drawer>
    `
})
export class AbsenceListDrawer {
    protected readonly service = inject(AbsenceService);
    private readonly messages = inject(MessageService);

    readonly open = input.required<boolean>();
    /** Desde el día siguiente solo se consulta (CA-001). */
    readonly readonly = input(false);

    readonly notify = output<AbsenceCandidate>();
    readonly closed = output<void>();

    protected readonly searchFrom = SEARCH_FROM;
    protected readonly query = signal('');
    protected readonly isMobile = toSignal(
        inject(BreakpointObserver)
            .observe('(max-width: 767.98px)')
            .pipe(map((state) => state.matches)),
        { initialValue: false }
    );

    protected readonly sections = computed(() => {
        const key = searchKey(this.query());
        const players = this.service.candidates().filter((player) => !key || searchKey(player.fullName).includes(key));

        if (!this.service.hasCallUp()) {
            return players.length > 0 ? [{ key: 'group', title: null, players }] : [];
        }

        return (['yes', 'pending', 'no'] as const).map((section) => ({ key: section, title: SECTION_TITLES[section], players: players.filter((player) => player.section === section) })).filter((section) => section.players.length > 0);
    });

    protected isSelected(groupId: string): boolean {
        return this.service.selectedGroups().includes(groupId);
    }

    protected toggleGroup(groupId: string): void {
        const selected = this.service.selectedGroups();
        this.service.selectGroups(selected.includes(groupId) ? selected.filter((id) => id !== groupId) : [...selected, groupId]);
    }

    /** «No llegó · avisado 4:12 p. m.»; con convocatoria, antes su respuesta. */
    protected statusOf(player: AbsenceCandidate): string {
        const absence = this.service.absenceOf(player.playerId);
        const parts = player.responseLabel ? [player.responseLabel] : [];

        if (absence?.active) {
            parts.push('No llegó');

            if (absence.notifiedAt) {
                parts.push(`avisado ${timeLabel(fromInstant(absence.notifiedAt).time)}`);
            }
        }

        return parts.join(' · ');
    }

    protected async toggle(player: AbsenceCandidate): Promise<void> {
        try {
            await this.service.toggle(player);
        } catch (error) {
            this.messages.add({ severity: 'error', summary: error instanceof Error && error.message ? error.message : ERROR_MESSAGES.unknown, life: 6000 });
        }
    }
}
