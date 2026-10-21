import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { Activity } from '../../../activities/models/activity.models';
import { relationshipLabel, shortName } from '../../../players/models/player.models';
import { listMessage, personalMessage } from '../../messages/call-up-messages';
import { callUpLink, copyText, openWhatsapp, whatsappChat } from '../../messages/whatsapp';
import { CallUpList, CallUpPlayer, INTRO_MAX } from '../../models/call-up.models';

interface Recipient {
    readonly key: string;
    readonly label: string;
    readonly phone: string;
}

/**
 * Mensaje de una lista o personal de un convocado (spec 012; HU-012 y HU-013). Tu texto va
 * antes del bloque generado, que no se edita y siempre sale con los datos actuales. El texto
 * de una lista se guarda al compartir o copiar; PlayerTech no envía mensajes.
 */
@Component({
    selector: 'app-message-drawer',
    imports: [FormsModule, ButtonModule, RadioButtonModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" [title]="title()" [busy]="busy()" [dirty]="dirty()" [saveLabel]="primaryLabel()" [saveDisabled]="player() !== null && !recipient()" (save)="primary()" (closed)="closed.emit()">
            @if (player() && recipients().length > 1) {
                <fieldset class="m-0 mb-5 flex flex-col gap-2 border-0 p-0">
                    <legend class="mb-2 p-0 font-medium">¿A quién?</legend>
                    @for (option of recipients(); track option.key) {
                        <label [for]="'recipient-' + option.key" class="flex min-h-11 cursor-pointer items-center gap-3 rounded-border border border-(--p-content-border-color) px-3">
                            <p-radiobutton name="recipient" [value]="option.key" [inputId]="'recipient-' + option.key" [ngModel]="recipientKey()" (ngModelChange)="recipientKey.set($event)" />
                            <span>{{ option.label }}</span>
                        </label>
                    }
                </fieldset>
            }

            <div class="mb-5 flex flex-col gap-2">
                <label for="messageIntro" class="font-medium">
                    Tu texto
                    @if (!player()) {
                        <span class="font-normal text-muted-color">(se guarda para esta lista)</span>
                    }
                </label>
                <textarea pTextarea id="messageIntro" rows="3" [maxlength]="introMax" class="w-full" [ngModel]="intro()" (ngModelChange)="intro.set($event)"></textarea>
            </div>

            <p id="messageBlockTitle" class="m-0 mb-2 font-medium">Datos de la convocatoria <span class="font-normal text-muted-color">(automáticos)</span></p>
            <div class="mb-4 rounded-border bg-emphasis p-3 text-sm break-words whitespace-pre-line" role="region" aria-labelledby="messageBlockTitle">{{ block() }}</div>

            @if (player() && !recipient()) {
                <p class="m-0 mb-3 text-sm text-muted-color">{{ player()!.firstNames }} no tiene acudientes ni celular registrado: copia el mensaje y envíalo por tu cuenta.</p>
            }
            @if (player()) {
                <p-button label="Copiar" icon="pi pi-copy" [outlined]="true" styleClass="w-full" (onClick)="copy()" />
            }
        </app-form-drawer>
    `
})
export class MessageDrawer {
    readonly open = input.required<boolean>();
    readonly activity = input.required<Activity>();
    readonly list = input.required<CallUpList | null>();
    readonly deadline = input<string | null>(null);
    /** Convocado para el mensaje personal; null para el mensaje de la lista. */
    readonly player = input<CallUpPlayer | null>(null);
    readonly busy = input(false);

    readonly saveIntro = output<{ listId: string; intro: string | null }>();
    /** Texto del aviso breve tras compartir o copiar. */
    readonly done = output<string>();
    /** No se pudo copiar (texto del aviso de error). */
    readonly failed = output<string>();
    readonly closed = output<void>();

    protected readonly introMax = INTRO_MAX;
    protected readonly intro = signal('');
    protected readonly recipientKey = signal<string | null>(null);

    protected readonly title = computed(() => {
        const player = this.player();

        return player ? `Enviar a ${shortName(player)}` : `Mensaje para ${this.list()?.groupName ?? 'los convocados'}`;
    });

    /** Acudientes con celular o, sin ellos, el propio jugador (CA-002 y CA-003 de HU-013). */
    protected readonly recipients = computed<readonly Recipient[]>(() => {
        const player = this.player();

        if (!player) {
            return [];
        }

        if (player.guardians.length > 0) {
            return player.guardians.map((guardian, index) => ({ key: String(index), label: `${guardian.fullName} · ${relationshipLabel(guardian.relationship)}`, phone: guardian.phone }));
        }

        return player.phone ? [{ key: 'player', label: player.firstNames, phone: player.phone }] : [];
    });

    protected readonly recipient = computed(() => this.recipients().find((option) => option.key === this.recipientKey()) ?? null);

    protected readonly primaryLabel = computed(() => {
        const player = this.player();

        if (!player) {
            return 'Copiar mensaje';
        }

        return player.guardians.length === 0 && player.phone ? 'Enviar al jugador' : 'Abrir WhatsApp';
    });

    /** Bloque generado, sin tu texto (vista previa). */
    protected readonly block = computed(() => this.compose(null));

    protected readonly dirty = computed(() => !this.player() && this.cleanIntro() !== (this.list()?.intro ?? null));

    constructor() {
        // Solo `open` dispara el reinicio (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => {
                    this.intro.set(this.player() ? '' : (this.list()?.intro ?? ''));
                    this.recipientKey.set(this.recipients()[0]?.key ?? null);
                });
            }
        });
    }

    /**
     * Lista: copia el mensaje para pegarlo en el grupo (decisión del 2026-10-19: abrir WhatsApp
     * sin un número no es confiable en todos los celulares). Personal: abre el chat del celular,
     * en el mismo toque y sin esperas antes, para que el navegador no lo bloquee.
     */
    protected primary(): void {
        const text = this.compose(this.cleanIntro());
        const recipient = this.recipient();

        if (this.player()) {
            if (recipient) {
                openWhatsapp(whatsappChat(recipient.phone, text));
                this.done.emit('Se abrió WhatsApp con el mensaje listo.');
            }
            return;
        }

        void this.copy();
    }

    protected async copy(): Promise<void> {
        const copied = await copyText(this.compose(this.cleanIntro()));

        if (!copied) {
            this.failed.emit('No se pudo copiar. Mantén presionado el texto para copiarlo a mano.');
            return;
        }

        this.persistIntro();
        this.done.emit(this.player() ? 'Mensaje copiado.' : 'Mensaje copiado: pégalo en el grupo de WhatsApp.');
    }

    private compose(intro: string | null): string {
        const list = this.list();
        const player = this.player();

        if (!list) {
            return '';
        }

        const link = callUpLink(list.token);

        return player ? personalMessage(intro, this.activity(), player, link, this.deadline()) : listMessage(intro, this.activity(), list, link, this.deadline());
    }

    private cleanIntro(): string | null {
        const value = this.intro().trim().slice(0, INTRO_MAX);

        return value === '' ? null : value;
    }

    /** Guarda el texto propio de la lista solo si cambió (CA-003 de HU-012). */
    private persistIntro(): void {
        const list = this.list();
        const intro = this.cleanIntro();

        if (list && !this.player() && intro !== (list.intro ?? null)) {
            this.saveIntro.emit({ listId: list.id, intro });
        }
    }
}
