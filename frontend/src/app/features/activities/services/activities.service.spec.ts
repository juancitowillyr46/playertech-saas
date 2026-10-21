import { CallUpRepository } from '../../call-ups/data/call-up.repository';
import { TestBed } from '@angular/core/testing';
import { VenueRepository } from '../../venues/data/venue.repository';
import { ActivityRepository } from '../data/activity.repository';
import { ExternalFieldRepository } from '../data/external-field.repository';
import { Activity } from '../models/activity.models';
import { ActivitiesService, ActivityDraft, draftDates, toActivityInput } from './activities.service';

const activity = (id: string, startsAt: string, overrides: Partial<Activity> = {}): Activity => ({
    id,
    type: 'training',
    startsAt,
    endsAt: null,
    callAt: null,
    place: { kind: 'venue', id: 'v1', name: 'Sede Norte', address: null, city: null, directions: null },
    notes: null,
    opponent: null,
    tournament: null,
    status: 'scheduled',
    seriesId: null,
    ...overrides
});

const DRAFT: ActivityDraft = {
    type: 'training',
    date: '2026-10-20',
    start: '16:00',
    end: '17:30',
    call: '15:30',
    place: { kind: 'venue', id: 'v1' },
    notes: '  Uniforme azul ',
    opponent: 'No aplica',
    tournament: null,
    repeat: null
};

function setup() {
    const repository = {
        list: vi.fn().mockResolvedValue([activity('a1', '2026-10-20T21:00:00.000Z'), activity('a2', '2026-10-21T02:00:00.000Z', { type: 'competition' }), activity('a3', '2026-10-22T21:00:00.000Z')]),
        get: vi.fn(),
        create: vi.fn().mockResolvedValue(5),
        update: vi.fn().mockResolvedValue(undefined),
        setStatus: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined)
    };
    const venues = {
        listVenues: vi.fn().mockResolvedValue([
            { id: 'v1', name: 'Sede Norte', isActive: true },
            { id: 'v2', name: 'Sede Vieja', isActive: false }
        ])
    };
    const fields = { list: vi.fn().mockResolvedValue([{ id: 'f1', name: 'Cancha El Salitre', city: 'Bogotá' }]) };

    TestBed.configureTestingModule({
        providers: [
            ActivitiesService,
            { provide: ActivityRepository, useValue: repository },
            { provide: CallUpRepository, useValue: { summaries: vi.fn().mockResolvedValue([]) } },
            { provide: VenueRepository, useValue: venues },
            { provide: ExternalFieldRepository, useValue: fields }
        ]
    });

    return { service: TestBed.inject(ActivitiesService), repository };
}

describe('ActivitiesService', () => {
    it('agrupa por día de Colombia y filtra por tipo (HU-006)', async () => {
        const { service } = setup();
        await service.load('upcoming');

        // a2 (02:00 UTC del 21) es el 20 en Colombia.
        expect(service.days().map((day) => [day.key, day.activities.map((item) => item.id)])).toEqual([
            ['2026-10-20', ['a1', 'a2']],
            ['2026-10-22', ['a3']]
        ]);

        service.typeFilter.set('competition');
        expect(service.days().map((day) => day.key)).toEqual(['2026-10-20']);
    });

    it('toActivityInput convierte horas de Colombia y descarta rival en entrenamiento', () => {
        expect(toActivityInput(DRAFT)).toEqual({
            type: 'training',
            startsAt: '2026-10-20T21:00:00.000Z',
            endsAt: '2026-10-20T22:30:00.000Z',
            callAt: '2026-10-20T20:30:00.000Z',
            place: { kind: 'venue', id: 'v1' },
            notes: 'Uniforme azul',
            opponent: null,
            tournament: null
        });
    });

    it('create con repetición: una sola llamada con todas las fechas y una serie (CA-006 de HU-005)', async () => {
        const { service, repository } = setup();
        const draft = { ...DRAFT, repeat: { weekdays: [2, 4], until: '2026-11-03' } };

        expect(draftDates(draft)).toHaveLength(5);
        expect(await service.create(draft)).toBe(5);
        expect(repository.create).toHaveBeenCalledTimes(1);
        const [inputs, seriesId] = repository.create.mock.calls[0];
        expect(inputs).toHaveLength(5);
        expect(typeof seriesId).toBe('string');
    });

    it('create sin repetición: una actividad y sin serie', async () => {
        const { service, repository } = setup();

        await service.create(DRAFT);

        expect(repository.create).toHaveBeenCalledWith([toActivityInput(DRAFT)], null);
    });

    it('placeOptions: solo sedes activas y las canchas con su ciudad', async () => {
        const { service } = setup();

        expect(await service.placeOptions()).toEqual({
            venues: [{ label: 'Sede Norte', value: { kind: 'venue', id: 'v1' } }],
            fields: [{ label: 'Cancha El Salitre · Bogotá', value: { kind: 'field', id: 'f1' } }]
        });
    });
});
