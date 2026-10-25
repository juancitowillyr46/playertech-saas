import { Absence, absenceSummary, absenceWindow } from './absence.models';

const absence = (overrides: Partial<Absence> = {}): Absence => ({ playerId: 'p', fullName: 'Mateo Rodas', markedAt: 't', notifiedAt: null, active: true, ...overrides });

describe('absence.models', () => {
    it('el plazo va del inicio al final de ese día en Colombia (CA-001)', () => {
        // 4:00 p. m. del 24 de octubre en Colombia.
        const startsAt = '2026-10-24T21:00:00.000Z';

        expect(absenceWindow(startsAt, new Date('2026-10-24T20:59:00.000Z'))).toBe('before');
        expect(absenceWindow(startsAt, new Date('2026-10-24T21:00:00.000Z'))).toBe('open');
        // 11:59 p. m. en Colombia: aún abierto; medianoche: lectura.
        expect(absenceWindow(startsAt, new Date('2026-10-25T04:59:00.000Z'))).toBe('open');
        expect(absenceWindow(startsAt, new Date('2026-10-25T05:00:00.000Z'))).toBe('closed');
    });

    it('resume las ausencias vigentes y sus avisos (CA-005)', () => {
        expect(absenceSummary([])).toBe('0 no llegaron · 0 avisados');
        expect(absenceSummary([absence({ notifiedAt: 'x' })])).toBe('1 no llegó · 1 avisado');
        expect(absenceSummary([absence(), absence({ notifiedAt: 'x' }), absence(), absence({ active: false, notifiedAt: 'x' })])).toBe('3 no llegaron · 1 avisado');
    });
});
