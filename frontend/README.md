# PlayerTech — Frontend

Aplicación Angular de PlayerTech, el SaaS multi-tenant para academias deportivas. La arquitectura está en [`docs/architecture/frontend.md`](../docs/architecture/frontend.md) y la guía para agentes y personas en [`AGENTS.md`](../AGENTS.md).

## Requisitos

- **Node 24 LTS** (`.nvmrc`). Con nvm: `nvm use 24`.
- Supabase local de la spec 001 en ejecución (requiere Docker Desktop): desde la raíz del repositorio, `npm run db:start`. Usuarios de prueba en [`supabase/README.md`](../supabase/README.md).

## Comandos

Desde `frontend/`:

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm start` | Servidor de desarrollo en http://localhost:4200, conectado a Supabase local |
| `npm run build` | Compilación de producción en `dist/playertech/` |
| `npm run lint` | Análisis estático (ESLint con `angular-eslint`), incluida la regla que impide usar Supabase fuera de los repositorios |
| `npm test` | Pruebas con Vitest en modo observación |
| `npm run test:ci` | Pruebas una sola vez, sin navegador |
| `npm run check:bundle` | Verifica que la compilación de producción no contenga claves privilegiadas ni demos *(spec 002, Historia 6)* |

## Configuración

`src/environments/environment.development.ts` apunta a Supabase local con su clave publicable por defecto, que es pública por diseño. `src/environments/environment.ts` (producción) queda vacío hasta crear el proyecto en la nube (ADR-016); sin esos valores la aplicación no arranca, a propósito.

Nunca se coloca en el frontend una clave secreta (`sb_secret_…`) ni la `service_role`.

## Estructura

```text
src/
├── app.config.ts         # Proveedores: tema, idioma, errores, Supabase, repositorios
├── app.routes.ts         # Rutas
├── environments/         # Configuración pública por entorno
└── app/
    ├── core/             # Capacidades transversales: auth, contexto de academia, almacenamiento,
    │                     # errores, i18n, tema, navegación, cliente de Supabase
    ├── shared/           # Reutilizable entre features, sin lógica de negocio
    ├── features/         # Una carpeta por funcionalidad
    ├── layout/           # Layout de SakaiNG adoptado por PlayerTech
    └── pages/            # Demos de SakaiNG: solo referencia, no se modifican
```

Capas: página → servicio → repositorio (clase abstracta) → implementación Supabase. Solo los archivos `supabase-*.ts` y `core/supabase/` usan el SDK de Supabase.

## Validación (spec 002)

Resultado de `specs/002-frontend-foundation/quickstart.md` del 2026-10-17, con Node 24.21.0 y Supabase local de la spec 001:

| Sección | Resultado |
|---|---|
| §1 Calidad | `build` sin errores (bundle inicial de 918 KB, dentro del presupuesto de 1 MB); `lint` sin errores; 103 pruebas en verde; `check:bundle` sin claves ni demos. Una prueba negativa confirmó que `check:bundle` detecta una clave `sb_secret_…` y un JWT `service_role` |
| §2 Pantallas de autenticación | Registro, rechazo antes de verificar, inicio de sesión, mensaje único de recuperación (DEC-12) |
| §3 Enlaces de correo | Verificación → `/home` en 0,9 s sin el código en la URL; enlace reutilizado → "El enlace venció o ya fue usado"; recuperación completa con la nueva contraseña; enlace abierto en otro navegador → mensaje explicativo y correo verificado |
| §4 Acceso protegido | Sin sesión → login con `returnUrl` y regreso a la ruta pedida; con sesión, `/auth/login` → `/home`; academia suspendida → pantalla de suspensión sin datos de la academia; membresía desactivada → acceso denegado; cerrar sesión → login |
| §5 Navegación | A 360 px: sin desplazamiento horizontal, áreas táctiles de ~44 px, nombre de la academia en la barra; modo oscuro persistido; sin errores en consola |
| §6 Demos | En desarrollo, `/dev` muestra las demos y la sección "Demos (desarrollo)"; en producción no existen (`check:bundle`) |
| §7 Arquitectura | `lint` rechaza importar el SDK de Supabase o los tipos generados fuera de los repositorios |

Las verificaciones en navegador se hicieron con Chrome automatizado contra Supabase local; Playwright llegará con los flujos de negocio (Fase 2).

## Origen

La base visual proviene de [SakaiNG](https://github.com/primefaces/sakai-ng) (PrimeTek), distribuida con licencia MIT; ver `LICENSE.md`. Las actualizaciones de SakaiNG se integran según [`docs/engineering/sakai-upstream.md`](../docs/engineering/sakai-upstream.md).
