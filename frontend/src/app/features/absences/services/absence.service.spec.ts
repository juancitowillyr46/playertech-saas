import { TestBed } from '@angular/core/testing';
import { AppError } from '../../../core/errors/app-error';
import { CallUpRepository } from '../../call-ups/data/call-up.repository';
import { CallUp, CurrentResponse } from '../../call-ups/models/call-up.models';
import { GuardianRepository } from '../../players/data/guardian.repository';
import { PlayerRepository } from '../../players/data/player.repository';
import { Guardian, PlayerSummary } from '../../players/models/player.models';
import { AbsenceRepository } from '../data/absence.repository';
import { activityStarting, callUpPlayer, callUpWith, response, rosterPlayer } from '../testing/absence-fixtures';
import { AbsenceService } from './absence.service';

function setup(options: { callUp?: CallUp | null; responses?: CurrentResponse[]; roster?: PlayerSummary[]; guardians?: Partial<Guardian>[] } = {}) {
    const repository = { list: vi.fn().mockResolvedValue([]), setAbsent: vi.fn().mockResolvedValue(undefined), markNotified: vi.fn().mockResolvedValue('2026-10-24T21:12:00.000Z') };
    const callUps = { getByActivity: vi.fn().mockResolvedValue(options.callUp ?? null), responses: vi.fn().mockResolvedValue(options.responses ?? []) };
    const players = { listGroups: vi.fn().mockResolvedValue([{ id: 'g12', name: 'Sub-12' }]), listPlayers: vi.fn().mockResolvedValue(options.roster ?? []) };
    const guardians = { listByPlayer: vi.fn().mockResolvedValue(options.guardians ?? []) };
    TestBed.configureTestingModule({
        providers: [AbsenceService, { provide: AbsenceRepository, useValue: repository }, { provide: CallUpRepository, useValue: callUps }, { provide: PlayerRepository, useValue: players }, { provide: GuardianRepository, useValue: guardians }]
    });

    return { service: TestBed.inject(AbsenceService), repository, callUps, guardians };
}

describe('AbsenceService', () => {
    it('no lee nada antes del inicio (CA-001)', async () => {
        const { service, repository } = setup();
        await service.load(activityStarting('later'));

        expect(service.window()).toBe('before');
        expect(repository.list).not.toHaveBeenCalled();
    });

    it('con convocatoria ordena: Sí, provisional o sin respuesta, y No aparte (CA-002)', async () => {
        const callUp = callUpWith([callUpPlayer('p1', 'Zoe', 'A'), callUpPlayer('p2', 'Ana', 'B'), callUpPlayer('p3', 'Luis', 'C'), callUpPlayer('p4', 'Beto', 'D')]);
        const { service } = setup({ callUp, responses: [response('p1', 'yes'), response('p2', 'no', 'viaje'), response('p3', 'maybe')] });
        await service.load(activityStarting('today'));
        await service.loadCandidates();

        expect(service.candidates().map((player) => [player.playerId, player.responseLabel])).toEqual([
            ['p1', 'Dijo Sí'],
            ['p4', 'Sin respuesta'],
            ['p3', 'Provisional'],
            ['p2', 'Dijo No · viaje']
        ]);
    });

    it('sin convocatoria muestra los jugadores activos de los grupos elegidos, sin repetir (CA-002)', async () => {
        const roster = [rosterPlayer('p1', 'Mateo', 'Rodas', ['g12', 'g14']), rosterPlayer('p2', 'Ana', 'Ruiz', ['g14']), rosterPlayer('p3', 'Leo', 'Paz', ['g10']), rosterPlayer('p4', 'Inés', 'Gil', ['g12'], { isActive: false })];
        const { service } = setup({ roster });
        await service.load(activityStarting('today'));
        await service.loadCandidates();
        service.selectGroups(['g12', 'g14']);

        expect(service.candidates().map((player) => player.playerId)).toEqual(['p2', 'p1']);
    });

    it('marca al momento, desmarca y no toca la convocatoria (CA-003, FR-008)', async () => {
        // La convocatoria simulada solo tiene lecturas: marcar no la modifica.
        const { service, repository } = setup();
        await service.load(activityStarting('today'));
        await service.toggle({ playerId: 'p1', fullName: 'Mateo Rodas' });

        expect(service.isAbsent('p1')).toBe(true);
        expect(service.summary()).toBe('1 no llegó · 0 avisados');
        await service.toggle({ playerId: 'p1', fullName: 'Mateo Rodas' });
        expect(service.isAbsent('p1')).toBe(false);
        expect(repository.setAbsent.mock.calls).toEqual([
            ['a1', 'p1', true],
            ['a1', 'p1', false]
        ]);
    });

    it('si falla, la marca vuelve a como estaba y propaga el error', async () => {
        const { service, repository } = setup();
        repository.setAbsent.mockRejectedValue(new AppError('network'));
        await service.load(activityStarting('today'));

        await expect(service.toggle({ playerId: 'p1', fullName: 'Mateo Rodas' })).rejects.toMatchObject({ code: 'network' });
        expect(service.isAbsent('p1')).toBe(false);
    });

    it('avisa a los acudientes, o al jugador si no tiene; «Avisado» con la hora del servidor (CA-004)', async () => {
        const { service, guardians } = setup({
            guardians: [
                { fullName: 'Juan Rodas', phone: '3125953354', relationship: 'father' },
                { fullName: 'Mateo Rodas', phone: '3001112233', relationship: 'self' }
            ]
        });
        await service.load(activityStarting('today'));
        const candidate = { playerId: 'p1', firstNames: 'Mateo', lastNames: 'Rodas', nickname: null, fullName: 'Mateo Rodas', section: 'group' as const, responseLabel: null, phone: null, guardians: null };

        expect(await service.recipients(candidate)).toEqual([{ key: '0', label: 'Juan Rodas · Papá', phone: '3125953354', firstName: 'Juan', isPlayer: false }]);
        guardians.listByPlayer.mockResolvedValue([{ fullName: 'Mateo Rodas', phone: '3001112233', relationship: 'self' }]);
        expect(await service.recipients(candidate)).toEqual([{ key: 'player', label: 'Mateo · el jugador', phone: '3001112233', firstName: 'Mateo', isPlayer: true }]);
        expect(await service.recipients({ ...candidate, guardians: [] })).toEqual([]);

        await service.toggle(candidate);
        await service.notified('p1');
        expect(service.summary()).toBe('1 no llegó · 1 avisado');
    });
});
