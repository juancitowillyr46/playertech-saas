import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SkeletonModule } from 'primeng/skeleton';
import { LegalDocumentsRepository } from '../../../../core/legal/data/legal-documents.repository';
import { LegalDocument } from '../../../../core/legal/models/legal.models';
import { LegalDocumentDialog } from '../../../../shared/components/legal-document-dialog/legal-document-dialog';
import { normalizePhone, PHONE_ERROR } from '../../../../shared/forms/phone.validator';
import { dateLabel, fromInstant, timeLabel } from '../../../../shared/text/colombia-time';
import { searchKey, todayInColombia } from '../../../../shared/text/search-text';
import { ResponseCard } from '../../components/response-card/response-card';
import { GuardianRelationship, publicActivityTitle, ResponseInput, rosterLabel, RosterPlayer } from '../../models/public-call-up.models';
import { CallUpResponseService } from '../../services/call-up-response.service';

const RELATIONSHIPS: readonly { value: GuardianRelationship; label: string }[] = [
    { value: 'mother', label: 'Mamá' },
    { value: 'father', label: 'Papá' },
    { value: 'grandparent', label: 'Abuelo o abuela' },
    { value: 'other', label: 'Otro' },
    { value: 'self', label: 'Soy el jugador' }
];

/** Con más convocados que estos, la lista lleva buscador. */
const SEARCH_FROM = 12;

/**
 * Página del enlace de una lista (`/c/:token`), sin cuenta (HU-009 y HU-010). Elegir por quién
 * respondes, identificarte la primera vez y responder; cerrada o cancelada, solo lectura.
 * Nunca muestra celulares ni respuestas de otros (FR-001).
 */
@Component({
    selector: 'app-call-up-response',
    imports: [FormsModule, ButtonModule, CheckboxModule, IconFieldModule, InputIconModule, InputTextModule, MessageModule, RadioButtonModule, SkeletonModule, ResponseCard, LegalDocumentDialog],
    providers: [CallUpResponseService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <main class="mx-auto flex min-h-screen max-w-md flex-col">
            <header class="border-b border-(--p-content-border-color) px-4 py-3">
                <p class="m-0 text-lg font-bold">{{ service.callUp()?.academy || 'PlayerTech' }}</p>
            </header>

            @switch (service.state()) {
                @case ('loading') {
                    <div class="flex flex-col gap-3 p-4" role="status" aria-label="Cargando la convocatoria">
                        <p-skeleton height="7rem" />
                        <p-skeleton height="3rem" />
                        <p-skeleton height="3rem" />
                    </div>
                }
                @case ('error') {
                    <div class="flex flex-col gap-3 p-4">
                        <p-message severity="error">No pudimos cargar la convocatoria. Revisa tu conexión e inténtalo de nuevo.</p-message>
                        <p-button label="Reintentar" icon="pi pi-refresh" [outlined]="true" (onClick)="reload()" />
                    </div>
                }
                @case ('not_found') {
                    <div class="flex flex-col gap-3 px-6 py-12">
                        <h1 class="m-0">Esta convocatoria ya no está disponible</h1>
                        <p class="m-0 text-lg text-muted-color">Revisa que el enlace esté completo o pídele uno nuevo a tu academia.</p>
                    </div>
                }
                @default {
                    @if (service.state() === 'readonly') {
                        <p-message severity="secondary" styleClass="mx-4 mt-4" role="status">{{ readonlyText() }}</p-message>
                    }

                    @if (activity(); as current) {
                        <section class="flex flex-col gap-1 bg-emphasis px-4 py-4" aria-labelledby="activity-title">
                            <h1 id="activity-title" class="m-0">{{ title() }}</h1>
                            <p class="m-0">{{ when() }}</p>
                            @if (current.place; as place) {
                                <p class="m-0">{{ placeText() }}</p>
                                @if (place.directions) {
                                    <p class="m-0 text-muted-color">Cómo llegar: {{ place.directions }}</p>
                                }
                            }
                            @if (current.tournament) {
                                <p class="m-0 text-muted-color">{{ current.tournament }}</p>
                            }
                            @if (current.notes) {
                                <p class="m-0 whitespace-pre-line text-muted-color">{{ current.notes }}</p>
                            }
                            @if (service.state() !== 'readonly') {
                                <p class="m-0 font-semibold">{{ deadlineText() }}</p>
                            }
                        </section>
                    }

                    <div class="flex flex-col gap-4 p-4">
                        @switch (service.state()) {
                            @case ('choose') {
                                <h2 class="m-0 text-lg">¿Por quién respondes?</h2>
                                @if (roster().length > searchFrom) {
                                    <p-iconfield>
                                        <p-inputicon class="pi pi-search" />
                                        <input pInputText type="search" aria-label="Buscar jugador" placeholder="Nombre o apodo" class="w-full" [ngModel]="query()" (ngModelChange)="query.set($event)" />
                                    </p-iconfield>
                                }
                                <ul class="m-0 list-none border-t border-(--p-content-border-color) p-0" aria-label="Convocados">
                                    @for (player of visibleRoster(); track player.playerId) {
                                        <li class="border-b border-(--p-content-border-color)">
                                            <button type="button" class="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent px-1 text-left text-color" (click)="choose(player)">
                                                <span>{{ label(player) }}</span>
                                                <i class="pi pi-angle-right text-muted-color" aria-hidden="true"></i>
                                            </button>
                                        </li>
                                    } @empty {
                                        <li class="py-4 text-muted-color">Ningún jugador coincide con la búsqueda.</li>
                                    }
                                </ul>
                                <p class="m-0 text-muted-color">Si eres un jugador adulto, búscate y elige «Soy el jugador» en el siguiente paso.</p>
                                <p class="m-0 text-muted-color">¿No ves a tu jugador? Escríbele a la academia.</p>
                                @if (service.hasPlayers()) {
                                    <p-button label="Volver a mis jugadores" [text]="true" styleClass="-ml-3" (onClick)="service.backToChoose()" />
                                }
                            }
                            @case ('identify') {
                                @if (service.selectedPlayer(); as player) {
                                    <div class="flex min-h-12 items-center justify-between gap-2 rounded-border border border-(--p-content-border-color) pl-3">
                                        <span>
                                            Respondes por <strong>{{ label(player) }}</strong>
                                        </span>
                                        <p-button label="Cambiar" [text]="true" (onClick)="service.backToChoose()" />
                                    </div>
                                }

                                @if (service.knownDevice()) {
                                    <p class="m-0 text-muted-color">Ya te conocemos: solo indica tu parentesco con este jugador.</p>
                                } @else {
                                    <h2 class="m-0 text-lg">¿Quién eres?</h2>
                                }

                                <form class="flex flex-col gap-4" (ngSubmit)="identify()" novalidate>
                                    @if (!service.knownDevice() && relationship() !== 'self') {
                                        <div class="flex flex-col gap-2">
                                            <label for="guardianName" class="font-medium">¿Cómo te llamas?</label>
                                            <input pInputText id="guardianName" name="guardianName" autocomplete="name" maxlength="120" aria-describedby="guardianName-help" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" />
                                            <small id="guardianName-help" class="text-muted-color">Basta tu nombre.</small>
                                        </div>
                                    }
                                    @if (!service.knownDevice()) {
                                        <div class="flex flex-col gap-2">
                                            <label for="guardianPhone" class="font-medium">Tu celular</label>
                                            <input pInputText id="guardianPhone" name="guardianPhone" type="tel" inputmode="tel" autocomplete="tel" [ngModel]="phone()" (ngModelChange)="phone.set($event)" />
                                        </div>
                                    }
                                    <fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
                                        <legend class="mb-2 p-0 font-medium">Parentesco</legend>
                                        <div class="grid grid-cols-2 gap-2">
                                            @for (option of relationships; track option.value) {
                                                <label [for]="'relationship-' + option.value" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-border border border-(--p-content-border-color) px-3">
                                                    <p-radiobutton name="relationship" [value]="option.value" [inputId]="'relationship-' + option.value" [ngModel]="relationship()" (ngModelChange)="relationship.set($event)" />
                                                    <span>{{ option.label }}</span>
                                                </label>
                                            }
                                        </div>
                                    </fieldset>
                                    @if (!service.knownDevice()) {
                                        <div class="flex items-start gap-3">
                                            <p-checkbox inputId="guardianConsent" name="guardianConsent" [binary]="true" [ngModel]="consent()" (ngModelChange)="consent.set($event)" [pt]="consentPt" />
                                            <span>
                                                <label id="guardianConsent-label" for="guardianConsent">Autorizo el tratamiento de mis datos según la</label>&ngsp;
                                                @if (policy(); as document) {
                                                    <button id="guardianConsent-document" type="button" class="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary underline underline-offset-4" (click)="read(document)">
                                                        Política de Tratamiento de Datos</button
                                                    >.
                                                } @else {
                                                    <span id="guardianConsent-document">Política de Tratamiento de Datos</span>.
                                                }
                                            </span>
                                        </div>
                                        <p class="m-0 text-sm text-muted-color">Solo la academia ve tus datos y confirmará que eres acudiente.</p>
                                    }
                                    @if (identifyError(); as message) {
                                        <p-message severity="error" role="alert">{{ message }}</p-message>
                                    }
                                    <p-button type="submit" label="Continuar" styleClass="w-full" [loading]="service.busy()" />
                                </form>
                            }
                            @case ('respond') {
                                @if (service.myActive().length > 1) {
                                    <p class="m-0 text-muted-color">Responde por tus jugadores:</p>
                                }
                                @for (player of service.myActive(); track player.playerId) {
                                    <app-response-card [player]="player" [busy]="service.busy()" [error]="responseErrors()[player.playerId] ?? null" (respond)="respond(player.playerId, $event)" />
                                }
                                @for (player of service.myRemoved(); track player.playerId) {
                                    <app-response-card [player]="player" />
                                }
                                <p-button label="¿Respondes por alguien más?" [text]="true" styleClass="w-full" (onClick)="service.addSomeone()" />
                            }
                            @case ('readonly') {
                                @if (service.callUp()?.mine?.length) {
                                    <h2 class="m-0 text-lg">Tus respuestas</h2>
                                    @for (player of service.callUp()!.mine; track player.playerId) {
                                        <app-response-card [player]="player" [open]="false" />
                                    }
                                    <p class="m-0 text-muted-color">¿Necesitas cambiar algo? Escríbele a la academia.</p>
                                }
                            }
                        }
                    </div>
                }
            }
        </main>

        <app-legal-document-dialog [document]="reading()" (closed)="reading.set(null)" />
    `
})
export class CallUpResponsePage implements OnInit {
    /** Parámetro de la ruta `/c/:token`. */
    readonly token = input.required<string>();

    protected readonly service = inject(CallUpResponseService);
    private readonly legal = inject(LegalDocumentsRepository);

    protected readonly relationships = RELATIONSHIPS;
    protected readonly searchFrom = SEARCH_FROM;
    protected readonly query = signal('');
    protected readonly fullName = signal('');
    protected readonly phone = signal('');
    protected readonly relationship = signal<GuardianRelationship | null>(null);
    protected readonly consent = signal(false);
    protected readonly identifyError = signal<string | null>(null);
    protected readonly responseErrors = signal<Partial<Record<string, string>>>({});
    protected readonly policy = signal<LegalDocument | null>(null);
    /** La casilla se nombra con su etiqueta y el nombre del documento (HU-043). */
    protected readonly consentPt = { input: { 'aria-labelledby': 'guardianConsent-label guardianConsent-document' } };
    /** Política abierta en el dialog (HU-043). */
    protected readonly reading = signal<LegalDocument | null>(null);

    protected readonly activity = computed(() => this.service.callUp()?.activity ?? null);
    protected readonly roster = computed(() => this.service.callUp()?.roster ?? []);
    protected readonly visibleRoster = computed(() => {
        const query = searchKey(this.query());

        return this.roster().filter((player) => !query || searchKey(rosterLabel(player)).includes(query));
    });
    protected readonly title = computed(() => {
        const activity = this.activity();

        return activity ? publicActivityTitle(activity) : '';
    });
    protected readonly when = computed(() => {
        const activity = this.activity();

        if (!activity) {
            return '';
        }

        const start = fromInstant(activity.startsAt);
        const call = activity.callAt ? ` · llegar ${timeLabel(fromInstant(activity.callAt).time)}` : '';

        return `${dateLabel(start.date, todayInColombia())}${call} · inicia ${timeLabel(start.time)}`;
    });
    protected readonly placeText = computed(() => {
        const place = this.activity()?.place;

        return place ? [place.name, place.address, place.city].filter(Boolean).join(', ') : '';
    });
    protected readonly deadlineText = computed(() => {
        const deadline = this.service.callUp()?.deadline;

        if (!deadline) {
            return 'Responde hasta que empiece la actividad.';
        }

        const value = fromInstant(deadline);

        return `Responde hasta el ${dateLabel(value.date, todayInColombia()).toLocaleLowerCase('es-CO')}, ${timeLabel(value.time)}.`;
    });
    protected readonly readonlyText = computed(() => (this.service.callUp()?.status === 'cancelled' ? 'Se canceló la actividad.' : 'La convocatoria está cerrada. Ya no se reciben respuestas.'));

    ngOnInit(): void {
        void this.service.load(this.token());
        void this.legal
            .getCurrent()
            .then((documents) => this.policy.set(documents.privacyPolicy))
            .catch(() => this.policy.set(null));
    }

    /**
     * Abre el documento en el dialog (HU-043). Su botón va fuera de la etiqueta de la casilla, así
     * que leer no la marca (CA-002); la casilla se nombra con los dos (`aria-labelledby`).
     */
    protected read(document: LegalDocument): void {
        this.reading.set(document);
    }

    protected reload(): void {
        void this.service.load(this.token());
    }

    protected label(player: RosterPlayer): string {
        return rosterLabel(player);
    }

    protected choose(player: RosterPlayer): void {
        this.identifyError.set(null);
        this.relationship.set(null);
        this.service.choose(player);
    }

    protected async identify(): Promise<void> {
        const player = this.service.selectedPlayer();
        const recognized = this.service.knownDevice();
        const relationship = this.relationship();
        const phone = normalizePhone(this.phone());
        const error = !relationship
            ? 'Elige tu parentesco.'
            : !recognized && relationship !== 'self' && !this.fullName().trim()
              ? 'Escribe tu nombre.'
              : !recognized && !/^3\d{9}$/.test(phone)
                ? PHONE_ERROR
                : !recognized && !this.consent()
                  ? 'Debes autorizar el tratamiento de tus datos para continuar.'
                  : null;

        this.identifyError.set(error);

        if (error || !player || !relationship || this.service.busy()) {
            return;
        }

        try {
            await this.service.identify({
                playerId: player.playerId,
                fullName: recognized || relationship === 'self' ? null : this.fullName().trim(),
                phone: recognized ? null : phone,
                relationship,
                consent: recognized || this.consent()
            });
        } catch (failure) {
            this.identifyError.set(messageOf(failure));
        }
    }

    protected async respond(playerId: string, input: ResponseInput): Promise<void> {
        try {
            await this.service.respond(playerId, input);
            this.responseErrors.update((errors) => Object.fromEntries(Object.entries(errors).filter(([id]) => id !== playerId)));
        } catch (failure) {
            this.responseErrors.update((errors) => ({ ...errors, [playerId]: messageOf(failure) }));
        }
    }
}

function messageOf(error: unknown): string {
    return error instanceof Error && error.message ? error.message : 'No pudimos guardar. Inténtalo de nuevo.';
}
