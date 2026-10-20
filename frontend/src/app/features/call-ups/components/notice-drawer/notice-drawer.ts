import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FormDrawer } from '../../../../shared/components/form-drawer/form-drawer';
import { copyText, shareText } from '../../messages/whatsapp';
@Component({
    selector: 'app-notice-drawer',
    imports: [ButtonModule, FormDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<app-form-drawer [open]="open()" title="Avisar a los convocados" (closed)="closed.emit()">
        <pre class="whitespace-pre-wrap rounded border border-surface-300 p-3">{{ text() }}</pre>
        <div drawer-footer class="flex gap-2"><p-button label="Copiar" [outlined]="true" (onClick)="copy()" /><p-button label="Compartir en el grupo" (onClick)="share()" /><p-button label="Ahora no" [text]="true" (onClick)="closed.emit()" /></div
    ></app-form-drawer>`
})
export class NoticeDrawer {
    readonly open = input(false);
    readonly text = input('');
    readonly closed = output<void>();
    protected copy() {
        return copyText(this.text());
    }
    protected share() {
        return shareText(this.text());
    }
}
