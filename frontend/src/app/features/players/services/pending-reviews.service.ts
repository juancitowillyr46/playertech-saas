import { computed, inject, Injectable, signal } from '@angular/core';
import { NoticesService } from '../../../core/notices/notices.service';
import { GuardianRepository } from '../data/guardian.repository';
import { AcademyPendingGuardian, LinkRelationship, ReviewDecision } from '../models/player.models';

/**
 * Una persona por validar: su celular nuevo (o su vínculo, si no hay dispositivo), los
 * jugadores nuevos que eligió y los que ya acompañaba. Validarla confirma todo a la vez.
 */
export interface PendingPerson {
    readonly key: string;
    readonly guardianName: string;
    readonly declaredName: string | null;
    readonly relationship: LinkRelationship;
    readonly phone: string;
    readonly at: string;
    readonly phoneMatch: boolean;
    readonly deviceId: string | null;
    /** Vínculos nuevos, pendientes: jugador y parentesco. */
    readonly newLinks: readonly { readonly linkId: string; readonly playerName: string; readonly relationship: LinkRelationship }[];
    /** Jugadores de los que ya es acudiente validado (el pendiente es su celular nuevo). */
    readonly knownPlayers: readonly string[];
}

/** Un dispositivo es una persona; sin dispositivo, cada vínculo pendiente lo es. */
function personKey(item: AcademyPendingGuardian): string {
    return item.deviceId ?? `link:${item.linkId}`;
}

/**
 * Todos los pendientes de validar de la academia (spec 014, CA-004 de HU-041), agrupados por
 * persona (ajuste del 2026-10-22: el mismo celular se mostraba una vez por jugador). Validar y
 * rechazar usan la operación de HU-040 sobre el celular y todos sus vínculos nuevos.
 */
@Injectable()
export class PendingReviewsService {
    private readonly guardians = inject(GuardianRepository);
    private readonly notices = inject(NoticesService);

    readonly items = signal<readonly AcademyPendingGuardian[]>([]);
    readonly busy = signal(false);
    readonly people = computed<readonly PendingPerson[]>(() => {
        const people = new Map<string, PendingPerson>();

        for (const item of this.items()) {
            const key = personKey(item);
            const person = people.get(key) ?? {
                key,
                guardianName: item.guardianName,
                declaredName: item.declaredName,
                relationship: item.relationship,
                phone: item.phone,
                at: item.at,
                phoneMatch: item.phoneMatch,
                deviceId: item.deviceId,
                newLinks: [],
                knownPlayers: []
            };

            people.set(
                key,
                item.linkId
                    ? { ...person, relationship: item.relationship, newLinks: [...person.newLinks, { linkId: item.linkId, playerName: item.playerName, relationship: item.relationship }] }
                    : { ...person, knownPlayers: [...person.knownPlayers, item.playerName] }
            );
        }

        return [...people.values()].sort((a, b) => b.at.localeCompare(a.at));
    });

    async load(): Promise<void> {
        this.items.set(await this.guardians.pendingByAcademy());
    }

    /** El celular va con el primer vínculo; los demás vínculos nuevos se resuelven después. */
    async review(person: PendingPerson, decision: ReviewDecision): Promise<void> {
        if (this.busy()) {
            return;
        }

        this.busy.set(true);

        try {
            if (person.newLinks.length === 0) {
                await this.guardians.review(null, person.deviceId, decision);
            }

            for (const [index, link] of person.newLinks.entries()) {
                await this.guardians.review(link.linkId, index === 0 ? person.deviceId : null, decision);
            }
        } finally {
            try {
                await this.load();
                await this.notices.refresh();
            } finally {
                this.busy.set(false);
            }
        }
    }
}
