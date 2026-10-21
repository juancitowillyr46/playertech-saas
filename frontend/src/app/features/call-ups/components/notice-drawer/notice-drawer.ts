import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { Activity } from '../../../activities/models/activity.models';
import { cancellationNotice, changeNotice } from '../../messages/call-up-messages';
import { callUpLink, copyText } from '../../messages/whatsapp';
import { CallUpList, INTRO_MAX } from '../../models/call-up.models';

/** Aviso que se ofrece: la actividad cancelada, o la actividad antes y después del cambio. */
export type CallUpNotice = { readonly kind: 'cancel'; readonly activity: Activity } | { readonly kind: 'change'; readonly before: Activity; readonly after: Activity };

/**
 * Avisar a los convocados una cancelación o un cambio de fecha, hora o lugar (spec 012,
 * HU-038). Un aviso por lista, con su enlace; tu texto va antes y no se guarda.
 */
@Component({
    selector: 'app-notice-drawer',
    imports: [FormsModule, ButtonModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-form-drawer [open]="open()" title="Avisar a los convocados" saveLabel="Listo" cancelLabel="Ahora no" (save)="closed.emit()" (closed)="closed.emit()">
            <p class="m-0 mb-4 text-muted-color">{{ notice()?.kind === 'cancel' ? 'Cancelaste la actividad. ¿Quieres avisar a los convocados?' : 'Cambiaste la actividad. ¿Quieres avisar a los convocados?' }}</p>

            <div class="mb-5 flex flex-col gap-2">
                <label for="noticeIntro" class="font-medium">Tu texto</label>
                <textarea pTextarea id="noticeIntro" rows="2" [maxlength]="introMax" class="w-full" [ngModel]="intro()" (ngModelChange)="intro.set($event)"></textarea>
            </div>

            @for (item of messages(); track item.listId) {
                <section class="mb-5" [attr.aria-label]="'Aviso para ' + item.label">
                    @if (messages().length > 1) {
                        <h3 class="m-0 mb-2 text-base font-semibold">{{ item.label }}</h3>
                    }
                    <div class="mb-3 rounded-border bg-emphasis p-3 text-sm break-words whitespace-pre-line">{{ item.block }}</div>
                    <p-button label="Copiar aviso" icon="pi pi-copy" styleClass="w-full" [ariaLabel]="'Copiar aviso para ' + item.label" (onClick)="copy(item.text)" />
                </section>
            }
        </app-form-drawer>
    `
})
export class NoticeDrawer {
    readonly open = input.required<boolean>();
    readonly notice = input<CallUpNotice | null>(null);
    readonly lists = input<readonly CallUpList[]>([]);

    readonly done = output<string>();
    readonly failed = output<string>();
    readonly closed = output<void>();

    protected readonly introMax = INTRO_MAX;
    protected readonly intro = signal('');

    protected readonly messages = computed(() => {
        const notice = this.notice();
        const intro = this.intro().trim();

        if (!notice) {
            return [];
        }

        return this.lists().map((list) => {
            const link = callUpLink(list.token);
            const block = notice.kind === 'cancel' ? cancellationNotice(notice.activity) : changeNotice(notice.before, notice.after, link);

            return { listId: list.id, label: list.groupName ?? 'los convocados', block, text: intro ? `${intro}\n\n${block}` : block };
        });
    });

    constructor() {
        // Solo `open` dispara el reinicio (ver activity-form-drawer).
        effect(() => {
            if (this.open()) {
                untracked(() => this.intro.set(''));
            }
        });
    }

    protected async copy(text: string): Promise<void> {
        if (await copyText(text)) {
            this.done.emit('Aviso copiado: pégalo en el grupo de WhatsApp.');
        } else {
            this.failed.emit('No se pudo copiar. Mantén presionado el texto para copiarlo a mano.');
        }
    }
}
