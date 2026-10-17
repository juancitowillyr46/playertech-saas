import { CurrentLegalDocuments } from '../models/legal.models';

/** Documentos legales vigentes, legibles sin sesión (spec 001). Lo usa el registro (FR-036). */
export abstract class LegalDocumentsRepository {
    abstract getCurrent(): Promise<CurrentLegalDocuments>;
}
