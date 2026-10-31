import { inject, Injectable } from '@angular/core';
import { LegalTextRepository } from '../data/legal-text.repository';
import { LegalDocument } from '../models/legal.models';

/** Texto de los documentos legales para el dialog (HU-043); cada versión se descarga una sola vez. */
@Injectable({ providedIn: 'root' })
export class LegalDocumentService {
    private readonly repository = inject(LegalTextRepository);
    private readonly texts = new Map<string, string>();

    async text(document: LegalDocument): Promise<string> {
        const known = this.texts.get(document.url);

        if (known !== undefined) {
            return known;
        }

        const text = await this.repository.getText(document.url);
        this.texts.set(document.url, text);

        return text;
    }
}
