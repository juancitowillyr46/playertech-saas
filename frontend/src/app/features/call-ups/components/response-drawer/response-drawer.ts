import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { ANSWER_OPTIONS, ANSWER_SHORT_LABELS, REASON_TEXT_MAX, reasonLabel, reasonOptions } from '../../../call-up-response/options/response-options';
import { fullNameWithNickname, ReviewDecision } from '../../../players/models/player.models';
import { CallUpPlayer, CurrentResponse, OwnerResponseInput, ResponseAnswer, ResponseEntry } from '../../models/call-up.models';
import { answerText, relationshipText, responderText, whenText } from '../../models/response-labels';

/**
 * Drawer de un convocado en el seguimiento (HU-011 y HU-040; mockup PlayerDrawer): respuesta
 * actual, validar o rechazar a quien respondió, historial y «Registrar respuesta» del owner.
 */
@Component({
    selector: 'app-response-drawer',
    imports: [FormsModule, ButtonModule, MessageModule, SelectModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="title()" [busy]="busy()" [dirty]="!!draft()" saveLabel="Guardar respuesta" cancelLabel="Cerrar" [saveDisabled]="!canSave()" (save)="save()" (closed)="closed.emit()">
            @if (error(); as message) {
                <p-message severity="error" styleClass="mb-4">{{ message }}</p-message>
            }

            <section class="mb-5 flex flex-col gap-1" aria-labelledby="current-response">
                <h3 id="current-response" class="m-0 text-sm font-bold tracking-wider text-muted-color uppercase">Respuesta actual</h3>
                <p class="m-0 text-lg font-semibold">{{ currentText() }}</p>
                @if (response()?.answer) {
                    <p class="m-0 text-muted-color">{{ responder() }} · {{ when(response()!.at) }}</p>
                }
            </section>

            @if (response()?.unvalidated) {
                <section class="mb-5 flex flex-col gap-3 rounded-border border border-(--p-text-color) p-3" aria-labelledby="pending-title">
                    <p id="pending-title" class="m-0"><strong>Sin validar:</strong> {{ pendingText() }}</p>
                    @if (response()!.phoneMatch) {
                        <p class="m-0 text-sm text-muted-color">{{ matchText() }}</p>
                    }
                    <div class="flex gap-2">
                        <p-button label="Rechazar" [outlined]="true" class="flex-1" styleClass="w-full" [disabled]="busy()" (onClick)="review.emit('reject')" />
                        <p-button label="Validar" class="flex-1" styleClass="w-full" [disabled]="busy()" (onClick)="review.emit('validate')" />
                    </div>
                </section>
            }

            @if (history().length) {
                <section class="mb-5 flex flex-col gap-1" aria-labelledby="history-title">
                    <h3 id="history-title" class="m-0 text-sm font-bold tracking-wider text-muted-color uppercase">Historial</h3>
                    <ul class="m-0 flex list-none flex-col gap-1 p-0">
                        @for (entry of history(); track entry.id) {
                            <li [class.line-through]="!entry.counts" [class.text-muted-color]="!entry.counts">{{ entryText(entry) }}</li>
                        }
                    </ul>
                </section>
            }

            <fieldset class="m-0 flex flex-col gap-3 rounded-border border border-(--p-content-border-color) p-3">
                <legend class="px-1 font-medium">Registrar respuesta</legend>
                <div class="grid grid-cols-3 gap-2" role="group" aria-label="Respuesta registrada por ti">
                    @for (option of answers; track option.value) {
                        <p-button [label]="short(option.value)" [ariaLabel]="option.label" [outlined]="draft() !== option.value" [attr.aria-pressed]="draft() === option.value" styleClass="w-full px-1" (onClick)="pick(option.value)" />
                    }
                </div>
                @if (draft() === 'maybe' || draft() === 'no') {
                    <div class="flex flex-col gap-2">
                        <label for="ownerReason" class="font-medium">Motivo <span class="font-normal text-muted-color">(opcional)</span></label>
                        <p-select
                            inputId="ownerReason"
                            [options]="reasons()"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Elige un motivo"
                            [showClear]="true"
                            appendTo="body"
                            styleClass="w-full"
                            [ngModel]="reason()"
                            (ngModelChange)="reason.set($event)"
                        />
                    </div>
                    @if (reason() === 'other') {
                        <div class="flex flex-col gap-2">
                            <label for="ownerReasonText" class="font-medium">Cuéntanos</label>
                            <textarea pTextarea id="ownerReasonText" rows="2" [maxlength]="textMax" class="w-full" [ngModel]="text()" (ngModelChange)="text.set($event)"></textarea>
                        </div>
                    }
                }
                <p class="m-0 text-sm text-muted-color">Por ejemplo, si te escribieron por WhatsApp. No cuenta para los cambios del acudiente.</p>
            </fieldset>
        </app-form-drawer>
    `
})
export class ResponseDrawer {
    readonly open = input.required<boolean>();
    readonly player = input<CallUpPlayer | null>(null);
    readonly response = input<CurrentResponse | null>(null);
    readonly history = input<readonly ResponseEntry[]>([]);
    readonly busy = input(false);
    readonly error = input<string | null>(null);

    readonly respond = output<OwnerResponseInput>();
    readonly review = output<ReviewDecision>();
    readonly closed = output<void>();

    protected readonly answers = ANSWER_OPTIONS;
    protected readonly textMax = REASON_TEXT_MAX;
    protected readonly draft = signal<ResponseAnswer | null>(null);
    protected readonly reason = signal<string | null>(null);
    protected readonly text = signal('');

    protected readonly title = computed(() => {
        const player = this.player();

        return player ? fullNameWithNickname(player) : '';
    });
    protected readonly reasons = computed(() => [...reasonOptions(this.draft())]);
    protected readonly canSave = computed(() => !!this.draft() && (this.reason() !== 'other' || this.text().trim().length > 0));
    protected readonly currentText = computed(() => {
        const response = this.response();

        if (!response?.answer) {
            return 'Sin respuesta';
        }

        const reason = reasonLabel(response.answer, response.reason, response.reasonText);

        return reason ? `${answerText(response.answer)} · ${reason}` : answerText(response.answer);
    });
    protected readonly responder = computed(() => {
        const response = this.response();

        return response ? responderText(response.source, response.guardianName, response.relationship) : '';
    });
    protected readonly pendingText = computed(() => {
        const response = this.response();

        if (!response) {
            return '';
        }

        const name = response.declaredName ?? response.guardianName ?? 'Alguien';
        const relationship = relationshipText(response.relationship);
        const from = response.deviceStatus === 'pending' ? 'desde un celular nuevo' : 'desde el enlace';

        return `${name}${relationship ? ` (${relationship})` : ''} respondió ${from}.`;
    });
    protected readonly matchText = computed(() => {
        const response = this.response();

        return response ? `El celular coincide con ${response.guardianName}, acudiente registrado.` : '';
    });

    constructor() {
        // Solo `open` reinicia el formulario (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => this.reset());
            }
        });
    }

    protected short(answer: ResponseAnswer): string {
        return ANSWER_SHORT_LABELS[answer];
    }

    protected when(instant: string | null): string {
        return whenText(instant).toLocaleLowerCase('es-CO');
    }

    protected entryText(entry: ResponseEntry): string {
        const reason = reasonLabel(entry.answer, entry.reason, entry.reasonText);
        const who = entry.source === 'owner' ? 'registrada por ti' : responderText('guardian', entry.declaredName ?? entry.guardianName, entry.relationship);
        const rejected = entry.counts ? '' : ' (rechazada)';

        return `${answerText(entry.answer)}${reason ? ` · ${reason}` : ''} · ${who}${rejected} · ${this.when(entry.at)}`;
    }

    protected pick(answer: ResponseAnswer): void {
        this.draft.set(answer);
        this.reason.set(null);
        this.text.set('');
    }

    protected save(): void {
        const answer = this.draft();

        if (!answer || !this.canSave()) {
            return;
        }

        const reason = answer === 'yes' ? null : this.reason();

        this.respond.emit({ answer, reason, reasonText: reason === 'other' ? this.text().trim() : null });
    }

    private reset(): void {
        this.draft.set(null);
        this.reason.set(null);
        this.text.set('');
    }
}
