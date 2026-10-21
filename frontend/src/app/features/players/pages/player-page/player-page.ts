import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { dayLabel, fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { ageOn, todayInColombia } from '../../../../shared/text/search-text';
import { CopyGuardiansDrawer } from '../../components/copy-guardians-drawer/copy-guardians-drawer';
import { GuardianDrawer } from '../../components/guardian-drawer/guardian-drawer';
import { GuardianPickerDrawer } from '../../components/guardian-picker-drawer/guardian-picker-drawer';
import { PlayerFormDrawer } from '../../components/player-form-drawer/player-form-drawer';
import { GroupsNotSavedError } from '../../data/player.repository';
import { Guardian, GuardianAssignment, PendingGuardian, PlayerInput, PlayerSummary, relationshipLabel, ReviewDecision } from '../../models/player.models';
import { GuardianChoice, PlayerDetailService } from '../../services/player-detail.service';

const STAMP = 'border-2 border-current uppercase tracking-wider';

/**
 * Ficha del jugador con sus acudientes (spec 009; HU-033 y HU-034). Editar y acudientes
 * en drawer; desactivar sin confirmación y eliminar con ella.
 */
@Component({
    selector: 'app-player-page',
    imports: [DatePipe, RouterLink, ButtonModule, ConfirmDialogModule, MenuModule, MessageModule, SkeletonModule, TagModule, PlayerFormDrawer, GuardianDrawer, GuardianPickerDrawer, CopyGuardiansDrawer],
    providers: [PlayerDetailService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <a routerLink="/players" class="mb-3 inline-flex min-h-11 items-center gap-2 text-color no-underline"><i class="pi pi-arrow-left" aria-hidden="true"></i>Jugadores</a>

        @switch (detail.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando jugador">
                    <p-skeleton height="2.5rem" width="60%" />
                    <p-skeleton height="6rem" />
                </div>
            }
            @case ('not_found') {
                <p-message severity="warn" styleClass="mb-4">Este jugador ya no está registrado.</p-message>
                <p-button label="Ver jugadores" [outlined]="true" (onClick)="backToList()" />
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar el jugador. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="detail.load(id())" />
            }
            @default {
                @if (detail.player(); as player) {
                    <div class="mb-5 flex items-end gap-3 border-b-2 border-(--p-text-color) pb-3">
                        <h1 class="m-0 min-w-0 flex-1 break-words">{{ player.firstNames }} {{ player.lastNames }}</h1>
                        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" ariaLabel="Más acciones del jugador" (onClick)="playerMenu.toggle($event)" />
                    </div>

                    <section class="mb-6 flex flex-col gap-2" aria-label="Datos del jugador">
                        <p class="m-0 text-lg font-semibold">
                            @if (player.nickname) {
                                {{ player.nickname }} ·
                            }
                            {{ age() }} años
                        </p>
                        <p class="m-0 text-muted-color">
                            Nació el {{ player.birthDate | date: 'dd/MM/yyyy' : 'UTC' }}
                            @if (player.phone) {
                                · Celular {{ player.phone }}
                            }
                        </p>
                        <div class="flex flex-wrap gap-1.5">
                            @for (group of player.groups; track group.id) {
                                <p-tag severity="secondary" [value]="group.name" />
                            } @empty {
                                <span class="text-sm text-muted-color">Sin grupo</span>
                            }
                            <p-tag [severity]="player.isActive ? 'success' : 'secondary'" [value]="player.isActive ? 'Activo' : 'Inactivo'" [styleClass]="stamp" />
                        </div>
                        <div class="mt-2 flex gap-2">
                            <p-button label="Editar" icon="pi pi-pencil" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="detail.busy()" (onClick)="editOpen.set(true)" />
                            <p-button
                                [label]="player.isActive ? 'Desactivar' : 'Activar'"
                                [icon]="player.isActive ? 'pi pi-ban' : 'pi pi-replay'"
                                severity="secondary"
                                [outlined]="true"
                                class="flex-1 sm:flex-none"
                                styleClass="w-full"
                                [disabled]="detail.busy()"
                                (onClick)="setActive(!player.isActive)"
                            />
                        </div>
                    </section>

                    <!-- Quienes se identificaron desde el enlace de una convocatoria (spec 013, HU-040). -->
                    @if (detail.pending().length > 0) {
                        <section class="rounded-border border border-(--p-text-color) p-4" aria-labelledby="pending-title">
                            <h2 id="pending-title" class="m-0 mb-1 text-xl">Por validar</h2>
                            <ul class="m-0 list-none p-0" aria-label="Acudientes por validar">
                                @for (item of detail.pending(); track pendingKey(item)) {
                                    <li class="flex flex-col gap-1 border-b border-(--p-content-border-color) py-3 last:border-b-0">
                                        <strong>{{ pendingName(item) }}</strong>
                                        <span class="text-sm text-muted-color">{{ pendingDetail(item) }}</span>
                                        <div class="mt-1 flex gap-2">
                                            <p-button label="Rechazar" [outlined]="true" class="flex-1" styleClass="w-full" [ariaLabel]="'Rechazar a ' + pendingName(item)" [disabled]="detail.busy()" (onClick)="review(item, 'reject')" />
                                            <p-button label="Validar" class="flex-1" styleClass="w-full" [ariaLabel]="'Validar a ' + pendingName(item)" [disabled]="detail.busy()" (onClick)="review(item, 'validate')" />
                                        </div>
                                    </li>
                                }
                            </ul>
                        </section>
                    }

                    <section aria-labelledby="guardians-title">
                        <h2 id="guardians-title" class="m-0 mb-3 text-xl">Acudientes</h2>
                        <div class="mb-3 flex gap-2">
                            <p-button label="Agregar acudiente" icon="pi pi-plus" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="detail.busy()" (onClick)="addGuardian()" />
                            @if (siblings().length > 0) {
                                <p-button label="Copiar de un hermano" icon="pi pi-copy" [outlined]="true" class="flex-1 sm:flex-none" styleClass="w-full" [disabled]="detail.busy()" (onClick)="copyOpen.set(true)" />
                            }
                        </div>
                        @if (detail.selfResponder(); as self) {
                            <div class="mb-3 flex min-h-12 items-center gap-3 rounded-border bg-emphasis py-1 pr-1 pl-3">
                                <p class="m-0 min-w-0 flex-1">
                                    <span class="font-semibold">Responde él mismo</span>
                                    <span class="text-muted-color"> · {{ self.phone }}</span>
                                </p>
                                <p-button label="Quitar" [text]="true" severity="secondary" [ariaLabel]="'Dejar de reconocer el celular ' + self.phone" [disabled]="detail.busy()" (onClick)="confirmRemoveSelf(self)" />
                            </div>
                        }
                        @if (detail.guardians().length === 0) {
                            <p class="m-0 border-y border-(--p-content-border-color) py-6 text-muted-color">Aún no tiene acudientes.</p>
                        } @else {
                            <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Acudientes del jugador">
                                @for (guardian of detail.guardians(); track guardian.linkId) {
                                    <li class="flex items-center gap-3 border-b border-(--p-content-border-color) py-2.5 pl-1">
                                        <div class="min-w-0 flex-1">
                                            <p class="m-0 truncate font-semibold">{{ guardian.fullName }}</p>
                                            <p class="m-0 text-sm text-muted-color">
                                                {{ relationshipLabel(guardian) }} · {{ guardian.phone }}
                                                @if (guardian.otherPlayers.length > 0) {
                                                    · También de {{ guardian.otherPlayers.join(', ') }}
                                                }
                                            </p>
                                        </div>
                                        <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" [ariaLabel]="'Acciones de ' + guardian.fullName" (onClick)="openGuardianMenu($event, guardian, guardianMenu)" />
                                    </li>
                                }
                            </ul>
                        }
                    </section>

                    <app-player-form-drawer [open]="editOpen()" [player]="player" [groups]="detail.groups()" [busy]="detail.busy()" [error]="formError()" (save)="update($event)" (closed)="closeEdit()" />
                }
            }
        }

        <app-guardian-picker-drawer
            [open]="pickerOpen()"
            [options]="guardianOptions()"
            [playerName]="detail.player()?.firstNames ?? ''"
            [playerLastNames]="detail.player()?.lastNames ?? ''"
            [busy]="detail.busy()"
            (assign)="assignGuardian($event)"
            (registerNew)="registerNewGuardian()"
            (closed)="pickerOpen.set(false)"
        />
        <app-copy-guardians-drawer [open]="copyOpen()" [siblings]="siblings()" [playerName]="detail.player()?.firstNames ?? ''" (saved)="copied($event)" (closed)="copyOpen.set(false)" />
        <app-guardian-drawer [open]="guardianOpen()" [guardian]="editingGuardian()" [playerName]="detail.player()?.firstNames ?? ''" (saved)="guardianSaved($event)" (closed)="guardianOpen.set(false)" />

        <p-menu #playerMenu [model]="playerMenuItems" [popup]="true" appendTo="body" />
        <p-menu #guardianMenu [model]="guardianMenuItems()" [popup]="true" appendTo="body" />
        <p-confirmdialog />
    `
})
export class PlayerPage implements OnInit {
    protected readonly detail = inject(PlayerDetailService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);
    private readonly router = inject(Router);
    private readonly editDrawer = viewChild(PlayerFormDrawer);

    /** Parámetro `:id` de la ruta (withComponentInputBinding). */
    readonly id = input.required<string>();

    protected readonly stamp = STAMP;
    protected readonly editOpen = signal(false);
    protected readonly formError = signal<string | null>(null);
    protected readonly guardianOpen = signal(false);
    protected readonly pickerOpen = signal(false);
    protected readonly copyOpen = signal(false);
    protected readonly guardianOptions = signal<readonly GuardianChoice[]>([]);
    protected readonly siblings = signal<readonly PlayerSummary[]>([]);
    protected readonly editingGuardian = signal<Guardian | null>(null);
    private readonly menuGuardian = signal<Guardian | null>(null);

    protected readonly age = computed(() => {
        const player = this.detail.player();

        return player ? ageOn(player.birthDate, todayInColombia()) : 0;
    });

    protected readonly playerMenuItems: MenuItem[] = [{ label: 'Eliminar jugador', icon: 'pi pi-trash', command: () => this.confirmRemove() }];

    protected readonly guardianMenuItems = computed<MenuItem[]>(() => {
        const guardian = this.menuGuardian();

        return guardian
            ? [
                  { label: 'Editar', icon: 'pi pi-pencil', command: () => this.openGuardian(guardian) },
                  { label: 'Retirar', icon: 'pi pi-user-minus', command: () => this.confirmRemoveGuardian(guardian) }
              ]
            : [];
    });

    ngOnInit(): void {
        void this.detail.load(this.id()).then(() => this.loadSiblings());
    }

    protected relationshipLabel(guardian: Guardian): string {
        return relationshipLabel(guardian.relationship);
    }

    protected backToList(): void {
        void this.router.navigate(['/players']);
    }

    protected closeEdit(): void {
        this.formError.set(null);
        this.editOpen.set(false);
    }

    protected async update(input: PlayerInput): Promise<void> {
        this.formError.set(null);

        try {
            await this.detail.update(input);
            this.editDrawer()?.markSaved();
            this.closeEdit();
            this.notify('Cambios guardados.');
        } catch (error) {
            if (error instanceof GroupsNotSavedError) {
                this.closeEdit();
                this.messages.add({ severity: 'warn', summary: 'Los datos se guardaron, pero no los grupos. Inténtalo de nuevo.', life: 8000 });
                return;
            }

            this.formError.set(error instanceof AppError && error.code === 'duplicate' ? 'Ya hay otro jugador registrado con esos nombres y fecha de nacimiento.' : this.messageFor(error));
        }
    }

    protected async setActive(active: boolean): Promise<void> {
        await this.runAction(() => this.detail.setActive(active), active ? 'Jugador activado.' : 'Jugador desactivado.');
    }

    protected openGuardian(guardian: Guardian | null): void {
        this.editingGuardian.set(guardian);
        this.guardianOpen.set(true);
    }

    protected openGuardianMenu(event: Event, guardian: Guardian, menu: Menu): void {
        if (!this.detail.busy()) {
            this.menuGuardian.set(guardian);
            menu.toggle(event);
        }
    }

    /** Con acudientes en la academia abre el selector (DEC-43); si no, el registro (CA-006 de HU-035). */
    protected async addGuardian(): Promise<void> {
        try {
            const options = await this.detail.guardianOptions();
            this.guardianOptions.set(options);

            if (options.length > 0) {
                this.pickerOpen.set(true);
            } else {
                this.openGuardian(null);
            }
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
        }
    }

    protected registerNewGuardian(): void {
        this.pickerOpen.set(false);
        this.openGuardian(null);
    }

    protected async assignGuardian(assignment: GuardianAssignment): Promise<void> {
        const name = this.guardianOptions().find((option) => option.guardianId === assignment.guardianId)?.fullName ?? 'El acudiente';

        try {
            await this.detail.assignGuardians([assignment]);
            this.pickerOpen.set(false);
            this.notify(`${name} quedó como acudiente de ${this.detail.player()?.firstNames ?? 'este jugador'}.`);
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
        }
    }

    protected copied(message: string): void {
        this.copyOpen.set(false);
        this.notify(message);
    }

    protected guardianSaved(message: string): void {
        this.guardianOpen.set(false);
        this.notify(message);
    }

    /** Otros jugadores con acudientes; sin ellos no se ofrece «Copiar de un hermano». */
    private async loadSiblings(): Promise<void> {
        try {
            this.siblings.set(await this.detail.siblings());
        } catch {
            this.siblings.set([]);
        }
    }

    private confirmRemove(): void {
        const player = this.detail.player();

        if (!player) {
            return;
        }

        this.confirmation.confirm({
            header: `¿Eliminar a ${player.firstNames} ${player.lastNames}?`,
            message: 'Dejará de aparecer en PlayerTech, junto con sus grupos y acudientes. Esta acción no se puede deshacer desde la aplicación.',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () =>
                void this.runAction(async () => {
                    await this.detail.remove();
                    this.backToList();
                }, 'Jugador eliminado.')
        });
    }

    protected pendingKey(item: PendingGuardian): string {
        return `${item.linkId ?? ''}:${item.deviceId ?? ''}`;
    }

    /** «Luis · papá»: el nombre que escribió la persona, o el registrado. */
    protected pendingName(item: PendingGuardian): string {
        const relationship = relationshipLabel(item.relationship).toLocaleLowerCase('es-CO');

        return `${item.declaredName ?? item.guardianName} · ${relationship}`;
    }

    /** Celular, cuándo y, si aplica, con quién coincide (CA-002 de HU-040). */
    protected pendingDetail(item: PendingGuardian): string {
        const at = fromInstant(item.at);
        const when = `${dayLabel(at.date, todayInColombia())}, ${timeLabel(at.time)}`.toLocaleLowerCase('es-CO');
        const origin = item.linkId ? `Desde el enlace, ${when}` : `Celular nuevo, ${when}`;
        const match = item.phoneMatch ? ` · Coincide con ${item.guardianName}, acudiente registrado.` : '';

        return `${item.phone} · ${origin}${match}`;
    }

    /** Validar va directo; rechazar pide confirmación (FR-012). */
    protected review(item: PendingGuardian, decision: ReviewDecision): void {
        if (decision === 'validate') {
            void this.runAction(() => this.detail.review(item, 'validate'), 'Acudiente validado.');

            return;
        }

        this.confirmation.confirm({
            header: `¿Rechazar a ${item.declaredName ?? item.guardianName}?`,
            message: 'Sus respuestas dejarán de contar y ese celular ya no se reconocerá. No se le avisará.',
            acceptLabel: 'Rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () => void this.runAction(() => this.detail.review(item, 'reject'), 'Rechazado: sus respuestas ya no cuentan.')
        });
    }

    /** Deja de reconocer el celular con el que el jugador responde por sí mismo; podrá identificarse de nuevo. */
    protected confirmRemoveSelf(self: Guardian): void {
        this.confirmation.confirm({
            header: '¿Dejar de reconocer este celular?',
            message: `${this.detail.player()?.firstNames ?? 'El jugador'} tendrá que identificarse de nuevo desde el enlace y validarlo otra vez.`,
            acceptLabel: 'Quitar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () => void this.runAction(() => this.detail.removeGuardian(self), 'Listo: ese celular ya no se reconoce.')
        });
    }

    private confirmRemoveGuardian(guardian: Guardian): void {
        this.confirmation.confirm({
            header: `¿Retirar a ${guardian.fullName}?`,
            message: `Dejará de ser acudiente de ${this.detail.player()?.firstNames ?? 'este jugador'}.`,
            acceptLabel: 'Retirar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () => void this.runAction(() => this.detail.removeGuardian(guardian), 'Acudiente retirado.')
        });
    }

    private async runAction(action: () => Promise<void>, success: string): Promise<void> {
        try {
            await action();
            this.notify(success);
        } catch (error) {
            this.messages.add({ severity: 'error', summary: 'No se pudo completar la acción', detail: this.messageFor(error), life: 6000 });
        }
    }

    private notify(summary: string): void {
        this.messages.add({ severity: 'success', summary, life: 4000 });
    }

    private messageFor(error: unknown): string {
        return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
    }
}
