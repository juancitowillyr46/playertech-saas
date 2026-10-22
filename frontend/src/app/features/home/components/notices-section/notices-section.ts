import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { NewResponsesNotice } from '../../../../core/notices/notices.models';
import { NoticesService } from '../../../../core/notices/notices.service';
import { dayLabel, fromInstant } from '../../../../shared/text/colombia-time';
import { todayInColombia } from '../../../../shared/text/search-text';
import { PendingReviewsDrawer } from '../../../players/components/pending-reviews-drawer/pending-reviews-drawer';

/** El inicio muestra hasta estos avisos de respuestas nuevas; el resto, con «Ver más» (supuesto aprobado). */
const VISIBLE_NOTICES = 5;

/**
 * Sección «Avisos» del inicio (spec 014, CA-002 y CA-004 de HU-041; mockups Main y Desktop):
 * acudientes por validar, que abre el drawer, y respuestas nuevas por convocatoria, que llevan
 * a la actividad. Sin avisos, o si su lectura falla, la sección no se muestra (FR-009).
 */
@Component({
    selector: 'app-notices-section',
    imports: [RouterLink, ButtonModule, PendingReviewsDrawer],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (hasNotices()) {
            <section class="mb-8" aria-labelledby="notices-title">
                <h2 id="notices-title" class="m-0 mb-3 text-xl">Avisos</h2>
                <ul class="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2">
                    @if (notices.pendingCount() > 0) {
                        <li>
                            <button
                                type="button"
                                class="flex min-h-13 w-full cursor-pointer items-center justify-between gap-2 rounded-border border-2 border-(--p-text-color) bg-transparent px-3 text-left font-semibold text-color"
                                (click)="pendingOpen.set(true)"
                            >
                                <span>{{ pendingText() }}</span>
                                <i class="pi pi-angle-right" aria-hidden="true"></i>
                            </button>
                        </li>
                    }
                    @for (notice of visible(); track notice.callUpId) {
                        <li>
                            <a [routerLink]="['/activities', notice.activityId]" class="flex min-h-13 flex-col justify-center gap-0.5 rounded-border border border-(--p-content-border-color) px-3 py-2 text-color no-underline">
                                <strong>{{ countText(notice) }}</strong>
                                <span class="text-sm text-muted-color">{{ activityText(notice) }}</span>
                            </a>
                        </li>
                    }
                </ul>
                @if (hidden() > 0) {
                    <p-button [label]="'Ver más (' + hidden() + ')'" [text]="true" styleClass="mt-1 -ml-3" (onClick)="showAll.set(true)" />
                }
            </section>
        }

        <app-pending-reviews-drawer [open]="pendingOpen()" (closed)="pendingOpen.set(false)" />
    `
})
export class NoticesSection implements OnInit {
    protected readonly notices = inject(NoticesService);

    protected readonly pendingOpen = signal(false);
    protected readonly showAll = signal(false);

    private readonly responses = computed(() => (this.notices.failed() ? [] : this.notices.newResponses()));
    protected readonly visible = computed(() => (this.showAll() ? this.responses() : this.responses().slice(0, VISIBLE_NOTICES)));
    protected readonly hidden = computed(() => this.responses().length - this.visible().length);
    protected readonly hasNotices = computed(() => this.notices.pendingCount() > 0 || this.responses().length > 0);
    protected readonly pendingText = computed(() => {
        const count = this.notices.pendingCount();

        return count === 1 ? '1 acudiente por validar' : `${count} acudientes por validar`;
    });

    ngOnInit(): void {
        void this.notices.refresh();
    }

    protected countText(notice: NewResponsesNotice): string {
        return notice.newCount === 1 ? '1 respuesta nueva' : `${notice.newCount} respuestas nuevas`;
    }

    /** «Partido contra Club Norte · sábado 25 de octubre», con «(cancelada)» si aplica. */
    protected activityText(notice: NewResponsesNotice): string {
        const title = notice.activityType === 'training' ? 'Entrenamiento' : notice.opponent ? `Partido contra ${notice.opponent}` : 'Partido';
        const day = dayLabel(fromInstant(notice.startsAt).date, todayInColombia()).toLocaleLowerCase('es-CO');

        return `${title} · ${day}${notice.cancelled ? ' (cancelada)' : ''}`;
    }
}
