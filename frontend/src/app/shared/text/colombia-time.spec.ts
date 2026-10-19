import { addDays, dayKey, dayLabel, fromInstant, timeLabel, toInstant, weeklyDates } from './colombia-time';

describe('colombia-time', () => {
    it('convierte fecha y hora de Colombia en instante y de vuelta (UTC−5)', () => {
        expect(toInstant('2026-10-20', '16:00')).toBe('2026-10-20T21:00:00.000Z');
        expect(fromInstant('2026-10-21T03:30:00.000Z')).toEqual({ date: '2026-10-20', time: '22:30' });
    });

    it('dayKey usa el día de Colombia, no el UTC', () => {
        expect(dayKey('2026-10-21T02:00:00.000Z')).toBe('2026-10-20');
    });

    it('weeklyDates incluye los extremos y solo los días elegidos (martes y jueves)', () => {
        expect(weeklyDates('2026-10-20', '2026-11-03', [2, 4])).toEqual(['2026-10-20', '2026-10-22', '2026-10-27', '2026-10-29', '2026-11-03']);
        expect(weeklyDates('2026-10-19', '2026-10-20', [4])).toEqual([]);
    });

    it('dayLabel: Hoy, Mañana o el día con su nombre', () => {
        expect(dayLabel('2026-10-18', '2026-10-18')).toBe('Hoy');
        expect(dayLabel('2026-10-19', '2026-10-18')).toBe('Mañana');
        expect(dayLabel('2026-10-20', '2026-10-18')).toBe('Martes 20 de octubre');
        expect(dayLabel('2027-01-05', '2026-10-18')).toBe('Martes 5 de enero de 2027');
    });

    it('timeLabel en 12 horas y addDays cruza meses', () => {
        expect(timeLabel('16:00')).toBe('4:00 p. m.');
        expect(timeLabel('00:15')).toBe('12:15 a. m.');
        expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    });
});
