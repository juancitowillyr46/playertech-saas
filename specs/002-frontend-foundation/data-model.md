# Modelo de datos: Base del frontend y esqueleto de PlayerTech

Esta spec no crea tablas: usa las de la spec 001 (`docs/architecture/database-schema.md`, Fase 1). Aquí se definen los **modelos de dominio del frontend**, que los repositorios Supabase construyen a partir de las filas y que el resto de la aplicación usa. Los tipos generados (`database.types.ts`) nunca salen de las implementaciones Supabase (FR-013).

## Modelos

| Modelo | Ubicación | Campos | Origen |
|---|---|---|---|
| `AuthUser` | `core/auth/models` | `id`, `email`, `emailConfirmed` | Sesión de Supabase Auth |
| `AuthSession` | `core/auth/models` | `user: AuthUser`, `expiresAt` | Sesión de Supabase Auth |
| `SignUpInput` | `core/auth/models` | `email`, `password`, `academyName`, `fullName`, `legalAcceptances: { terms, privacyPolicy }` | Formulario de HU-014 → metadatos de `contracts/registration-metadata.md` (spec 001) |
| `AcademyContext` | `core/academy-context/models` | `status: 'loading' \| 'active' \| 'suspended' \| 'none' \| 'error'`, `academy?: CurrentAcademy` | R6 |
| `CurrentAcademy` | `core/academy-context/models` | `id`, `name`, `logoFileId?` | Fila de `academies` |
| `StoredFile` | `core/storage/models` | `id`, `bucket`, `storageKey`, `mimeType`, `sizeBytes` | Fila de `files` |
| `UploadFileInput` | `core/storage/models` | `file: File`, `bucket`, `module`, `entityId` | Pantalla que sube (HU-017) |
| `AppError` | `core/errors` | `code: AppErrorCode`, `message` (es-CO), `cause?` | R10 |
| `NavigationItem` | `core/navigation` | `label`, `icon`, `routerLink?`, `items?`, `devOnly?` | Configuración estática |

## Reglas de transformación

- Los nombres pasan de `snake_case` (base de datos) a `camelCase` (dominio) en el repositorio.
- `SignUpInput.legalAcceptances` se serializa como `legal_acceptances.terms` y `legal_acceptances.privacy_policy`, y `academyName` / `fullName` como `academy_name` / `full_name`, según el contrato de la spec 001.
- La clave de un archivo nuevo se construye **solo** dentro de `SupabaseFileStorageRepository`: `{academyId}/{module}/{entityId}/{fileId}.{ext}`, con `academyId` tomado del contexto de academia y `fileId` generado con `crypto.randomUUID()`. Ninguna pantalla construye claves ni URLs (ADR-013).

## Estados

### Sesión (`AuthService`)

```text
desconocida (iniciando) ──restaurar──► sin sesión ──iniciar sesión / callback──► con sesión
                                           ▲                                        │
                                           └──── cerrar sesión / caducidad / otra pestaña ┘
```

Los guards esperan a salir de "desconocida" antes de decidir (R8, R9).

### Contexto de academia (`AcademyContextService`)

```text
loading ──► active
        ├─► suspended
        ├─► none
        └─► error ──reintentar──► loading
(cerrar sesión) ──► se descarta
```

### Pantalla de retorno (`/auth/callback`)

```text
processing ──► (éxito) navega a next o /home
           ├─► invalid        (error en la URL, sin código o código rechazado)
           └─► other_browser  (falta el verificador PKCE en este navegador)
```
