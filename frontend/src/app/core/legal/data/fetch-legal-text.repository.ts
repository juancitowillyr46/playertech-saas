import { Injectable } from '@angular/core';
import { AppError } from '../../errors/app-error';
import { LegalTextRepository } from './legal-text.repository';

/**
 * Descarga el archivo del documento, publicado con el frontend (DEC-49), y devuelve el
 * contenido de su `<main>`. No pasa por Supabase.
 */
@Injectable()
export class FetchLegalTextRepository extends LegalTextRepository {
    async getText(url: string): Promise<string> {
        let response: Response;

        try {
            response = await fetch(url);
        } catch (error) {
            throw new AppError('network', { cause: error });
        }

        if (!response.ok) {
            throw new AppError('network', { cause: new Error(`Documento legal no disponible: ${response.status}`) });
        }

        const main = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('main');

        if (!main) {
            throw new AppError('unknown', { cause: new Error('El documento legal no tiene <main>') });
        }

        return main.innerHTML;
    }
}
