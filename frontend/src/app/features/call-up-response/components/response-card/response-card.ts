import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Answer, MyPlayer, ResponseInput, rosterLabel } from '../../models/public-call-up.models';
import { ANSWER_OPTIONS, ANSWER_SHORT_LABELS, changesLeftLabel, REASON_TEXT_MAX, reasonLabel, reasonOptions } from '../../options/response-options';

/**
 * Responder por un jugador (HU-010; mockups Respond, Done y Remembered). «Sí» se registra al
 * tocarlo; «Sí, provisional» y «No» abren el motivo opcional y «Enviar respuesta». Con una
 * respuesta registrada se muestra «¡Listo!» con los cambios restantes y «Cambiar respuesta».
 */
@Component({
    selector: 'app-response-card',
    imports: [FormsModule, ButtonModule, MessageModule, SelectModule, TextareaModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <section class="flex flex-col gap-3 rounded-border border border-(--p-content-border-color) p-4" [attr.aria-labelledby]="headingId()">
            <h2 [id]="headingId()" class="m-0 text-lg">{{ label() }}</h2>

            @if (player().removed) {
                <p class="m-0 text-muted-color">Ya no está convocado.</p>
            } @else if (!editing()) {
                <div class="flex flex-col gap-1" role="status">
                    <p class="m-0 text-lg font-semibold">{{ justAnswered() ? '¡Listo! ' : '' }}Respondiste: {{ answerLabel() }}</p>
                    @if (reasonText()) {
                        <p class="m-0 text-muted-color">Motivo: {{ reasonText() }}</p>
                    }
                    @if (open()) {
                        <p class="m-0 text-muted-color">{{ changesText() }}</p>
                    }
                </div>
                @if (open() && player().changesLeft > 0) {
                    <p-button label="Cambiar respuesta" [outlined]="true" styleClass="w-full" (onClick)="startEditing()" />
                }
            } @else {
                <div class="grid grid-cols-3 gap-2" role="group" [attr.aria-label]="'Respuesta para ' + label()">
                    @for (option of answers; track option.value) {
                        <p-button
                            [label]="shortLabel(option.value)"
                            [ariaLabel]="option.label"
                            [outlined]="draft() !== option.value"
                            [attr.aria-pressed]="draft() === option.value"
                            [disabled]="busy()"
                            styleClass="w-full px-1"
                            (onClick)="pick(option.value)"
                        />
                    }
                </div>

                @if (draft() === 'maybe' || draft() === 'no') {
                    <div class="flex flex-col gap-2">
                        <label [for]="reasonId()" class="font-medium">Motivo <span class="font-normal text-muted-color">(opcional)</span></label>
                        <p-select
                            [inputId]="reasonId()"
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
                            <label [for]="textId()" class="font-medium">Cuéntanos</label>
                            <textarea pTextarea [id]="textId()" rows="2" [maxlength]="textMax" class="w-full" [ngModel]="text()" (ngModelChange)="text.set($event)"></textarea>
                            <span class="self-end text-sm text-muted-color">{{ text().length }}/{{ textMax }}</span>
                        </div>
                    }
                    <p-button label="Enviar respuesta" styleClass="w-full" [loading]="busy()" [disabled]="!canSend()" (onClick)="send()" />
                }

                @if (player().answer) {
                    <p-button label="Cancelar" [text]="true" severity="secondary" styleClass="w-full" (onClick)="editing.set(false)" />
                } @else {
                    <p class="m-0 text-sm text-muted-color">{{ changesText() }}</p>
                }
            }

            @if (error(); as message) {
                <p-message severity="error" variant="simple" size="small">{{ message }}</p-message>
            }
        </section>
    `
})
export class ResponseCard {
    readonly player = input.required<MyPlayer>();
    readonly open = input(true);
    readonly busy = input(false);
    readonly error = input<string | null>(null);

    readonly respond = output<ResponseInput>();

    protected readonly answers = ANSWER_OPTIONS;
    protected readonly textMax = REASON_TEXT_MAX;
    protected readonly editing = signal(false);
    protected readonly justAnswered = signal(false);
    protected readonly draft = signal<Answer | null>(null);
    protected readonly reason = signal<string | null>(null);
    protected readonly text = signal('');

    protected readonly label = computed(() => rosterLabel(this.player()));
    protected readonly headingId = computed(() => `player-${this.player().playerId}`);
    protected readonly reasonId = computed(() => `reason-${this.player().playerId}`);
    protected readonly textId = computed(() => `reason-text-${this.player().playerId}`);
    protected readonly reasons = computed(() => [...reasonOptions(this.draft())]);
    protected readonly answerLabel = computed(() => {
        const answer = this.player().answer;

        return answer ? (ANSWER_OPTIONS.find((option) => option.value === answer)?.label ?? '') : '';
    });
    protected readonly reasonText = computed(() => reasonLabel(this.player().answer, this.player().reason, this.player().reasonText));
    protected readonly changesText = computed(() => changesLeftLabel(this.player().changesLeft));
    protected readonly canSend = computed(() => !this.busy() && !!this.draft() && (this.reason() !== 'other' || this.text().trim().length > 0));

    constructor() {
        // Sin respuesta se empieza respondiendo; con respuesta, se muestra el resumen.
        effect(() => {
            const answered = !!this.player().answer;

            untracked(() => {
                this.editing.set(!answered);
                this.draft.set(null);
            });
        });
    }

    protected shortLabel(answer: Answer): string {
        return ANSWER_SHORT_LABELS[answer];
    }

    protected startEditing(): void {
        this.justAnswered.set(false);
        this.draft.set(null);
        this.reason.set(null);
        this.text.set('');
        this.editing.set(true);
    }

    protected pick(answer: Answer): void {
        this.draft.set(answer);
        this.reason.set(null);
        this.text.set('');

        if (answer === 'yes') {
            this.send();
        }
    }

    protected send(): void {
        const answer = this.draft();

        if (!answer || this.busy()) {
            return;
        }

        const reason = answer === 'yes' ? null : this.reason();

        this.justAnswered.set(true);
        this.respond.emit({ answer, reason, reasonText: reason === 'other' ? this.text().trim() : null });
    }
}
