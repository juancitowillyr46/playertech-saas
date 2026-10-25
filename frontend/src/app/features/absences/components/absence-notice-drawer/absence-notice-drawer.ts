import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { Activity } from '../../../activities/models/activity.models';
import { copyText, openWhatsapp, whatsappChat } from '../../../call-ups/messages/whatsapp';
import { absenceMessage, firstName } from '../../messages/absence-message';
import { AbsenceCandidate, AbsenceRecipient } from '../../models/absence.models';

/**
 * «Avisar» de un jugador que no llegó (spec 015, mockups/Notify; CA-004 de HU-042). Mensaje
 * sugerido y editable, que no se guarda; PlayerTech no envía mensajes (DEC-45).
 */
@Component({
    selector: 'app-absence-notice-drawer',
    imports: [FormsModule, ButtonModule, RadioButtonModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="title()" [dirty]="false" saveLabel="Abrir WhatsApp" [saveDisabled]="!recipient()" (save)="openChat()" (closed)="closed.emit()">
            @if (recipients().length > 1) {
                <fieldset class="m-0 mb-5 flex flex-col gap-2 border-0 p-0">
                    <legend class="mb-2 p-0 font-medium">¿A quién le escribes?</legend>
                    @for (option of recipients(); track option.key) {
                        <label [for]="'absence-recipient-' + option.key" class="flex min-h-13 cursor-pointer items-center gap-3 rounded-border border border-(--p-content-border-color) px-3 py-1.5">
                            <p-radiobutton name="absenceRecipient" [value]="option.key" [inputId]="'absence-recipient-' + option.key" [ngModel]="recipientKey()" (ngModelChange)="pick($event)" />
                            <span class="flex flex-col">
                                <span>{{ option.label }}</span>
                                <span class="text-sm text-muted-color">{{ option.phone }}</span>
                            </span>
                        </label>
                    }
                </fieldset>
            } @else if (recipient(); as only) {
                <p class="m-0 mb-5"><span class="font-medium">Para:</span> {{ only.label }} · {{ only.phone }}</p>
            }

            <div class="mb-4 flex flex-col gap-2">
                <label for="absenceMessage" class="font-medium">Tu mensaje</label>
                <textarea pTextarea id="absenceMessage" rows="5" class="w-full" aria-describedby="absenceMessageHelp" [ngModel]="text()" (ngModelChange)="edit($event)"></textarea>
                <small id="absenceMessageHelp" class="text-muted-color">Puedes cambiarlo antes de enviarlo. No se guarda.</small>
            </div>

            @if (!recipient()) {
                <p class="m-0 mb-3 text-sm text-muted-color">{{ candidate()?.firstNames }} no tiene acudientes ni celular registrado: copia el mensaje y envíalo por tu cuenta.</p>
            }
            <p-button label="Copiar mensaje" icon="pi pi-copy" [outlined]="true" styleClass="w-full" (onClick)="copy()" />
        </app-form-drawer>
    `
})
export class AbsenceNoticeDrawer {
    readonly open = input.required<boolean>();
    readonly activity = input.required<Activity>();
    readonly candidate = input.required<AbsenceCandidate | null>();
    readonly recipients = input.required<readonly AbsenceRecipient[]>();

    /** Se abrió el chat o se copió: el jugador queda «Avisado». */
    readonly notified = output<string>();
    /** No se pudo copiar (texto del aviso de error). */
    readonly failed = output<string>();
    readonly closed = output<void>();

    protected readonly recipientKey = signal<string | null>(null);
    protected readonly text = signal('');
    private readonly edited = signal(false);

    protected readonly recipient = computed(() => this.recipients().find((option) => option.key === this.recipientKey()) ?? null);
    protected readonly title = computed(() => `Avisar: ${this.candidate()?.fullName ?? ''}`);

    constructor() {
        // Solo `open` dispara el reinicio (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => {
                    this.recipientKey.set(this.recipients()[0]?.key ?? null);
                    this.edited.set(false);
                    this.text.set(this.suggested());
                });
            }
        });
    }

    protected pick(key: string): void {
        this.recipientKey.set(key);

        // Si no lo editó, el saludo sigue al destinatario.
        if (!this.edited()) {
            this.text.set(this.suggested());
        }
    }

    protected edit(text: string): void {
        this.text.set(text);
        this.edited.set(true);
    }

    /** En el mismo toque y sin esperas antes, para que el navegador no lo bloquee. */
    protected openChat(): void {
        const recipient = this.recipient();

        if (!recipient) {
            return;
        }

        openWhatsapp(whatsappChat(recipient.phone, this.text()));
        this.notified.emit('Se abrió WhatsApp con el mensaje listo.');
    }

    protected async copy(): Promise<void> {
        if (await copyText(this.text())) {
            this.notified.emit('Mensaje copiado. Pégalo en WhatsApp.');
        } else {
            this.failed.emit('No pudimos copiar el mensaje. Selecciónalo y cópialo a mano.');
        }
    }

    private suggested(): string {
        const candidate = this.candidate();
        const recipient = this.recipient();

        if (!candidate) {
            return '';
        }

        return absenceMessage({ recipientFirstName: recipient && !recipient.isPlayer ? recipient.firstName : null, playerFirstName: firstName(candidate.firstNames), activity: this.activity() });
    }
}
