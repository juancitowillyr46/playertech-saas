/** Minúsculas y sin tildes, para buscar «jose» y encontrar «José». */
export function searchKey(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Fecha de hoy en Colombia (`yyyy-mm-dd`), sin depender de la zona del dispositivo. */
export function todayInColombia(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
}

/** Años cumplidos a una fecha, ambas en `yyyy-mm-dd`. */
export function ageOn(birthDate: string, today: string): number {
    const [birthYear, birthMonthDay] = [Number(birthDate.slice(0, 4)), birthDate.slice(5)];
    const [year, monthDay] = [Number(today.slice(0, 4)), today.slice(5)];

    return year - birthYear - (monthDay < birthMonthDay ? 1 : 0);
}
