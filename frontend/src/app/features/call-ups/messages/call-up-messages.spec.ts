import { Activity } from '../../activities/models/activity.models';
import { CallUpList, CallUpPlayer } from '../models/call-up.models';
import { cancellationNotice, changeNotice, listMessage, personalMessage } from './call-up-messages';
const activity: Activity = {
    id: 'a',
    type: 'competition',
    startsAt: '2030-10-26T14:00:00.000Z',
    endsAt: '2030-10-26T15:00:00.000Z',
    callAt: '2030-10-26T13:30:00.000Z',
    place: { kind: 'field', id: 'f', name: 'Salitre', address: 'Calle 63', city: 'Bogotá', directions: null },
    notes: 'Uniforme azul',
    opponent: 'Norte',
    tournament: 'Liga',
    status: 'scheduled',
    seriesId: null
};
const player: CallUpPlayer = { playerId: 'p', firstNames: 'Samuel', lastNames: 'Vargas', nickname: 'Samu', phone: null, guardians: [] };
const list: CallUpList = { id: 'l', groupId: 'g', groupName: '2017', token: 't', intro: null, players: [player] };
describe('mensajes de convocatoria', () => {
    it('arma el mensaje de lista con texto propio, narrativa y convocados en viñetas', () => {
        const text = listMessage(' Hola ', activity, list, 'https://x/c/t', '2030-10-25T01:00:00.000Z');
        expect(text).toBe(
            [
                'Hola',
                'El sábado 26 de octubre de 2030 tenemos partido contra Norte (Liga) en Salitre, Calle 63, Bogotá. Debemos estar a las 8:30 a. m.; el partido empieza a las 9:00 a. m. y termina a las 10:00 a. m.',
                'Uniforme azul',
                'Convocados (1):\n• Samuel V. · Samu',
                'Confirmen la asistencia antes del jueves 24 de octubre de 2030 a las 8:00 p. m.:\nhttps://x/c/t',
                '¡Los esperamos!'
            ].join('\n\n')
        );
    });
    it('un entrenamiento sin hora de llegada se narra en primera persona', () => {
        const training: Activity = { ...activity, type: 'training', callAt: null, endsAt: null, opponent: null, tournament: null };
        expect(listMessage(null, training, list, 'x', null)).toContain('tenemos entrenamiento en Salitre, Calle 63, Bogotá. Empezamos a las 9:00 a. m.');
    });
    it('arma el mensaje personal y los avisos', () => {
        expect(personalMessage(null, activity, player, 'x', null)).toContain('Samuel V. · Samu está convocado al partido contra Norte (Liga) del sábado 26 de octubre de 2030');
        expect(cancellationNotice(activity)).toBe('Se cancela el partido contra Norte (Liga) del sábado 26 de octubre de 2030 a las 9:00 a. m. en Salitre.');
        expect(changeNotice(activity, { ...activity, place: { ...activity.place, id: 'f2', name: 'Norte' } }, 'x')).toContain('• Nuevo lugar: Norte, Calle 63, Bogotá (antes Salitre)');
    });
    it('no agrega líneas vacías cuando el texto propio no existe', () => {
        expect(listMessage(null, activity, list, 'x', null)).not.toContain('\n\n\n');
        expect(changeNotice(activity, { ...activity, notes: 'Otra nota' }, 'x')).not.toContain('(antes');
    });
});
