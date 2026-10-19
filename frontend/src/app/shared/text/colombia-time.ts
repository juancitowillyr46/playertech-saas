/**
 * Fechas y horas de Colombia (spec 011, research R1). Colombia usa UTC−5 todo el año
 * (sin horario de verano), así que la conversión con el instante es un desfase fijo y
 * no depende de la zona del dispositivo. Fechas en `yyyy-mm-dd` y horas en `HH:mm`.
 */
const OFFSET = '-05:00';
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Fecha y hora de Colombia → instante ISO con su desfase. */
export function toInstant(date: string, time: string): string {
    return new Date(`${date}T${time}:00${OFFSET}`).toISOString();
}

/** Instante → fecha y hora de Colombia. */
export function fromInstant(iso: string): { date: string; time: string } {
    const local = new Date(new Date(iso).getTime() - OFFSET_MS).toISOString();

    return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

/** Día de Colombia de un instante (`yyyy-mm-dd`), para agrupar. */
export function dayKey(iso: string): string {
    return fromInstant(iso).date;
}

/** Día de la semana (0 = domingo) de una fecha `yyyy-mm-dd`. */
export function weekdayOf(date: string): number {
    return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Suma días a una fecha `yyyy-mm-dd`. */
export function addDays(date: string, days: number): string {
    return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Fechas entre `from` y `until` (incluidas) que caen en los días de la semana elegidos (0 = domingo). */
export function weeklyDates(from: string, until: string, weekdays: readonly number[]): string[] {
    const dates: string[] = [];

    for (let date = from; date <= until; date = addDays(date, 1)) {
        if (weekdays.includes(weekdayOf(date))) {
            dates.push(date);
        }
    }

    return dates;
}

/** «Hoy», «Mañana» o «Martes 20 de octubre» (con el año si no es el actual). */
export function dayLabel(date: string, today: string): string {
    if (date === today) {
        return 'Hoy';
    }

    if (date === addDays(today, 1)) {
        return 'Mañana';
    }

    const [year, month, day] = date.split('-').map(Number);
    const weekday = WEEKDAYS[weekdayOf(date)];
    const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} de ${MONTHS[month - 1]}`;

    return year === Number(today.slice(0, 4)) ? label : `${label} de ${year}`;
}

/** «4:00 p. m.» */
export function timeLabel(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours < 12 ? 'a. m.' : 'p. m.';

    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
