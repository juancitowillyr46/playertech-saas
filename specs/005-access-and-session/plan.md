# Plan de implementación: Acceso y sesión

**Branch**: `005-access-and-session` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/005-access-and-session/spec.md` (EP-01: HU-001, HU-015 y HU-016)

## Resumen

Completar la versión básica de acceso de la spec 002. El trabajo es de frontend y **no hay migraciones ni cambios en el seed** (R1). Tiene cinco partes:

- **Cierre por inactividad** (DEC-28): `InactivityService` en `core/auth`. Guarda la hora de la última interacción en el navegador y la compara con la hora actual al volver a la aplicación, cada 30 s mientras está visible y al arrancar (R2 a R5).
- **Comprobación al arrancar**: `AuthService.restore()` cierra la sesión vencida antes de que se muestre ninguna ruta privada (R4).
- **Motivo del cierre**: lo conserva `AuthService`; el inicio de sesión muestra el aviso solo tras un cierre por inactividad (R6).
- **Cierre de sesión solo en este dispositivo**: hoy el cierre usa el alcance global de Supabase y cierra todos los dispositivos, lo que incumple HU-015. Se cambia al alcance local (R7).
- **Verificación**: el botón «atrás» se verifica con la protección de rutas existente y no se añade código salvo que falle (R8). Se cubren con pruebas los criterios que no las tienen (R10) y se revisan las pantallas de acceso con Impeccable (R11).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (estricto) sobre Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase Auth local (spec 001). Almacenamiento del navegador para la hora de la última interacción (R3). Sin migraciones (R1).

**Pruebas**: Vitest 4.1 con Angular Testing Library y reloj simulado. Validación de punta a punta en el celular según `quickstart.md`. Durante el desarrollo, solo las pruebas de las zonas tocadas (`npm run test:changed` o `--include`); el conjunto completo una vez antes del commit.

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: la comprobación de inactividad no añade esperas perceptibles al arrancar (lectura local, sin red); los eventos de interacción se registran como mucho una vez cada 5 s

**Restricciones**:
- Capas página → servicio → repositorio abstracto → implementación Supabase (ADR-002, ADR-009).
- Ningún secreto en el cliente; el tiempo de inactividad es configuración pública.
- Estilos solo por preset, Tailwind y el layout (`AGENTS.md`); `DESIGN.md`.
- Textos en español de Colombia.

**Escala/alcance**: 1 servicio nuevo, cambios en `AuthService`, el repositorio de autenticación, la configuración y el inicio de sesión; revisión de 7 pantallas de acceso

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II (simplicidad), III (capas), VIII (la seguridad de los datos no depende solo del frontend), IX (pruebas) y XIII (móvil primero, accesibilidad, revisión de cada pantalla) |
| `AGENTS.md` y `CLAUDE.md` | Reglas de arquitectura y de estilos; revisión con Impeccable; Git; `test:changed` |
| `docs/backlog/user-stories/HU-001`, `HU-015` y `HU-016` | Criterios de aceptación y reglas de negocio. **No aplica**: lo marcado como fuera de alcance |
| `docs/architecture/decisions.md` | ADR-002 y ADR-009 (capas), ADR-014 (autenticación y sesión, cierre por inactividad), ADR-015 (frontend), ADR-012: DEC-12, DEC-16, DEC-17, DEC-18 y DEC-28 |
| `docs/architecture/frontend.md` | `core/auth` (`AuthService`, guards, `InactivityService`), configuración por entorno y manejo de errores |
| `docs/architecture/ui.md` | Patrón de pantallas de acceso y mensajes |
| `DESIGN.md` | Sistema visual Planilla: campos, botones, mensajes |
| `specs/002-frontend-foundation/` | Versión básica de las pantallas de acceso, contrato de errores y de rutas que se completan |
| `docs/engineering/testing.md`, `coding-standards.md` y `security.md` | Pruebas, organización y límites de la seguridad en el cliente |
| `docs/product/glossary.md` | Vocabulario de la interfaz |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec cubre HU-001, HU-015 y HU-016 de EP-01 y referencia sus criterios |
| II. Simplicidad | ✅ Cumple | Un solo servicio nuevo; el motivo del cierre vive en `AuthService` sin parámetros de URL; el botón «atrás» no recibe código si la protección actual basta (R8) |
| III. Separación de responsabilidades | ✅ Cumple | `InactivityService` no conoce Supabase: cierra la sesión mediante `AuthService`; solo el repositorio cambia el alcance del cierre |
| IV. Reutilización controlada | ✅ Cumple | Sin componentes compartidos nuevos |
| V. Base tecnológica | ✅ Cumple | Mensaje de PrimeNG con el preset existente |
| VI. Multi-tenant | ✅ Cumple | Sin cambios en el acceso a datos; al cerrar sesión se limpia el contexto de academia (comportamiento existente) |
| VII. Trazabilidad | ✅ Cumple | Matriz de criterios en `contracts/acceptance-coverage.md` |
| VIII. Seguridad | ✅ Cumple con límite aceptado | El cierre por inactividad es del cliente (ADR-014); los datos los sigue protegiendo RLS. El refuerzo en el servidor queda para el plan Pro |
| IX. Calidad verificable | ✅ Cumple | Pruebas con reloj simulado (R9); guards y repositorio ampliados (R10); quickstart en el celular |
| X. Documentación | ✅ Cumple | DEC-28, ADR-014, `frontend.md`, HU-001 y HU-015 ya actualizados; HU cerradas al terminar |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada con su alcance |
| XII. Excepciones | ✅ Sin excepciones | — |
| XIII. Experiencia de usuario | ✅ Cumple | Aviso claro de inactividad; revisión con Impeccable de las pantallas de acceso (R11) |

**Revisión tras la Fase 1**: el diseño no introduce violaciones. La sección de complejidad queda vacía.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/005-access-and-session/
├── plan.md
├── research.md                  # R1 a R11
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── session-contracts.md     # InactivityService, AuthService, AuthRepository, AppConfig
│   └── acceptance-coverage.md   # Criterio de aceptación → prueba o paso de validación
├── checklists/requirements.md
└── tasks.md                     # /speckit-tasks
```

### Código fuente

```text
frontend/src/
├── environments/
│   ├── environment.ts               # sessionInactivityMinutes: 60
│   └── environment.development.ts   # sessionInactivityMinutes: 60 (se cambia a 2 para validar)
└── app/
    ├── app.config.ts                # Arranca InactivityService
    ├── core/config/app-config.ts    # Campo nuevo y su validación
    ├── core/auth/
    │   ├── inactivity.service.ts        # Nuevo (R2 a R5)
    │   ├── auth.service.ts              # Motivo del cierre, comprobación al restaurar (R4, R6)
    │   ├── data/supabase-auth.repository.ts   # Cierre con alcance local (R7)
    │   └── guards/membership.guard.spec.ts    # Casos suspendida y sin membresía (R10)
    └── features/auth/login/login.ts # Aviso de inactividad
docs/backlog/user-stories/HU-001, HU-015, HU-016   # Estado al cerrar
docs/backlog/epics/EP-01-access-and-session.md     # Tabla de estado
```

**Decisión de estructura**: `InactivityService` vive en `core/auth`, como ya prevé `docs/architecture/frontend.md`. No hay cambios en la base de datos.

## Complejidad

Sin violaciones de la Constitución que justificar.
