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
    it('arma el mensaje de lista con texto propio y datos actuales', () => {
        const text = listMessage(' Hola ', activity, list, 'https://x/c/t', '2030-10-25T01:00:00.000Z');
        expect(text).toContain('Hola\n\n');
        expect(text).toContain('Competencia vs. Norte');
        expect(text).toContain('Samuel V. · Samu');
        expect(text).toContain('Responde aquí: https://x/c/t');
    });
    it('arma el mensaje personal y avisos sin líneas sobrantes', () => {
        expect(personalMessage(null, activity, player, 'x', null)).toContain('Samuel V. · Samu fue convocado.');
        expect(cancellationNotice(activity, 'x')).toContain('Se cancela');
        expect(changeNotice(activity, { ...activity, place: { ...activity.place, id: 'f2', name: 'Norte' } }, 'x')).toContain('antes Salitre');
    });
    it('no agrega líneas vacías cuando el texto propio no existe', () => {
        expect(listMessage(null, activity, list, 'x', null)).not.toContain('\n\n\n');
        expect(changeNotice(activity, { ...activity, notes: 'Otra nota' }, 'x')).not.toContain('(antes');
    });
});
