import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { Activity } from '../../../activities/models/activity.models';
import { Absence, AbsenceCandidate, AbsenceRecipient } from '../../models/absence.models';
import { AbsenceService } from '../../services/absence.service';
import { AbsenceListDrawer } from '../absence-list-drawer/absence-list-drawer';
import { AbsenceNoticeDrawer } from '../absence-notice-drawer/absence-notice-drawer';

/**
 * Sección «¿Quién no llegó?» del detalle de una actividad (spec 015, mockups/Main; HU-042).
 * Aparece desde el inicio; desde el día siguiente queda en lectura. No aparece en una
 * actividad cancelada.
 */
@Component({
    selector: 'app-absence-section',
    imports: [ButtonModule, MessageModule, AbsenceListDrawer, AbsenceNoticeDrawer],
    providers: [AbsenceService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (visible()) {
            <section class="mt-8" aria-labelledby="absence-title">
                <h2 id="absence-title" class="m-0 mb-3 text-xl">¿Quién no llegó?</h2>

                @if (loadError()) {
                    <p-message severity="error">No pudimos cargar las ausencias. Revisa tu conexión e inténtalo de nuevo.</p-message>
                } @else {
                    <p class="m-0 mb-2 text-lg font-semibold">{{ service.summary() }}</p>
                    @if (absent().length > 0) {
                        <ul class="m-0 mb-4 flex list-none flex-col gap-1 p-0 text-muted-color" aria-label="No llegaron">
                            @for (absence of absent(); track absence.playerId) {
                                <li>{{ absence.fullName }} · {{ notifiedText(absence) }}</li>
                            }
                        </ul>
                    }

                    @if (service.window() === 'open') {
                        <p-button label="Marcar quién no llegó" icon="pi pi-user-minus" styleClass="w-full sm:w-auto" [loading]="opening()" (onClick)="openList()" />
                        <p class="m-0 mt-2 text-sm text-muted-color">Puedes marcar hasta las 11:59 p. m. de hoy. Mañana queda en modo lectura.</p>
                    } @else {
                        <p class="m-0 text-sm text-muted-color">Ya pasó el día de la actividad: la lista queda en modo lectura.</p>
                    }
                }
            </section>

            <app-absence-list-drawer [open]="listOpen()" (notify)="openNotice($event)" (closed)="listOpen.set(false)" />
            <app-absence-notice-drawer [open]="noticeOpen()" [activity]="activity()" [candidate]="noticeCandidate()" [recipients]="recipients()" (notified)="notified($event)" (failed)="warn($event)" (closed)="noticeOpen.set(false)" />
        }
    `
})
export class AbsenceSection {
    protected readonly service = inject(AbsenceService);
    private readonly messages = inject(MessageService);

    readonly activity = input.required<Activity>();

    protected readonly loadError = signal(false);
    protected readonly opening = signal(false);
    protected readonly listOpen = signal(false);
    protected readonly noticeOpen = signal(false);
    protected readonly noticeCandidate = signal<AbsenceCandidate | null>(null);
    protected readonly recipients = signal<readonly AbsenceRecipient[]>([]);

    protected readonly visible = computed(() => this.activity().status === 'scheduled' && this.service.window() !== 'before');
    protected readonly absent = computed(() => [...this.service.absent()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')));

    constructor() {
        effect(() => {
            const activity = this.activity();
            untracked(() => void this.load(activity));
        });
    }

    protected notifiedText(absence: Absence): string {
        return absence.notifiedAt ? `avisado ${timeLabel(fromInstant(absence.notifiedAt).time)}` : 'sin avisar';
    }

    protected async openList(): Promise<void> {
        this.opening.set(true);

        try {
            await this.service.loadCandidates();
            this.listOpen.set(true);
        } catch (error) {
            this.toastError(error);
        } finally {
            this.opening.set(false);
        }
    }

    protected async openNotice(candidate: AbsenceCandidate): Promise<void> {
        try {
            this.recipients.set(await this.service.recipients(candidate));
            this.noticeCandidate.set(candidate);
            this.noticeOpen.set(true);
        } catch (error) {
            this.toastError(error);
        }
    }

    /** El chat ya se abrió o el mensaje se copió: se registra «Avisado» después. */
    protected async notified(summary: string): Promise<void> {
        const candidate = this.noticeCandidate();
        this.noticeOpen.set(false);

        if (!candidate) {
            return;
        }

        try {
            await this.service.notified(candidate.playerId);
            this.messages.add({ severity: 'success', summary, life: 4000 });
        } catch (error) {
            this.toastError(error);
        }
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

    private toastError(error: unknown): void {
        this.messages.add({ severity: 'error', summary: error instanceof Error && error.message ? error.message : ERROR_MESSAGES.unknown, life: 6000 });
    }
}
