import { StoredFile, UploadFileInput } from '../models/storage.models';

/**
 * Almacenamiento de archivos independiente del proveedor (ADR-013). Ninguna
 * pantalla construye claves ni URLs de almacenamiento. Ante un fallo, toda
 * operación rechaza con `AppError`.
 */
export abstract class FileStorageRepository {
    /** Sube el archivo al espacio de la academia actual y lo registra en `files`. */
    abstract upload(input: UploadFileInput): Promise<StoredFile>;

    /** URL pública (`public-assets`) o firmada con caducidad (`private-files`). */
    abstract getUrl(file: StoredFile, options?: { expiresInSeconds?: number }): Promise<string>;

    /** Borrado lógico en `files`; el objeto físico se conserva hasta la limpieza del MVP+. */
    abstract remove(file: StoredFile): Promise<void>;

    /**
     * Borrado lógico en `files` y borrado del objeto físico. Solo para archivos sin historial
     * útil, como el logo (DEC-22, excepción de ADR-013). Primero marca el registro, para que un
     * fallo nunca deje un registro vigente sin objeto.
     */
    abstract purge(file: StoredFile): Promise<void>;
}
