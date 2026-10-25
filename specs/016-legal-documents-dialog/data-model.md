# Modelo de datos: Documentos legales en la aplicación

Sin tablas nuevas. Migración `supabase/migrations/20261025100000_legal_documents_v2.sql` sobre `legal_documents` (spec 001).

## Cambios en `legal_documents`

| type | version | url | published_at | is_current |
|---|---|---|---|---|
| `terms` | `2026-10-v1` | (sin cambio, provisional) | 2026-10-16 | **false** |
| `privacy_policy` | `2026-10-v1` | (sin cambio, provisional) | 2026-10-16 | **false** |
| `terms` | `2026-10-v2` | `/legal/terms/2026-10-v2.html` | 2026-10-25 | **true** |
| `privacy_policy` | `2026-10-v2` | `/legal/privacy_policy/2026-10-v2.html` | 2026-10-25 | **true** |

- **Orden:** primero se desactiva la v1 y después se inserta la v2, por el índice único de una sola vigente por tipo.
- **URL:** relativa al sitio, el mismo origen del frontend.
- **Aceptaciones y autorizaciones existentes** (`legal_acceptances`, `guardian_links.consent_document_id`): siguen apuntando a la v1.
- **`seed.sql`:** las academias A y B aceptan la v2.

## Archivos

| Archivo | Contenido |
|---|---|
| `frontend/public/legal/terms/2026-10-v2.html` | Términos y Condiciones (R6) |
| `frontend/public/legal/privacy_policy/2026-10-v2.html` | Política de Tratamiento de Datos (R6) |

Un archivo publicado no se modifica: un texto nuevo es un archivo nuevo (`2026-xx-v3.html`), una fila nueva y el cambio de vigente.

## Privilegios

Sin cambios: `legal_documents` es legible por `anon` y `authenticated`.
