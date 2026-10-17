import { Pipe, PipeTransform } from '@angular/core';

/** Iniciales de un nombre, máximo 2 letras: «Academia Los Andes» → «AL». */
export function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toLocaleUpperCase('es-CO'))
        .join('');
}

/**
 * Iniciales para sustituir un logo que no existe (academia en el topbar y en el
 * inicio). Lo usan el layout y la feature de inicio, por eso vive en `shared/`.
 */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
    transform(name: string | null | undefined): string {
        return initialsOf(name ?? '');
    }
}
