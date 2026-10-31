export type LegalDocumentType = 'terms' | 'privacy_policy';

export interface LegalDocument {
    readonly type: LegalDocumentType;
    readonly version: string;
    /** Ruta de su archivo estático (`/legal/<tipo>/<versión>.html`, DEC-49). */
    readonly url: string;
    readonly publishedAt: string;
}

/** Versiones vigentes que se muestran y se aceptan en el registro (FR-036). */
export interface CurrentLegalDocuments {
    readonly terms: LegalDocument;
    readonly privacyPolicy: LegalDocument;
}
