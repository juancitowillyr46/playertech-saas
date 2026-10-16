# Plan de implementación: Base de datos de la Fundación SaaS

**Branch**: `001-database-foundation` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación de `/specs/001-database-foundation/spec.md` (habilitador T-00, áreas 1 a 6)

## Resumen

Crear la base de datos multi-tenant de la Fase 1 en un proyecto Supabase local versionado en `supabase/`. El modelo de `docs/architecture/database-schema.md` se implementa con migraciones ordenadas. La autorización se centraliza en tres funciones `SECURITY DEFINER`, y RLS con privilegios por columna protege todas las tablas. El registro es atómico mediante un trigger sobre `auth.users`. Los buckets de Storage se crean por migración, el seed pasa por el camino real del registro, y pruebas pgTAP verifican el aislamiento A/B, la suspensión, el registro, las reglas de integridad y el almacenamiento.

## Contexto técnico

**Lenguaje/versión**: SQL de PostgreSQL 17 (la versión que trae Supabase CLI 2.119)

**Dependencias principales**: Supabase CLI 2.119.0 (dependencia de desarrollo en un `package.json` de la raíz), extensiones `unaccent` y `pgtap`

**Almacenamiento**: PostgreSQL de Supabase (esquema `public`), Supabase Auth (`auth.users`) y Supabase Storage (`storage.objects`)

**Pruebas**: pgTAP mediante `supabase test db`; validación manual de Auth según `quickstart.md`

**Plataforma objetivo**: entorno local con Docker; las mismas migraciones se aplicarán después en Supabase Cloud

**Tipo de proyecto**: capa de datos de una aplicación web (SPA Angular + BaaS)

**Objetivos de rendimiento**: reconstrucción completa del entorno en menos de 5 minutos (SC-001). Las funciones de autorización se marcan `STABLE` y se apoyan en índices sobre `academy_members (user_id)` para que su coste por consulta sea despreciable

**Restricciones**: sin secretos en el repositorio; ninguna lógica de autorización fuera de la base de datos; migraciones inmutables una vez compartidas

**Escala/alcance**: 9 tablas propias, 4 funciones expuestas, 2 buckets, 11 migraciones y unas 6 baterías de pruebas

## Documentación de referencia obligatoria

La implementación (`/speckit-implement`) DEBE leer estos documentos antes de empezar y aplicarlos junto con este plan. Ante un conflicto, se aplica la precedencia de `AGENTS.md` y se detiene la implementación hasta resolverlo.

| Documento | Qué se toma de él |
|---|---|
| `.specify/memory/constitution.md` | Principios VI (multi-tenant), VIII (seguridad), IX (calidad verificable) y XII (excepciones) |
| `docs/architecture/decisions.md` | ADR-012 (DEC-01 a DEC-29), ADR-013 (almacenamiento) y ADR-014 (autenticación) |
| `docs/architecture/database-schema.md` | Sección **Fase 1**: tablas, columnas, restricciones, funciones y matriz RLS. La sección "Fase 2 borrador" queda fuera de alcance |
| `docs/architecture/supabase-migrations-guide.md` | Convención de nombres, principios, flujo de una migración, checklist y errores comunes. Las secciones de entidades de negocio y convocatorias (7 y 11) son de la Fase 2 y no se implementan |
| `docs/architecture/supabase.md` y `supabase-environments.md` | Reglas de RLS, seed y entornos |
| `docs/engineering/security.md` | Autenticación, autorización, datos sensibles y secretos |
| `docs/engineering/testing.md` | Nivel "Database Tests" (pgTAP) |
| `docs/engineering/git.md` | Ramas y commits |

## Verificación de la Constitución

*Puerta: debe cumplirse antes de la Fase 0 y revisarse tras la Fase 1.*

| Principio | Estado | Evidencia |
|---|---|---|
| I. SDD | ✅ Cumple | La spec proviene del habilitador T-00 y referencia sus CA |
| II. Simplicidad | ✅ Cumple | Herramientas nativas (RLS, privilegios por columna, triggers); sin dependencias de pruebas externas (R2); sin Edge Functions (R4) |
| III. Separación de responsabilidades | ✅ Cumple | La autorización vive en la base de datos; el contrato con el frontend está en `contracts/` |
| IV. Reutilización controlada | ✅ Cumple | Funciones de autorización reutilizables por todas las políticas; patrón de FK compuesta reutilizable en la Fase 2 |
| V. Base tecnológica | — No aplica | Sin interfaz |
| VI. Multi-tenant | ✅ Cumple | Usuario, membresía y academia separados; `academy_id` en todas las tablas del tenant; FK compuestas |
| VII. Trazabilidad | ✅ Cumple | T-00 → spec → plan → tareas → migraciones → pruebas pgTAP |
| VIII. Seguridad | ✅ Cumple | RLS en todas las tablas, `SECURITY DEFINER` con `search_path` vacío, creación restringida, sin secretos |
| IX. Calidad verificable | ✅ Cumple | Cada CA de T-00 y cada historia tienen pruebas pgTAP o un paso del quickstart |
| X. Documentación | ✅ Cumple | El modelo vive en `database-schema.md`; `data-model.md` solo añade decisiones; se corrigió en la fuente la lectura pública de catálogos |
| XI. Spec Kit | ✅ Cumple | spec, plan y tareas trazables a T-00; documentación de referencia obligatoria listada con su alcance |
| XII. Excepciones | ✅ Ninguna | — |
| XIII. Experiencia de usuario | — No aplica | Sin interfaz |

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/001-database-foundation/
├── spec.md
├── plan.md                         # Este archivo
├── research.md                     # Fase 0: decisiones R1–R14
├── data-model.md                   # Fase 1: restricciones, privilegios, estados
├── quickstart.md                   # Fase 1: guía de validación
├── contracts/
│   ├── registration-metadata.md    # Contrato del registro
│   └── database-api.md             # Funciones, acceso por tabla, almacenamiento
├── checklists/requirements.md
└── tasks.md                        # Lo genera /speckit-tasks
```

### Código fuente (raíz del repositorio)

```text
package.json                        # Nuevo: Supabase CLI fijada y scripts db:*
supabase/
├── config.toml                     # Proyecto local; Auth: confirmación, contraseña 8, JWT 1 h, URLs
├── README.md                       # Uso local, usuarios de prueba, flujo de migraciones
├── migrations/                     # 11 migraciones con marca de tiempo (research.md, R13)
├── seed.sql                        # Owners A y B; el trigger crea sus academias
└── tests/
    └── database/
        ├── 000-test-helpers.test.sql
        ├── 010-schema.test.sql
        ├── 020-registration.test.sql
        ├── 030-isolation.test.sql
        ├── 040-suspension.test.sql
        ├── 050-integrity.test.sql
        └── 060-storage.test.sql
frontend/src/app/core/supabase/
└── database.types.ts               # Generado con npm run db:types
```

**Decisión de estructura:** la base de datos vive en `supabase/` en la raíz, independiente de `frontend/`, tal como prevén `supabase-migrations-guide.md` y `AGENTS.md`. El único punto de contacto con el frontend es el archivo de tipos generado.

## Diseño

### Funciones de autorización

```text
auth.uid() ──► academy_members (user_id, status='active')
                     │
                     └──► academies (status='active')  ──► academy_id autorizado
```

`is_academy_member`, `current_academy_id` y `has_academy_role` implementan este recorrido (R5). Todas las políticas se escriben en términos de esas funciones; ninguna repite la consulta de membresía.

### Políticas por tabla

La matriz está en [contracts/database-api.md](contracts/database-api.md). Patrón general para una tabla del tenant:

| Operación | Condición |
|---|---|
| SELECT | `is_academy_member(academy_id)` |
| INSERT | `WITH CHECK has_academy_role(academy_id, '{owner}')` (o miembro, en `files`) |
| UPDATE | `USING` y `WITH CHECK` con la misma condición, más privilegios por columna (R7) |
| DELETE | Sin política: no se concede |

### Registro

```text
signUp(email, password, data) ──► INSERT auth.users ──► trigger handle_new_user()
   valida metadatos y versiones legales ──► profiles ──► academies (slug, CO, Bogotá, contacto)
   ──► academy_members (owner) ──► subscriptions (free) ──► venues (Sede principal)
   ──► legal_acceptances ×2
   cualquier excepción ──► se revierte todo, incluida la cuenta
```

### Estrategia de pruebas

| Batería | Cubre |
|---|---|
| `010-schema` | Tablas, RLS habilitado en todas, funciones existentes y sus privilegios |
| `020-registration` | Historia 3 y CA-004: éxito, valores por defecto, versiones legales, fallo con reversión, slugs duplicados |
| `030-isolation` | Historia 2 y CA-002/CA-005: por tabla, lectura y escritura propias permitidas; ajenas rechazadas; `academy_id` ajeno rechazado; creación directa en tablas del registro rechazada; anónimo sin acceso |
| `040-suspension` | CA-003: academia suspendida sin acceso; datos intactos |
| `050-integrity` | Historia 4: cada regla de integridad y los privilegios por columna |
| `060-storage` | Historia 5 y CA-006: configuración de los buckets (tipo y tamaño), prefijo propio y ajeno, registro en `files`, lectura pública y privada |
| Quickstart §3 y §4 (manual) | Historia 6 y los límites de tipo y tamaño de la Historia 5, que aplica la API de Storage y no la base de datos |

**Autoría y claves de archivo:** `venues.created_by` y `files.created_by` toman `auth.uid()` por defecto y las políticas de INSERT exigen `created_by = auth.uid()`. `files.storage_key` debe empezar por el `academy_id` de su fila (CHECK), para que ninguna academia pueda ocupar las claves de otra.

## Fase 0: Investigación

Ver [research.md](./research.md). Todas las incógnitas quedan resueltas:

| Incógnita | Resolución |
|---|---|
| Instalación de la CLI | R1 — `package.json` en la raíz con la versión 2.119.0 fijada |
| Usuarios en pruebas | R2 — helpers propios en el esquema `tests` |
| Atomicidad del registro | R3 — trigger sobre `auth.users` |
| IP en aceptaciones (DEC-29) | R4 — **no se captura en el MVP** (aprobado) |
| Columnas no editables | R7 — privilegios por columna |
| Cambio de sede principal | R8 — RPC `set_primary_venue` |
| Borrado lógico frente a RLS | R9 — filtro en las consultas, no en las políticas |
| Buckets portables | R10 — creación por migración |

## Fase 1: Diseño

- [data-model.md](./data-model.md): restricciones adicionales, privilegios por columna, estados, reglas de validación y datos de referencia y de prueba.
- [contracts/registration-metadata.md](./contracts/registration-metadata.md): contrato del registro con el cliente.
- [contracts/database-api.md](./contracts/database-api.md): funciones, acceso por tabla y almacenamiento.
- [quickstart.md](./quickstart.md): validación de punta a punta.

**Cambio en la documentación fuente:** la matriz RLS de `docs/architecture/database-schema.md` permite ahora a `anon` leer `legal_documents` (los planes siguen siendo solo para usuarios autenticados), porque el formulario de registro necesita las versiones vigentes antes de iniciar sesión.

## Verificación de la Constitución tras el diseño

Todas las puertas siguen en **Cumple**. El diseño no introduce dependencias externas ni componentes desplegables, mantiene la autorización en la base de datos y conserva una única fuente de verdad para el modelo.

## Seguimiento de complejidad

No hay violaciones de la Constitución que justificar.
