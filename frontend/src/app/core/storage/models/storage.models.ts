export type StorageBucket = 'public-assets' | 'private-files';

/** Archivo registrado en `files` (ADR-013). */
export interface StoredFile {
    readonly id: string;
    readonly bucket: StorageBucket;
    readonly storageKey: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
}

export interface UploadFileInput {
    readonly file: File;
    readonly bucket: StorageBucket;
    /** Módulo funcional al que pertenece el archivo, por ejemplo `academy`. */
    readonly module: string;
    readonly entityId: string;
}
