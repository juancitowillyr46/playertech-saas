# Contrato: rutas, guards y pantallas base

Implementa la tabla de rutas de `docs/architecture/frontend.md` y FR-017 a FR-025 y FR-035 de la spec.

## Rutas

| Ruta | Layout | Guards | Contenido en esta spec | HU que la completa |
|---|---|---|---|---|
| `/` | — | — | Redirige a `/home` | — |
| `/auth/login` | Autenticación | `guestGuard` | Marcador | HU-001 |
| `/auth/register` | Autenticación | `guestGuard` | Marcador | HU-014 |
| `/auth/verify-email` | Autenticación | `guestGuard` | Marcador | HU-014 |
| `/auth/forgot-password` | Autenticación | `guestGuard` | Marcador | HU-016 |
| `/auth/reset-password` | Autenticación | — | Marcador | HU-016 |
| `/auth/callback` | Autenticación | — | **Funcional** (estados abajo) | — |
| `/auth/access-denied` | Autenticación | — | **Funcional**: explicación y cerrar sesión | — |
| `/auth/suspended` | Autenticación | — | **Funcional**: explicación y cerrar sesión | — |
| `/home` | Aplicación | `authGuard`, `membershipGuard` | Marcador | HU-032 |
| `/settings/academy` | Aplicación | `authGuard`, `membershipGuard` | Marcador | HU-017 |
| `/settings/venues` | Aplicación | `authGuard`, `membershipGuard` | Marcador | HU-029 a HU-031 |
| `/error` | Propio | `authGuard` | **Funcional**: no se pudo cargar la academia; botón **Reintentar** | — |
| `/dev` y `/dev/**` | Aplicación (sin guards) | — | Demos de SakaiNG | Solo desarrollo |
| `/dev/login` | Autenticación | — | **Funcional**: correo y contraseña con `AuthService.signIn` | Solo desarrollo |
| `**` | Propio | — | **Funcional**: página no encontrada con enlace al inicio | — |

"Marcador" = el título de la pantalla y un mensaje "Disponible pronto", dentro de su layout.

## Guards

| Guard | Sin sesión | Con sesión, contexto `active` | `none` | `suspended` | `error` |
|---|---|---|---|---|---|
| `authGuard` | `/auth/login?returnUrl=<ruta>` | Pasa | Pasa | Pasa | Pasa |
| `membershipGuard` | (lo resuelve `authGuard`) | Pasa | `/auth/access-denied` | `/auth/suspended` | Pantalla de error con **Reintentar** |
| `guestGuard` | Pasa | `/home` | `/home` | `/home` | `/home` |

Los guards esperan a que `AuthService.ready()` sea verdadero. No protegen datos: la protección real es RLS (spec 001).

## Pantalla `/auth/callback`

| Entrada | Estado | Qué ve el usuario | Destino |
|---|---|---|---|
| `?code=…` y el intercambio funciona | `processing` → éxito | "Verificando…" | `next` (si es una ruta interna permitida) o `/home`, con `replaceUrl` |
| `?error=…` o `?error_code=…` | `invalid` | "El enlace venció o ya fue usado." | Enlace a `/auth/login` |
| Sin `code` ni `error` | `invalid` | Igual | Enlace a `/auth/login` |
| `?code=…` sin verificador en este navegador | `other_browser` | "Abriste el enlace en otro navegador. Si estabas verificando tu correo, ya puedes iniciar sesión. Si estabas recuperando tu contraseña, solicita un enlace nuevo desde el navegador donde lo pediste." | Enlaces a `/auth/login` y `/auth/forgot-password` |

Valores permitidos de `next`: rutas que empiezan por `/home` o `/auth/reset-password`. Cualquier otro valor se ignora.

## Redirecciones permitidas en Supabase Auth (local)

`supabase/config.toml`: `site_url = "http://localhost:4200"` y `additional_redirect_urls = ["http://localhost:4200/auth/callback**"]`. Se retira la entrada `/auth/reset-password` agregada en la spec 001.
