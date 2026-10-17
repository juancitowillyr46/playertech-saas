# Supabase local de PlayerTech

Base de datos, autenticación y almacenamiento de PlayerTech en local, versionados en este directorio. Especificación: [`specs/001-database-foundation/`](../specs/001-database-foundation/spec.md).

## Requisitos

- Docker Desktop en ejecución.
- Node 20.19 o superior.
- Dependencias instaladas en la raíz del repositorio: `npm install` (instala la Supabase CLI fijada en `package.json`).

## Comandos

Desde la raíz del repositorio:

| Comando | Qué hace |
|---|---|
| `npm run db:start` | Levanta Supabase local (la primera vez descarga las imágenes de Docker) |
| `npm run db:stop` | Detiene Supabase local |
| `npm run db:status` | Muestra las URL locales: API, Studio y visor de correo |
| `npm run db:reset` | Reconstruye la base de datos desde cero: aplica todas las migraciones y el seed |
| `npm run db:test` | Ejecuta las pruebas pgTAP de `tests/database/` |
| `npm run db:types` | Genera los tipos TypeScript en `frontend/src/app/core/supabase/database.types.ts` |

## Estructura

```text
supabase/
├── config.toml          # Configuración local (Auth, Storage, seed)
├── migrations/          # Migraciones versionadas, en orden de aplicación
├── seed.sql             # Datos de prueba: academias A y B
└── tests/database/      # Pruebas pgTAP
```

| Migración | Contenido |
|---|---|
| `foundation_extensions_and_helpers` | `unaccent`, `set_updated_at()`, `slugify()` |
| `platform_catalogs` | `plans` y `legal_documents`, con sus datos de referencia |
| `identity_profiles` | `profiles` |
| `tenancy_core` | `academies`, `subscriptions`, `academy_members` |
| `files` | `files` y la FK compuesta del logo |
| `venues` | `venues` y sus restricciones |
| `legal_acceptances` | `legal_acceptances` |
| `authorization_functions` | `is_academy_member`, `current_academy_id`, `has_academy_role` |
| `rls_policies_and_grants` | RLS, políticas y privilegios por columna |
| `registration` | Trigger de registro atómico `handle_new_user` y `set_primary_venue` |
| `storage` | Buckets `public-assets` y `private-files` y sus políticas |

El modelo está documentado en `docs/architecture/database-schema.md` (Fase 1) y el contrato con el frontend en `specs/001-database-foundation/contracts/`.

## Configuración de Auth local

`config.toml` reproduce las reglas de producción (ADR-014): confirmación de correo obligatoria, contraseña mínima de 8 caracteres, JWT de 1 hora y redirecciones permitidas a `http://localhost:4200/auth/callback` y `/auth/reset-password`. Los correos no se envían: quedan en el visor local (Mailpit), en la URL que muestra `npm run db:status`.

## Almacenamiento

| Bucket | Lectura | Escritura | Límites |
|---|---|---|---|
| `public-assets` | Pública por URL; listar por la API, solo miembros | Miembros de la academia del primer segmento de la ruta | JPG o PNG, máximo 1 MB |
| `private-files` | Miembros | Miembros | — |

Clave de un objeto: `{academy_id}/{módulo}/{entity_id}/{file_id}.{ext}`.

## Limitación conocida

El trigger `handle_new_user` se ejecuta en **toda** alta de `auth.users` y exige los metadatos del registro de una academia. Las altas sin esos metadatos (invitaciones, usuarios creados desde Studio, futuros roles de la Fase 2) fallarán hasta que el registro se rediseñe para otros roles. Para crear usuarios de prueba, usa el seed o `tests.create_user` en las pruebas.

## Validación (spec 001)

Resultado de la validación del 2026-10-16 con la Supabase CLI 2.119.0:

| Verificación | Resultado |
|---|---|
| Reconstrucción completa (`db:reset`) | Sin errores, entre 1 y 1,5 minutos; dos ejecuciones dan datos idénticos |
| Pruebas pgTAP (`db:test`) | 144 de 144: esquema, registro, aislamiento, suspensión, integridad y almacenamiento |
| Prueba de mutación | Al abrir a propósito la lectura de sedes y archivos, las pruebas fallan en 4 archivos |
| Auth: registro, inicio de sesión rechazado antes de verificar, correo en el visor, verificación, inicio de sesión, JWT de 3600 s, contraseña de 7 caracteres rechazada, correo de recuperación | Correcto |
| Inicio de sesión con `owner.a@playertech.test` del seed | Correcto |
| Storage: PNG aceptado; PDF y archivo de más de 1 MB rechazados por la API | Correcto |

## Nueva migración

Sigue la guía `docs/architecture/supabase-migrations-guide.md`. En resumen:

1. `npx supabase migration new <descripcion_en_snake_case>`
2. Escribe el cambio, incluidas sus políticas RLS.
3. `npm run db:reset` y `npm run db:test`.
4. Una migración ya compartida (en `main` o en un entorno remoto) **no se edita**: se corrige con una migración nueva.

## Usuarios de prueba

El seed crea dos owners con su academia, sede principal y suscripción Free:

| Usuario | Correo | Academia |
|---|---|---|
| Owner A | `owner.a@playertech.test` | `academia-a` |
| Owner B | `owner.b@playertech.test` | `academia-b` |

Contraseña de ambos: `PlayerTech-Local-2026`.

> Esta contraseña es **solo para desarrollo local**: los usuarios únicamente existen en tu Docker. No es un secreto ni se usa en ningún entorno remoto.
