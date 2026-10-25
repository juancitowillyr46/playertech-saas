import { Activity } from '../../activities/models/activity.models';
import { absenceMessage, firstName } from './absence-message';

const training: Pick<Activity, 'type' | 'opponent' | 'startsAt' | 'place'> = {
    type: 'training',
    opponent: null,
    startsAt: '2026-10-24T21:00:00.000Z',
    place: { kind: 'venue', id: 'v', name: 'Sede principal', address: null, city: null, directions: null }
};

describe('absenceMessage', () => {
    it('saluda al acudiente y dice qué actividad, a qué hora y dónde (FR-005)', () => {
        expect(absenceMessage({ recipientFirstName: 'Juan', playerFirstName: 'Mateo', activity: training })).toBe('Hola, Juan. Mateo no llegó hoy al entrenamiento de las 4:00 p. m. en Sede principal. ¿Está todo bien?');
    });

    it('al propio jugador le escribe en segunda persona; un partido nombra al rival', () => {
        expect(absenceMessage({ recipientFirstName: null, playerFirstName: 'Mateo', activity: { ...training, type: 'competition', opponent: 'Club Norte' } })).toBe(
            'Hola, Mateo. No llegaste hoy al partido vs. Club Norte de las 4:00 p. m. en Sede principal. ¿Está todo bien?'
        );
    });

    it('toma el primer nombre', () => {
        expect(firstName('  Juan Pablo Rodas ')).toBe('Juan');
    });
});
