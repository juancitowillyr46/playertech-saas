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
