import { initialsOf, InitialsPipe } from './initials.pipe';

describe('initialsOf', () => {
    it('toma la inicial de las dos primeras palabras', () => {
        expect(initialsOf('Academia Los Andes')).toBe('AL');
    });

    it('con una sola palabra devuelve una letra, en mayúscula', () => {
        expect(initialsOf('tigres')).toBe('T');
    });

    it('ignora espacios de más y nombres vacíos', () => {
        expect(initialsOf('  Club   Deportivo ')).toBe('CD');
        expect(new InitialsPipe().transform(null)).toBe('');
    });
});
