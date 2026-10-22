import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AppError } from '../../../../core/errors/app-error';
import { ERROR_MESSAGES } from '../../../../core/errors/error-messages';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { dayLabel, fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { LinkRelationship, relationshipLabel, ReviewDecision } from '../../models/player.models';
import { PendingPerson, PendingReviewsService } from '../../services/pending-reviews.service';

/**
 * Drawer «Por validar» (spec 014, CA-004 de HU-041): una tarjeta por persona con su celular,
 * los jugadores nuevos que eligió y los que ya acompaña. «Validar» va directo; «Rechazar» pide
 * confirmación (HU-040). Agrupado por persona (ajuste del 2026-10-22).
 */
@Component({
    selector: 'app-pending-reviews-drawer',
    imports: [ButtonModule, MessageModule, FormDrawer],
    providers: [PendingReviewsService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="'Por validar (' + service.people().length + ')'" saveLabel="Listo" cancelLabel="Cerrar" (save)="closed.emit()" (closed)="closed.emit()">
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-4">{{ message }}</p-message>
            }

            @if (service.people().length === 0) {
                <p class="m-0 text-muted-color">No hay acudientes por validar.</p>
            } @else {
                <p class="m-0 mb-4 text-muted-color">Personas que se identificaron desde un enlace. Valida solo si son acudientes de esos jugadores.</p>
                <ul class="m-0 flex list-none flex-col gap-3 p-0" aria-label="Personas por validar">
                    @for (person of service.people(); track person.key) {
                        <li class="flex flex-col gap-1 rounded-border border border-(--p-content-border-color) p-3">
                            <strong>{{ name(person) }}</strong>
                            <span class="text-sm text-muted-color">{{ detail(person) }}</span>
                            @if (person.phoneMatch) {
                                <span class="text-sm text-muted-color">Coincide con {{ person.guardianName }}, acudiente registrado.</span>
                            }
                            <ul class="m-0 mt-1 flex list-none flex-col gap-0.5 p-0 text-sm">
                                @for (link of person.newLinks; track link.linkId) {
                                    <li>Nuevo vínculo: {{ link.playerName }} ({{ relation(link.relationship) }})</li>
                                }
                                @if (person.knownPlayers.length > 0) {
                                    <li>Ya es acudiente de: {{ person.knownPlayers.join(', ') }}</li>
                                }
                            </ul>
                            <div class="mt-2 flex gap-2">
                                <p-button label="Rechazar" [outlined]="true" class="flex-1" styleClass="w-full" [ariaLabel]="'Rechazar a ' + name(person)" [disabled]="service.busy()" (onClick)="review(person, 'reject')" />
                                <p-button label="Validar" class="flex-1" styleClass="w-full" [ariaLabel]="'Validar a ' + name(person)" [disabled]="service.busy()" (onClick)="review(person, 'validate')" />
                            </div>
                        </li>
                    }
                </ul>
            }
        </app-form-drawer>
    `
})
export class PendingReviewsDrawer {
    readonly open = input.required<boolean>();
    readonly closed = output<void>();

    protected readonly service = inject(PendingReviewsService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly messages = inject(MessageService);

    protected readonly error = signal<string | null>(null);

    constructor() {
        // Solo `open` dispara la carga (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => void this.load());
            }
        });
    }

    /** «Juan · papá»: el nombre que escribió la persona, o el registrado. */
    protected name(person: PendingPerson): string {
        return `${person.declaredName ?? person.guardianName} · ${this.relation(person.relationship)}`;
    }

    protected relation(relationship: LinkRelationship): string {
        return relationshipLabel(relationship).toLocaleLowerCase('es-CO');
    }

    protected detail(person: PendingPerson): string {
        const at = fromInstant(person.at);
        const when = `${dayLabel(at.date, todayInColombia())}, ${timeLabel(at.time)}`.toLocaleLowerCase('es-CO');
        const origin = person.knownPlayers.length > 0 ? 'celular nuevo' : 'desde el enlace';

        return `${person.phone} · ${origin}, ${when}`;
    }

    protected review(person: PendingPerson, decision: ReviewDecision): void {
        if (decision === 'validate') {
            void this.apply(person, decision, 'Acudiente validado.');

            return;
        }

        this.confirmation.confirm({
            header: `¿Rechazar a ${person.declaredName ?? person.guardianName}?`,
            message: 'Sus respuestas dejarán de contar y ese celular ya no se reconocerá. Sus vínculos ya validados no cambian. No se le avisará.',
            acceptLabel: 'Rechazar',
            rejectLabel: 'Cancelar',
            acceptButtonProps: { severity: 'danger' },
            rejectButtonProps: { outlined: true },
            accept: () => void this.apply(person, decision, 'Rechazado: sus respuestas ya no cuentan.')
        });
    }

    private async load(): Promise<void> {
        this.error.set(null);

        try {
            await this.service.load();
        } catch (error) {
            this.error.set(messageOf(error));
        }
    }

    private async apply(person: PendingPerson, decision: ReviewDecision, success: string): Promise<void> {
        this.error.set(null);

        try {
            await this.service.review(person, decision);
            this.messages.add({ severity: 'success', summary: success, life: 4000 });
        } catch (error) {
            this.error.set(messageOf(error));
        }
    }
}

function messageOf(error: unknown): string {
    return error instanceof AppError ? error.message : ERROR_MESSAGES.unknown;
}
