import { ageOn, searchKey, todayInColombia } from './search-text';

describe('search-text', () => {
    it('searchKey quita tildes y mayúsculas', () => {
        expect(searchKey(' José PÉREZ ')).toBe('jose perez');
    });

    it('todayInColombia usa la hora de Bogotá (UTC-5)', () => {
        expect(todayInColombia(new Date('2026-10-19T03:00:00Z'))).toBe('2026-10-18');
    });

    it('ageOn cuenta los años cumplidos', () => {
        expect(ageOn('2014-05-10', '2026-05-09')).toBe(11);
        expect(ageOn('2014-05-10', '2026-05-10')).toBe(12);
    });
});
