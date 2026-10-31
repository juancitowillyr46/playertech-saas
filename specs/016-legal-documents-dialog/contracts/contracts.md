# Contratos: Documentos legales en la aplicación

## Base de datos

Ver `data-model.md`. Prueba pgTAP (`140-legal-documents-v2.test.sql`):
- la v2 es la vigente de los dos tipos;
- su URL es la ruta relativa de su archivo;
- la v1 sigue existiendo, ya no vigente;
- un registro nuevo acepta la v2;
- `anon` lee las versiones vigentes.

## Repositorios y servicios (`core/legal`)

```ts
/** Texto de un documento legal publicado (R3). */
export abstract class LegalTextRepository {
    /** Contenido de su <main>; falla si no se puede descargar. */
    abstract getText(url: string): Promise<string>;
}
```

- `LegalDocument` gana `publishedAt` (lo lee `getCurrent`).
- `LegalDocumentService.text(document)` devuelve el texto y lo guarda en memoria por URL.
- `PlayerDetailService.privacyPolicyUrl()` pasa a `privacyPolicy(): Promise<LegalDocument | null>`.

## Interfaz

**Componente** `app-legal-document-dialog`:
- **Entradas:** `document: LegalDocument | null` (null = cerrado).
- **Salida:** `closed`.
- **Título:** «Términos y Condiciones» o «Política de Tratamiento de Datos».
- **Debajo del título:** «Versión 2026-10-v2 · publicada el 25 de octubre de 2026».
- **Cargando:** un esqueleto.
- **Error:** «No pudimos cargar el documento. Revisa tu conexión o ábrelo en otra pestaña.», con el enlace «Abrir en otra pestaña».
- **Botón:** «Cerrar».

**Los tres sitios:** el nombre del documento es un botón con aspecto de enlace (`button`, no `a` con `href`) que abre el dialog. La casilla no cambia.

## Cobertura de criterios

| Criterio | pgTAP | Vitest | Quickstart |
|---|---|---|---|
| CA-001 dialog | — | Registro, ficha y respuesta pública abren el dialog con el texto | 1 y 2 |
| CA-002 leer no acepta | — | Cerrar no cambia la casilla ni lo escrito | 1 |
| CA-003 versión | v2 vigente; el registro acepta la v2 | El dialog muestra la versión que se envía al registrar | 1 |
| CA-004 no carga | — | Error y enlace a otra pestaña | 3 |
| FR-006 página propia | — | — | 4 |
