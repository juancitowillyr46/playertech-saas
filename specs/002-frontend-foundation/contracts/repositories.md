# Contrato: repositorios del núcleo

Contratos independientes del proveedor que usan las HU de la Fase 1. Son **clases abstractas** registradas como token de inyección (`{ provide: AuthRepository, useClass: SupabaseAuthRepository }`), según ADR-002 y `docs/architecture/frontend.md`. Todas las operaciones son asíncronas y, ante un fallo, **rechazan con `AppError`** (ver [app-errors.md](app-errors.md)); nunca propagan errores del proveedor.

Los modelos están en [data-model.md](../data-model.md).

## AuthRepository (`core/auth/data`)

| Operación | Firma | Uso | Notas |
|---|---|---|---|
| Registrar | `signUp(input: SignUpInput): Promise<void>` | HU-014 | Envía los metadatos de la spec 001 y `emailRedirectTo = {origen}/auth/callback`. Un correo ya registrado no se revela (DEC-12) |
| Iniciar sesión | `signIn(email: string, password: string): Promise<AuthSession>` | HU-001, `/dev/login` | `email_not_confirmed` e `invalid_credentials` como `AppError` |
| Cerrar sesión | `signOut(): Promise<void>` | HU-015, menú de usuario | |
| Pedir recuperación | `requestPasswordReset(email: string): Promise<void>` | HU-016 | `redirectTo = {origen}/auth/callback?next=/auth/reset-password`. Siempre resuelve igual, exista o no la cuenta |
| Cambiar contraseña | `updatePassword(newPassword: string): Promise<void>` | HU-016 | Requiere la sesión temporal de recuperación |
| Intercambiar el código | `exchangeCodeForSession(code: string): Promise<AuthSession>` | `/auth/callback` | Falla con `link_invalid` o `other_browser` (R7) |
| Sesión actual | `getSession(): Promise<AuthSession \| null>` | Inicio de la aplicación | Restaura la sesión persistida |
| Cambios de sesión | `onSessionChange(listener: (session: AuthSession \| null) => void): () => void` | `AuthService` | Devuelve la función para cancelar la suscripción |

## AcademyContextRepository (`core/academy-context/data`)

| Operación | Firma | Notas |
|---|---|---|
| Resolver el contexto | `loadCurrent(): Promise<AcademyContext>` | Devuelve `active`, `suspended` o `none` según la tabla de `research.md` (R6). El usuario se deduce de la sesión; no recibe identificadores |

## FileStorageRepository (`core/storage/data`)

| Operación | Firma | Notas |
|---|---|---|
| Subir | `upload(input: UploadFileInput): Promise<StoredFile>` | Sube el objeto con clave `{academyId}/{module}/{entityId}/{fileId}.{ext}` y registra la fila en `files`. El `academyId` sale del contexto de academia. Si el registro en `files` falla, retira el objeto subido |
| Obtener la dirección | `getUrl(file: StoredFile, options?: { expiresInSeconds?: number }): Promise<string>` | URL pública para `public-assets`; URL firmada con caducidad (60 min por defecto) para `private-files` |
| Retirar | `remove(file: StoredFile): Promise<void>` | Borrado lógico (`deleted_at`) en `files`, según ADR-013. El objeto físico se conserva hasta la limpieza del MVP+ |

## Servicios de aplicación (`core/`)

Los componentes usan estos servicios, nunca los repositorios directamente:

| Servicio | Estado expuesto (signals) | Acciones |
|---|---|---|
| `AuthService` | `session`, `user`, `isAuthenticated`, `ready` | `signIn`, `signOut`, `restore` |
| `AcademyContextService` | `context`, `academy`, `status` | `load`, `reload`, `clear` |
