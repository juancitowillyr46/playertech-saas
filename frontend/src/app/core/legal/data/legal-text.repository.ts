/** Texto de un documento legal publicado como archivo estático (spec 016, R3). */
export abstract class LegalTextRepository {
    /** Contenido HTML de su `<main>`; falla si no se puede descargar. */
    abstract getText(url: string): Promise<string>;
}
