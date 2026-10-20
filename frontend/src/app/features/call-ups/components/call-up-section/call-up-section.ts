import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Activity, isPast } from '../../../activities/models/activity.models';
import { CallUp } from '../../models/call-up.models';
@Component({
    selector: 'app-call-up-section',
    imports: [ButtonModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<section class="mt-6 border-t border-surface-300 pt-4">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="m-0 text-xl font-extrabold">Convocatoria</h2>
            @if (callUp()) {
                <p-tag [value]="open() ? 'ABIERTA' : 'CERRADA'" styleClass="border-2 border-current bg-transparent" />
            }
        </div>
        @if (!callUp()) {
            @if (callable()) {
                <p-button label="Convocar" (onClick)="create.emit()" />
            }
        } @else {
            @if (callUp()!.deadline) {
                <p class="text-muted-color">Responde hasta {{ callUp()!.deadline }}</p>
            }
            @for (list of callUp()!.lists; track list.id) {
                <div class="flex min-h-11 items-center justify-between border-b border-surface-200">
                    <span
                        ><strong>{{ list.groupName ?? 'Convocados' }}</strong> · {{ list.players.length }} convocados</span
                    ><p-button label="Mensaje" [text]="true" (onClick)="openMessage.emit(list.id)" />
                </div>
                @for (player of list.players; track player.playerId) {
                    <div class="flex min-h-11 items-center justify-between border-b border-surface-200">
                        <span>{{ player.firstNames }} {{ player.lastNames }}</span
                        ><p-button label="Enviar" [text]="true" (onClick)="sendMessage.emit(player.playerId)" />
                    </div>
                }
            }
            @if (open()) {
                <div class="mt-3 flex gap-2"><p-button label="Ajustar convocados" [outlined]="true" (onClick)="adjust.emit()" /><p-button label="Cerrar convocatoria" [outlined]="true" (onClick)="closeCallUp.emit()" /></div>
            }
        }
    </section>`
})
export class CallUpSection {
    readonly activity = input.required<Activity>();
    readonly callUp = input<CallUp | null>(null);
    readonly create = output<void>();
    readonly adjust = output<void>();
    readonly closeCallUp = output<void>();
    readonly openMessage = output<string>();
    readonly sendMessage = output<string>();
    readonly callable = computed(() => this.activity().status === 'scheduled' && !isPast(this.activity()));
    readonly open = computed(() => {
        const c = this.callUp();
        return !!c && !c.closedAt && Date.now() < new Date(c.deadline ?? this.activity().startsAt).getTime();
    });
}
