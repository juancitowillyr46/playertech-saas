import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { SignUpInput } from '../../../core/auth/models/auth.models';
import { LegalDocumentsRepository } from '../../../core/legal/data/legal-documents.repository';
import { CurrentLegalDocuments } from '../../../core/legal/models/legal.models';

/** Casos de uso del registro de una academia (versión básica de HU-014). */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
    private readonly legalDocuments = inject(LegalDocumentsRepository);
    private readonly auth = inject(AuthService);

    loadLegalDocuments(): Promise<CurrentLegalDocuments> {
        return this.legalDocuments.getCurrent();
    }

    register(input: SignUpInput): Promise<void> {
        return this.auth.signUp(input);
    }
}
