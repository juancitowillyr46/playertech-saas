import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { Activity } from '../../../activities/models/activity.models';
import { CallUpList, CallUpPlayer } from '../../models/call-up.models';
import { listMessage, personalMessage } from '../../messages/call-up-messages';
import { callUpLink, copyText, shareText, whatsappChat } from '../../messages/whatsapp';
@Component({
    selector: 'app-message-drawer',
    imports: [FormsModule, ButtonModule, TextareaModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<app-form-drawer [open]="open()" [title]="player() ? 'Enviar mensaje' : 'Mensaje'" (closed)="closed.emit()"
        ><label for="call-up-intro" class="mb-1 block font-medium">Tu texto</label><textarea id="call-up-intro" pTextarea class="w-full" maxlength="500" [(ngModel)]="intro"></textarea>
        <pre class="mt-3 whitespace-pre-wrap rounded border border-surface-300 p-3 text-sm">{{ text() }}</pre>
        <div drawer-footer class="flex gap-2"><p-button label="Copiar" [outlined]="true" (onClick)="copy()" /><p-button [label]="player() ? 'Abrir WhatsApp' : 'Compartir en el grupo'" (onClick)="share()" /></div
    ></app-form-drawer>`
})
export class MessageDrawer {
    readonly open = input(false);
    readonly activity = input.required<Activity>();
    readonly list = input.required<CallUpList>();
    readonly player = input<CallUpPlayer | null>(null);
    readonly deadline = input<string | null>(null);
    readonly closed = output<void>();
    readonly saved = output<string>();
    protected intro = '';
    protected text = () =>
        this.player() ? personalMessage(this.intro, this.activity(), this.player()!, callUpLink(this.list().token), this.deadline()) : listMessage(this.intro, this.activity(), this.list(), callUpLink(this.list().token), this.deadline());
    protected async copy() {
        this.saved.emit(this.intro);
        await copyText(this.text());
    }
    protected async share() {
        this.saved.emit(this.intro);
        const p = this.player();
        if (p) {
            const phone = p.guardians[0]?.phone ?? p.phone;
            if (phone) window.open(whatsappChat(phone, this.text()), '_blank', 'noopener');
            else await copyText(this.text());
        } else await shareText(this.text());
    }
}
