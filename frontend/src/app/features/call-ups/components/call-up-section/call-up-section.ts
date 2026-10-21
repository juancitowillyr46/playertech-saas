import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { dateLabel, fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { Activity, isPast } from '../../../activities/models/activity.models';
import { GroupRef, PlayerSummary, shortName } from '../../../players/models/player.models';
import { CallUpList, CallUpListInput, CallUpPlayer } from '../../models/call-up.models';
import { CallUpAdjustment, CallUpService } from '../../services/call-up.service';
import { CallUpDrawer } from '../call-up-drawer/call-up-drawer';
import { MessageDrawer } from '../message-drawer/message-drawer';
import { CallUpNotice, NoticeDrawer } from '../notice-drawer/notice-drawer';

const STAMP = 'border-2 border-current uppercase tracking-wider';

/**
 * Sección «Convocatoria» del detalle de una actividad (spec 012; HU-007, HU-008, HU-012,
 * HU-013 y HU-038). Convocar, ajustar, cerrar, mensajes y avisos.
 */
@Component({
    selector: 'app-call-up-section',
    imports: [ButtonModule, MessageModule, TagModule, CallUpDrawer, MessageDrawer, NoticeDrawer],
    providers: [CallUpService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="mt-8" aria-labelledby="callup-title">
            <div class="mb-3 flex items-center justify-between gap-3">
                <h2 id="callup-title" class="m-0 text-xl">Convocatoria</h2>
                @if (callUp()) {
                    <p-tag [severity]="service.isOpen() ? 'success' : 'secondary'" [value]="service.isOpen() ? 'Abierta' : 'Cerrada'" [styleClass]="stamp" />
                }
            </div>

            @if (loadError()) {
                <p-message severity="error" styleClass="mb-3">No pudimos cargar la convocatoria. Revisa tu conexión e inténtalo de nuevo.</p-message>
            } @else if (!callUp()) {
                @if (convocable()) {
                    <p class="m-0 mb-3 text-muted-color">Aún no has convocado a esta actividad.</p>
                    <p-button label="Convocar" icon="pi pi-users" styleClass="w-full sm:w-auto" [disabled]="service.busy()" (onClick)="openDrawer()" />
                } @else {
                    <p class="m-0 text-muted-color">Solo se convoca a actividades próximas y no canceladas.</p>
                }
            } @else {
                <p class="m-0 mb-4 text-muted-color">{{ deadlineText() }}</p>

                @for (list of callUp()!.lists; track list.id) {
                    <div class="mb-4">
                        <div class="mb-2 flex items-center justify-between gap-3 rounded-border border border-(--p-content-border-color) py-2 pr-2 pl-3">
                            <span class="min-w-0">
                                <span class="font-semibold">{{ list.groupName ?? 'Convocados' }}</span>
                                <span class="text-muted-color"> · {{ list.players.length === 1 ? '1 convocado' : list.players.length + ' convocados' }}</span>
                            </span>
                            <p-button label="Mensaje" icon="pi pi-comment" [ariaLabel]="'Mensaje para ' + (list.groupName ?? 'los convocados')" (onClick)="openMessage(list, null)" />
                        </div>
                        <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" [attr.aria-label]="'Convocados de ' + (list.groupName ?? 'la convocatoria')">
                            @for (player of list.players; track player.playerId) {
                                <li class="flex min-h-11 items-center justify-between gap-2 border-b border-(--p-content-border-color) pl-1">
                                    <span class="min-w-0 truncate">{{ playerLabel(player) }}</span>
                                    <p-button label="Enviar" [text]="true" [ariaLabel]="'Enviar a ' + playerLabel(player)" (onClick)="openMessage(list, player)" />
                                </li>
                            }
                        </ul>
                    </div>
                }

                @if (service.isOpen()) {
                    <div class="flex gap-2">
                        <p-button label="Ajustar" ariaLabel="Ajustar convocados" icon="pi pi-pencil" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="service.busy()" (onClick)="openDrawer()" />
                        <p-button label="Cerrar" ariaLabel="Cerrar convocatoria" icon="pi pi-lock" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="service.busy()" (onClick)="confirmClose()" />
                    </div>
                }
            }
        </section>

        <app-call-up-drawer
            [open]="drawerOpen()"
            [callUp]="callUp()"
            [candidates]="candidates()"
            [groups]="groups()"
            [activityStartsAt]="activity().startsAt"
            [busy]="service.busy()"
            [error]="drawerError()"
            (create)="create($event)"
            (adjust)="adjust($event)"
            (closed)="drawerOpen.set(false)"
        />
        <app-message-drawer
            [open]="messageOpen()"
            [activity]="activity()"
            [list]="messageList()"
            [player]="messagePlayer()"
            [deadline]="callUp()?.deadline ?? null"
            [busy]="service.busy()"
            (saveIntro)="saveIntro($event)"
            (done)="notify($event)"
            (failed)="warn($event)"
            (closed)="messageOpen.set(false)"
        />
        <app-notice-drawer [open]="noticeOpen()" [notice]="notice()" [lists]="callUp()?.lists ?? []" (done)="notify($event)" (failed)="warn($event)" (closed)="noticeOpen.set(false)" />
    `
})
export class CallUpSection {
    protected readonly service = inject(CallUpService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);

    readonly activity = input.required<Activity>();

    protected readonly stamp = STAMP;
    protected readonly callUp = this.service.callUp;
    protected readonly loadError = signal(false);
    protected readonly drawerOpen = signal(false);
    protected readonly drawerError = signal<string | null>(null);
    protected readonly candidates = signal<readonly PlayerSummary[]>([]);
    protected readonly groups = signal<readonly GroupRef[]>([]);
    protected readonly messageOpen = signal(false);
    protected readonly messageList = signal<CallUpList | null>(null);
    protected readonly messagePlayer = signal<CallUpPlayer | null>(null);
    protected readonly noticeOpen = signal(false);
    protected readonly notice = signal<CallUpNotice | null>(null);

    /** Próxima y programada (CA-007 de HU-007). */
    protected readonly convocable = computed(() => this.activity().status === 'scheduled' && !isPast(this.activity()));

    protected readonly deadlineText = computed(() => {
        const callUp = this.callUp();

        if (!callUp) {
            return '';
        }

        if (!this.service.isOpen()) {
            return 'Ya no se aceptan respuestas.';
        }

        if (!callUp.deadline) {
            return 'Se responde hasta que empiece la actividad.';
        }

        const local = fromInstant(callUp.deadline);

        return `Responde hasta el ${dateLabel(local.date, todayInColombia()).toLocaleLowerCase('es-CO')}, ${timeLabel(local.time)}.`;
    });

    constructor() {
        // Cada vez que la actividad cambia (por ejemplo, tras editarla), se relee su convocatoria.
        effect(() => {
            const activity = this.activity();
            untracked(() => void this.load(activity));
        });
    }

    /** Abierta ahora (el detalle lo consulta antes de cancelar o cambiar la actividad). */
    isOpen(): boolean {
        return this.service.isOpen();
    }

    /** Un nuevo inicio quedaría en o antes de la fecha límite abierta. */
    deadlineConflicts(newStartsAt: string): boolean {
        return this.service.deadlineConflicts(newStartsAt);
    }

    /** Ofrece el aviso de cancelación o cambio (HU-038) y relee la convocatoria. */
    async offerNotice(notice: CallUpNotice): Promise<void> {
        await this.service.refresh();
        this.notice.set(notice);
        this.noticeOpen.set(true);
    }

    protected playerLabel(player: CallUpPlayer): string {
        return player.nickname ? `${shortName(player)} · ${player.nickname}` : shortName(player);
    }

    protected async openDrawer(): Promise<void> {
        this.drawerError.set(null);

        try {
            const [candidates, groups] = await Promise.all([this.service.candidates(), this.service.groups()]);
            this.candidates.set(candidates);
            this.groups.set(groups);
            this.drawerOpen.set(true);
        } catch (error) {
            this.toastError(error);
        }
    }

    protected openMessage(list: CallUpList, player: CallUpPlayer | null): void {
        this.messageList.set(list);
        this.messagePlayer.set(player);
        this.messageOpen.set(true);
    }

    protected async create(result: { deadline: string | null; lists: CallUpListInput[] }): Promise<void> {
        await this.save(() => this.service.create(result.deadline, result.lists), 'Convocatoria creada. Ya puedes compartir el mensaje.');
    }

    protected async adjust(changes: CallUpAdjustment): Promise<void> {
        await this.save(() => this.service.adjust(changes), 'Convocatoria actualizada.');
    }

    protected async saveIntro(change: { listId: string; intro: string | null }): Promise<void> {
        try {
            await this.service.saveIntro(change.listId, change.intro);
        } catch (error) {
            this.toastError(error);
        }
    }

    protected confirmClose(): void {
        this.confirmation.confirm({
            header: '¿Cerrar la convocatoria?',
            message: 'Los enlaces dejarán de aceptar respuestas y no se podrá reabrir.',
            acceptLabel: 'Cerrar convocatoria',
            rejectLabel: 'Volver',
            rejectButtonProps: { outlined: true },
            accept: () =>
                void (async () => {
                    try {
                        await this.service.close();
                        this.notify('Convocatoria cerrada.');
                    } catch (error) {
                        this.toastError(error);
                    }
                })()
        });
    }

    protected notify(summary: string): void {
        this.messages.add({ severity: 'success', summary, life: 4000 });
    }

    protected warn(summary: string): void {
        this.messages.add({ severity: 'warn', summary, life: 6000 });
    }

    private async load(activity: Activity): Promise<void> {
        this.loadError.set(false);

        try {
            await this.service.load(activity);
        } catch {
            this.loadError.set(true);
        }
    }

    private async save(operation: () => Promise<void>, success: string): Promise<void> {
        this.drawerError.set(null);

        try {
            await operation();
            this.drawerOpen.set(false);
            this.notify(success);
        } catch (error) {
            this.drawerError.set(this.messageFor(error));
        }
    }

    private toastError(error: unknown): void {
        this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
    }

    private messageFor(error: unknown): string {
        if (error instanceof AppError && error.code === 'rule_violation') {
            return 'La convocatoria ya está cerrada o algún dato ya no es válido. Revisa la fecha límite y los convocados.';
        }

        if (error instanceof AppError && error.code === 'duplicate') {
            return 'Ese jugador ya está convocado, o la actividad ya tiene convocatoria.';
        }

        return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
    }
}
