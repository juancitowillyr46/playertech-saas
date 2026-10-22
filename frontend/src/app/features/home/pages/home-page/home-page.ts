import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { NoticesSection } from '../../components/notices-section/notices-section';
import { HomeSummaryService } from '../../services/home-summary.service';

/**
 * Pantalla modelo de Inicio (spec 003, US5; patrón «inicio con tareas pendientes» de
 * ui.md). El resumen es real y de solo lectura (CA-001 de HU-032). «Completa tu
 * academia» muestra el estado de cada tarea y el progreso, y desaparece con todas
 * completas (CA-002 a CA-004 de HU-032, spec 007). Es informativa: no bloquea nada.
 */
@Component({
    selector: 'app-home-page',
    imports: [RouterLink, ButtonModule, ConfirmDialogModule, MessageModule, SkeletonModule, PageHeader, NoticesSection],
    providers: [HomeSummaryService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-page-header title="Inicio" description="El resumen de tu academia." />

        <!-- Avisos (spec 014): pendientes de validar y respuestas nuevas, arriba del resumen. -->
        <app-notices-section />
        <p-confirmdialog />

        @switch (home.status()) {
            @case ('loading') {
                <div class="flex flex-col gap-3" role="status" aria-label="Cargando el resumen">
                    <p-skeleton height="3.5rem" />
                    <p-skeleton height="7rem" />
                </div>
            }
            @case ('error') {
                <p-message severity="error" styleClass="mb-4">No pudimos cargar el resumen de tu academia. Revisa tu conexión e inténtalo de nuevo.</p-message>
                <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="home.load()" />
            }
            @default {
                @if (home.summary(); as summary) {
                    <!-- Ficha de la academia, reglada como una planilla. -->
                    <section aria-labelledby="academy-name">
                        <div class="flex items-center gap-3">
                            @if (summary.logoUrl) {
                                <img [src]="summary.logoUrl" alt="" class="size-12 shrink-0 rounded-full border border-(--p-content-border-color) object-cover" />
                            } @else {
                                <span class="grid size-12 shrink-0 place-items-center rounded-full border-2 border-current text-sm font-extrabold tracking-wide" aria-hidden="true">{{ summary.initials }}</span>
                            }
                            <h2 id="academy-name" class="m-0 min-w-0 truncate text-xl" [attr.title]="summary.academyName">{{ summary.academyName }}</h2>
                        </div>

                        <dl class="m-0 mt-4 border-t border-(--p-content-border-color)">
                            <div class="flex items-baseline justify-between gap-4 border-b border-(--p-content-border-color) py-3">
                                <dt class="text-muted-color">Plan</dt>
                                <dd class="m-0 font-semibold">{{ summary.planName ?? 'Sin plan activo' }}</dd>
                            </div>
                            <div class="flex items-baseline justify-between gap-4 border-b border-(--p-content-border-color) py-3">
                                <dt class="shrink-0 text-muted-color">Sede principal</dt>
                                @if (summary.primaryVenue; as venue) {
                                    <dd class="m-0 min-w-0 truncate text-right font-semibold" [attr.title]="venue.name">{{ venue.name }}{{ venue.city ? ' · ' + venue.city : '' }}</dd>
                                } @else {
                                    <dd class="m-0 text-right">
                                        <span class="block font-semibold">Sin sede principal</span>
                                        <a routerLink="/settings/venues" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Ver sedes</a>
                                    </dd>
                                }
                            </div>
                        </dl>
                    </section>
                }
            }
        }

        @if (home.summary(); as summary) {
            @if (summary.completedCount < summary.tasks.length) {
                <section class="mt-8" aria-labelledby="complete-academy">
                    <div class="flex items-baseline justify-between gap-3">
                        <h2 id="complete-academy" class="m-0 text-xl">Completa tu academia</h2>
                        <span class="shrink-0 font-semibold">{{ summary.completedCount }} de {{ summary.tasks.length }}</span>
                    </div>
                    <p class="m-0 mt-1 text-muted-color">Con estos datos tu academia queda lista para trabajar.</p>
                    <ul class="m-0 mt-3 list-none border-t border-(--p-content-border-color) p-0">
                        @for (task of summary.tasks; track task.key) {
                            <li class="border-b border-(--p-content-border-color)">
                                @if (task.done || !task.route) {
                                    <div class="flex min-h-14 items-center justify-between gap-3 py-2 text-muted-color">
                                        <span class="flex items-center gap-3"><i class="pi pi-check-circle text-primary" aria-hidden="true"></i>{{ task.label }}</span>
                                        <span class="shrink-0 text-sm font-semibold">Completa</span>
                                    </div>
                                } @else {
                                    <a [routerLink]="task.route" class="flex min-h-14 items-center justify-between gap-3 py-2 font-semibold text-(--p-text-color) hover:text-primary">
                                        <span class="flex items-center gap-3"><i class="pi pi-circle text-muted-color" aria-hidden="true"></i>{{ task.label }}</span>
                                        <span class="flex shrink-0 items-center gap-2 text-sm text-muted-color">Pendiente<i class="pi pi-angle-right" aria-hidden="true"></i></span>
                                    </a>
                                }
                            </li>
                        }
                    </ul>
                </section>
            }
        }
    `
})
export class HomePage implements OnInit {
    protected readonly home = inject(HomeSummaryService);

    ngOnInit(): void {
        void this.home.load();
    }
}
