# Modelo de datos: Gestión de la academia

Sin cambios en la base de datos (R1). Columnas en `docs/architecture/database-schema.md`.

## AcademyProfile (modelo de la feature)

| Campo | Origen | Regla |
|---|---|---|
| `id` | `academies.id` | Del contexto de academia |
| `name` | `academies.name` | Obligatorio; se recorta |
| `contactEmail` | `academies.contact_email` | Opcional; formato de correo; independiente del correo de inicio de sesión |
| `contactPhone` | `academies.contact_phone` | Opcional |
| `address` | `academies.address` | Opcional |
| `city` | `academies.city` | Opcional |
| `planName` | `subscriptions` activa → `plans.name` | Solo lectura |
| `logo` | `files` vigente apuntado por `logo_file_id` | `StoredFile` o `null` |
| `logoUrl` | `FileStorageRepository.getUrl(logo)` | `null` sin logo |

`AcademyProfileInput = { name, contactEmail, contactPhone, address, city }`. Los opcionales vacíos se guardan como `null`.

## Logo

| Regla | Valor |
|---|---|
| Tipos | `image/jpeg`, `image/png`, comprobados también por los primeros bytes |
| Tamaño de la imagen elegida | Hasta 5 242 880 bytes (5 MB) |
| Lo que se guarda | Lado mayor de 512 px como máximo, mismo formato, nunca más de 1 048 576 bytes |
| Clave | `{academyId}/academy/{academyId}/{fileId}.{ext}` en `public-assets` (ADR-013) |
| Reemplazo y retiro | La imagen anterior se borra del almacenamiento; su registro recibe `deleted_at` |

## Tareas de «Completa tu academia» (calculadas)

| `key` | Etiqueta | `done` | `route` |
|---|---|---|---|
| `academy` | Academia creada | siempre `true` | — |
| `primaryVenue` | Dirección de la sede principal | la sede principal tiene `address` no vacía | `/settings/venues` |
| `logo` | Logo de la academia | la academia tiene logo vigente | `/settings/academy` |
| `contact` | Teléfono y dirección de la academia | `contact_phone` y `address` de la academia no vacíos | `/settings/academy` |

Progreso: `completedCount` de 4. La tarjeta se muestra si `completedCount < 4`.
