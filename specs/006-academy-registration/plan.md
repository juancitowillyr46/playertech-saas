# Plan de implementación: Alta de academia

**Branch**: `006-academy-registration` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/006-academy-registration/spec.md` (EP-00: HU-014)

## Resumen

Completar el registro básico de la spec 002 y añadir el reenvío del correo de verificación. **No hay migraciones**: el registro atómico, el plan Free, la sede principal y el correo de contacto los crea la función de registro de la spec 001, cubierta por pgTAP (R1).

El trabajo es de frontend:
- **Reenvío** (R2 a R4): `resendVerification(email)` en el repositorio de autenticación, con el reenvío nativo de Supabase (admite PKCE). Errores ocultos salvo límite de envíos y red, igual que la recuperación de contraseña (DEC-12). En la pantalla de verificar correo, un botón con espera visible de 60 s, y un campo de correo si la pantalla no lo conoce.
- **Verificación formal** de CA-001 a CA-008 (R5): las pruebas que faltan y un recorrido de punta a punta, incluido el correo ya registrado.
- **Revisión de experiencia y accesibilidad** del registro y de verificar correo (R6).

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.9 (estricto) sobre Node 24 LTS

**Dependencias principales**: Angular 21.2, PrimeNG 21.1 (preset PlayerTech), Tailwind CSS 4, `@supabase/supabase-js` 2.117.2. **Sin dependencias nuevas.**

**Almacenamiento**: Supabase local (spec 001): función de registro y Auth. Sin migraciones (R1).

**Pruebas**: Vitest 4.1 con Angular Testing Library y reloj simulado para la espera; pgTAP existentes (`020-registration`); validación de punta a punta con Mailpit según `quickstart.md`. Durante el desarrollo solo las zonas tocadas; el conjunto completo una vez antes del commit.

**Plataforma objetivo**: navegadores modernos, móvil primero desde 360 px

**Tipo de proyecto**: SPA Angular sobre BaaS

**Objetivos de rendimiento**: sin cambios en el bundle inicial (pantallas cargadas bajo demanda)

**Restricciones**: capas página → servicio → repositorio abstracto → implementación Supabase (ADR-002, ADR-009); estilos solo por preset, Tailwind y layout; textos en español de Colombia

**Escala/alcance**: 1 operación nueva en el repositorio, 1 pantalla ampliada (verificar correo), verificación de 1 pantalla (registro)

## Documentación de referencia obligatoria

La implementación DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él (y qué no aplica) |
|---|---|
| `.specify/memory/constitution.md` | Principios II, III, VIII, IX y XIII |
| `AGENTS.md` y `CLAUDE.md` | Arquitectura, estilos, revisión con Impeccable, Git, pruebas por zona |
| `docs/backlog/user-stories/HU-014-academy-registration.md` | Criterios CA-001 a CA-008, reglas (incluida la del reenvío) y decisiones de alcance del 2026-10-17. **No aplica**: «Posibles evoluciones» |
| `docs/architecture/decisions.md` | ADR-002, ADR-009, ADR-014 (verificación obligatoria), ADR-012: DEC-12, DEC-19, DEC-20, DEC-21, DEC-24 |
| `docs/architecture/frontend.md` | `core/auth`, `features/auth`, manejo de errores |
| `docs/architecture/ui.md` y `DESIGN.md` | Pantallas de acceso, mensajes y botones |
| `specs/001-database-foundation/contracts/` | Contrato de la función de registro y metadatos del registro |
| `specs/002-frontend-foundation/` | Versión básica del registro, verificar correo y retorno de enlaces; catálogo de errores |
| `docs/engineering/testing.md`, `coding-standards.md` y `security.md` | Pruebas, convención de nombres, validación en el servidor |
| `docs/product/glossary.md` | Vocabulario de la interfaz |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec cubre HU-014 (EP-00) y referencia sus criterios; las decisiones de alcance están en HU-014 |
| II. Simplicidad | ✅ Cumple | Reenvío nativo de Supabase; la espera es un contador en la pantalla; el formulario conserva lo escrito sin lógica extra |
| III. Separación de responsabilidades | ✅ Cumple | La pantalla usa `RegistrationService` → `AuthService` → `AuthRepository`; solo la implementación Supabase conoce el SDK |
| IV. Reutilización controlada | ✅ Cumple | Se reutiliza el patrón de errores ocultos de la recuperación (DEC-12) |
| V. Base tecnológica | ✅ Cumple | Componentes de PrimeNG con el preset |
| VI. Multi-tenant | ✅ Cumple | El registro crea la academia en la base de datos; el cliente no envía `academy_id` |
| VII. Trazabilidad | ✅ Cumple | Matriz en `contracts/acceptance-coverage.md` |
| VIII. Seguridad | ✅ Cumple | Atomicidad y límites de envío en el servidor; los mensajes no revelan cuentas |
| IX. Calidad verificable | ✅ Cumple | Pruebas nuevas de verificar correo y del repositorio; pgTAP existentes; quickstart |
| X. Documentación | ✅ Cumple | HU-014 ya registra las decisiones; se cierra al terminar |
| XI. Spec Kit | ✅ Cumple | Documentación de referencia listada |
| XII. Excepciones | ✅ Sin excepciones | — |
| XIII. Experiencia de usuario | ✅ Cumple | Espera visible, mensajes claros, revisión de ambas pantallas (R6) |

**Revisión tras la Fase 1**: sin violaciones. Complejidad vacía.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/006-academy-registration/
├── plan.md
├── research.md                  # R1 a R6
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── resend-contracts.md      # Repositorio, servicio y pantalla de verificar correo
│   └── acceptance-coverage.md   # Criterio → prueba o paso de validación
├── checklists/requirements.md
└── tasks.md
```

### Código fuente

```text
frontend/src/app/
├── core/auth/
│   ├── data/auth.repository.ts            # resendVerification (abstracto)
│   ├── data/supabase-auth.repository.ts   # auth.resend({ type: 'signup' }) (R2, R3)
│   └── auth.service.ts                    # resendVerification
└── features/auth/
    ├── services/registration.service.ts   # resendVerification
    └── verify-email/verify-email.ts       # Botón, espera de 60 s, campo de correo (R4); spec nueva
docs/backlog/user-stories/HU-014, docs/backlog/epics/EP-00   # Estado al cerrar
```

**Decisión de estructura**: todo dentro de `core/auth` y `features/auth`. No hay cambios en la base de datos.

## Complejidad

Sin violaciones de la Constitución que justificar.
