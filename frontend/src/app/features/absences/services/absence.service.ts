import { computed, inject, Injectable, signal } from '@angular/core';
import { Activity } from '../../activities/models/activity.models';
import { CallUpRepository } from '../../call-ups/data/call-up.repository';
import { CallUpGuardian, CurrentResponse } from '../../call-ups/models/call-up.models';
import { GuardianRepository } from '../../players/data/guardian.repository';
import { PlayerRepository } from '../../players/data/player.repository';
import { fullNameWithNickname, GroupRef, PlayerSummary, relationshipLabel } from '../../players/models/player.models';
import { AbsenceRepository } from '../data/absence.repository';
import { firstName } from '../messages/absence-message';
import { Absence, AbsenceCandidate, AbsenceRecipient, AbsenceSection, absenceSummary, absenceWindow } from '../models/absence.models';

const SECTION_ORDER: Record<AbsenceSection, number> = { yes: 0, pending: 1, no: 2, group: 3 };

function byName(a: AbsenceCandidate, b: AbsenceCandidate): number {
    return a.fullName.localeCompare(b.fullName, 'es');
}

function responseOf(response: CurrentResponse | undefined): { section: AbsenceSection; label: string } {
    switch (response?.answer) {
        case 'yes':
            return { section: 'yes', label: 'Dijo Sí' };
        case 'maybe':
            return { section: 'pending', label: 'Provisional' };
        case 'no':
            return { section: 'no', label: response.reasonText ? `Dijo No · ${response.reasonText}` : 'Dijo No' };
        default:
            return { section: 'pending', label: 'Sin respuesta' };
    }
}

/**
 * Aviso de inasistencia de una actividad (spec 015, research R3 y R4). Lo provee la sección
 * del detalle. La lista sale de la convocatoria o de los grupos elegidos; marcar no toca la
 * convocatoria (FR-008).
 */
@Injectable()
export class AbsenceService {
    private readonly repository = inject(AbsenceRepository);
    private readonly callUps = inject(CallUpRepository);
    private readonly players = inject(PlayerRepository);
    private readonly guardians = inject(GuardianRepository);

    private readonly activity = signal<Activity | null>(null);
    private readonly now = signal(new Date());
    private readonly roster = signal<readonly PlayerSummary[]>([]);
    /** Candidatos de la convocatoria; null si la actividad no tiene. */
    private readonly callUpCandidates = signal<readonly AbsenceCandidate[] | null>(null);

    readonly absences = signal<readonly Absence[]>([]);
    readonly groups = signal<readonly GroupRef[]>([]);
    readonly selectedGroups = signal<readonly string[]>([]);

    readonly hasCallUp = computed(() => this.callUpCandidates() !== null);
    readonly window = computed(() => {
        const activity = this.activity();

        return activity ? absenceWindow(activity.startsAt, this.now()) : 'before';
    });
    readonly absent = computed(() => this.absences().filter((absence) => absence.active));
    readonly summary = computed(() => absenceSummary(this.absences()));

    /** Con convocatoria: Sí, provisional o sin respuesta y No. Sin ella: los grupos elegidos, sin repetir. */
    readonly candidates = computed<readonly AbsenceCandidate[]>(() => {
        const fromCallUp = this.callUpCandidates();

        if (fromCallUp) {
            return fromCallUp;
        }

        const selected = new Set(this.selectedGroups());

        return this.roster()
            .filter((player) => player.groups.some((group) => selected.has(group.id)))
            .map((player) => ({
                playerId: player.id,
                firstNames: player.firstNames,
                lastNames: player.lastNames,
                nickname: player.nickname,
                fullName: fullNameWithNickname(player),
                section: 'group' as const,
                responseLabel: null,
                phone: player.phone,
                guardians: null
            }))
            .sort(byName);
    });

    /** Lee las ausencias; la lista para marcar se carga al abrirla (`loadCandidates`). */
    async load(activity: Activity): Promise<void> {
        this.activity.set(activity);
        this.now.set(new Date());

        if (activity.status !== 'scheduled' || this.window() === 'before') {
            this.absences.set([]);
            return;
        }

        this.absences.set(await this.repository.list(activity.id));
    }

    async loadCandidates(): Promise<void> {
        const activity = this.activity();

        if (!activity) {
            return;
        }

        const callUp = await this.callUps.getByActivity(activity.id);

        if (!callUp) {
            const [groups, roster] = await Promise.all([this.players.listGroups(), this.players.listPlayers()]);
            this.groups.set(groups);
            this.roster.set(roster.filter((player) => player.isActive));
            this.callUpCandidates.set(null);
            return;
        }

        const responses = new Map((await this.callUps.responses(callUp.id)).map((response) => [response.playerId, response]));
        const seen = new Set<string>();
        const candidates: AbsenceCandidate[] = [];

        for (const player of callUp.lists.flatMap((list) => list.players)) {
            if (seen.has(player.playerId)) {
                continue;
            }

            seen.add(player.playerId);
            const response = responseOf(responses.get(player.playerId));
            candidates.push({
                playerId: player.playerId,
                firstNames: player.firstNames,
                lastNames: player.lastNames,
                nickname: player.nickname,
                fullName: fullNameWithNickname(player),
                section: response.section,
                responseLabel: response.label,
                phone: player.phone,
                guardians: player.guardians
            });
        }

        this.callUpCandidates.set(candidates.sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section] || byName(a, b)));
    }

    selectGroups(ids: readonly string[]): void {
        this.selectedGroups.set(ids);
    }

    absenceOf(playerId: string): Absence | null {
        return this.absences().find((absence) => absence.playerId === playerId) ?? null;
    }

    isAbsent(playerId: string): boolean {
        return this.absenceOf(playerId)?.active ?? false;
    }

    /** Marca o desmarca al momento; si falla, la deja como estaba y propaga el error (spec, «Sin conexión»). */
    async toggle(candidate: Pick<AbsenceCandidate, 'playerId' | 'fullName'>): Promise<void> {
        const activity = this.activity();

        if (!activity) {
            return;
        }

        const previous = this.absenceOf(candidate.playerId);
        const absent = !(previous?.active ?? false);
        this.replace(candidate.playerId, previous ? { ...previous, active: absent } : { playerId: candidate.playerId, fullName: candidate.fullName, markedAt: new Date().toISOString(), notifiedAt: null, active: true });

        try {
            await this.repository.setAbsent(activity.id, candidate.playerId, absent);
        } catch (error) {
            this.replace(candidate.playerId, previous);
            throw error;
        }
    }

    /**
     * A quién avisar (misma regla que «Enviar» de la spec 012): los acudientes validados y, si no
     * tiene, el propio jugador con celular.
     */
    async recipients(candidate: AbsenceCandidate): Promise<readonly AbsenceRecipient[]> {
        let guardians: readonly CallUpGuardian[];
        let phone = candidate.phone;

        if (candidate.guardians) {
            guardians = candidate.guardians;
        } else {
            const links = await this.guardians.listByPlayer(candidate.playerId);
            guardians = links.filter((link) => link.relationship !== 'self');
            phone = phone ?? links.find((link) => link.relationship === 'self')?.phone ?? null;
        }

        if (guardians.length > 0) {
            return guardians.map((guardian, index) => ({ key: String(index), label: `${guardian.fullName} · ${relationshipLabel(guardian.relationship)}`, phone: guardian.phone, firstName: firstName(guardian.fullName), isPlayer: false }));
        }

        return phone ? [{ key: 'player', label: `${candidate.firstNames} · el jugador`, phone, firstName: firstName(candidate.firstNames), isPlayer: true }] : [];
    }

    /** «Avisado» con la hora del servidor (FR-006). */
    async notified(playerId: string): Promise<void> {
        const activity = this.activity();
        const current = this.absenceOf(playerId);

        if (!activity || !current) {
            return;
        }

        const notifiedAt = await this.repository.markNotified(activity.id, playerId);
        this.replace(playerId, { ...current, notifiedAt });
    }

    private replace(playerId: string, absence: Absence | null): void {
        const others = this.absences().filter((item) => item.playerId !== playerId);
        this.absences.set(absence ? [...others, absence] : others);
    }
}
