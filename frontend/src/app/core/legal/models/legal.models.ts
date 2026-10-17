export type LegalDocumentType = 'terms' | 'privacy_policy';

export interface LegalDocument {
    readonly type: LegalDocumentType;
    readonly version: string;
    readonly url: string;
}

/** Versiones vigentes que se muestran y se aceptan en el registro (FR-036). */
export interface CurrentLegalDocuments {
    readonly terms: LegalDocument;
    readonly privacyPolicy: LegalDocument;
}
