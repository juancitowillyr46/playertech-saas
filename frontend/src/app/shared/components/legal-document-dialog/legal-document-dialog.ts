import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { map } from 'rxjs';
import { LegalDocument, LegalDocumentType } from '../../../core/legal/models/legal.models';
import { LegalDocumentService } from '../../../core/legal/services/legal-document.service';

const TITLES: Record<LegalDocumentType, string> = {
    terms: 'Términos y Condiciones',
    privacy_policy: 'Política de Tratamiento de Datos'
};

const PUBLISHED = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });

let nextId = 0;

/**
 * Documento legal en un dialog, sin salir del formulario (spec 016, HU-043; mockups/Dialog y
 * Error). Leer no acepta: la casilla es un paso aparte. En el celular ocupa toda la pantalla.
 */
@Component({
    selector: 'app-legal-document-dialog',
    imports: [ButtonModule, DialogModule, MessageModule, SkeletonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog
            [visible]="!!document()"
            (visibleChange)="$event || closed.emit()"
            [modal]="true"
            appendTo="body"
            [draggable]="false"
            [resizable]="false"
            [blockScroll]="true"
            [dismissableMask]="true"
            [closeAriaLabel]="'Cerrar'"
            [styleClass]="isMobile() ? 'w-screen h-screen max-h-screen m-0 rounded-none' : 'w-[40rem] max-h-[85vh]'"
            [pt]="{ root: { 'aria-labelledby': titleId } }"
        >
            <ng-template #header>
                <div class="flex min-w-0 flex-col gap-1">
                    <h2 [id]="titleId" class="m-0 text-xl">{{ title() }}</h2>
                    <span class="text-sm text-muted-color">{{ versionText() }}</span>
                </div>
            </ng-template>

            @if (failed()) {
                <p-message severity="error" styleClass="mb-3">No pudimos cargar el documento. Revisa tu conexión o ábrelo en otra pestaña.</p-message>
                <a [href]="document()?.url" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">Abrir en otra pestaña</a>
            } @else if (text() === null) {
                <div class="flex flex-col gap-3" aria-label="Cargando el documento">
                    <p-skeleton height="1.25rem" width="60%" />
                    <p-skeleton height="4rem" />
                    <p-skeleton height="4rem" />
                </div>
            } @else {
                <div class="leading-relaxed break-words [&_h1]:hidden [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_li+li]:mt-1 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5" [innerHTML]="text()"></div>
            }

            <ng-template #footer>
                <p-button label="Cerrar" [outlined]="true" styleClass="w-full sm:w-auto" (onClick)="closed.emit()" />
            </ng-template>
        </p-dialog>
    `
})
export class LegalDocumentDialog {
    private readonly legal = inject(LegalDocumentService);

    /** Documento que se lee; null, cerrado. */
    readonly document = input<LegalDocument | null>(null);
    readonly closed = output<void>();

    protected readonly titleId = `legal-document-title-${++nextId}`;
    protected readonly text = signal<string | null>(null);
    protected readonly failed = signal(false);
    protected readonly isMobile = toSignal(
        inject(BreakpointObserver)
            .observe('(max-width: 767.98px)')
            .pipe(map((state) => state.matches)),
        { initialValue: false }
    );

    protected readonly title = computed(() => {
        const document = this.document();

        return document ? TITLES[document.type] : '';
    });

    /** «Versión 2026-10-v2 · publicada el 25 de octubre de 2026» */
    protected readonly versionText = computed(() => {
        const document = this.document();

        return document ? `Versión ${document.version} · publicada el ${PUBLISHED.format(new Date(document.publishedAt))}` : '';
    });

    constructor() {
        effect(() => {
            const document = this.document();
            untracked(() => {
                if (document) {
                    void this.load(document);
                }
            });
        });
    }

    private async load(document: LegalDocument): Promise<void> {
        this.text.set(null);
        this.failed.set(false);

        try {
            const text = await this.legal.text(document);

            if (this.document() === document) {
                this.text.set(text);
            }
        } catch {
            this.failed.set(true);
        }
    }
}
