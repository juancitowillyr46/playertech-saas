# Backlog

Esta carpeta contiene la definición funcional del backlog de **PlayerTech**, organizada en épicas e historias de usuario.

## Estructura

```text
backlog/
├── epics/              # Épicas y sus objetivos funcionales
├── user-stories/       # Historias de usuario y criterios de aceptación
├── enablers/           # Habilitadores técnicos (T-xx)
└── README.md
```

Un **habilitador técnico** (T-xx) es trabajo necesario para construir las HU que no entrega funcionalidad visible al usuario final. Sigue el mismo formato que una HU, con criterios de aceptación técnicos.

## Organización

- **Épicas:** agrupan funcionalidades relacionadas bajo un objetivo de negocio.
- **Historias de usuario:** describen necesidades concretas del usuario y sus criterios de aceptación de negocio.

Las épicas y las historias de usuario representan la **definición funcional del producto**. El refinamiento detallado y los detalles técnicos se mantienen en `specs/`.

## Relación entre HU y specs (SDD)

| Nivel | Artefacto | Contiene | No contiene |
|---|---|---|---|
| Épica | `epics/EP-xx` | Objetivo, alcance, HU incluidas, estado | Detalle funcional |
| HU | `user-stories/HU-xxx` | Narrativa, criterios de aceptación de negocio, reglas, fuera de alcance, estado, enlace a la spec | Casos límite técnicos, detalle de interfaz |
| Spec | `specs/NNN/spec.md` | Escenarios que **referencian** los CA de la HU, casos límite, requisitos funcionales, aclaraciones | Copia literal de la HU |

Reglas:

1. Una spec cubre una o varias HU de la misma épica.
2. La spec no reescribe la HU: la referencia (por ejemplo, "CA-002 de HU-014").
3. **Definition of Ready:** la HU tiene sus criterios de aceptación escritos y sus decisiones de dominio cerradas antes de ejecutar `/speckit-specify`.
4. **Definition of Done:** criterios de aceptación verificados, pruebas pasando, prueba de aislamiento entre academias cuando aplica y estado actualizado en la épica.

Estados de una HU: **Pendiente** → **Definida** (lista para especificar) → **Especificada** → **En desarrollo** → **Terminada**.

## MVP v1 — Mapa de épicas

### Fase 1 — Fundación SaaS

| Orden | Épica | HU | Prioridad |
|---|---|---|---|
| 0 | [T-00 Fundación técnica del SaaS](enablers/T-00-saas-foundation.md) (Supabase, tenancy, RLS, seed, pruebas de aislamiento, esqueleto) | — | MVP |
| 1 | [EP-00 Alta de academia](epics/EP-00-academy-onboarding.md) | HU-014 | MVP |
| 2 | [EP-01 Acceso y sesión](epics/EP-01-access-and-session.md) | HU-001, HU-015, HU-016 | MVP |
| 3 | [EP-09 Gestión de la academia](epics/EP-09-academy-management.md) | HU-032, HU-017 · HU-018 (MVP+) | MVP |
| 4 | [EP-12 Sedes](epics/EP-12-venues.md) | HU-029, HU-030, HU-031 | MVP |

### Fase 2 — Negocio (pendiente de ideación)

| Épica | HU actuales | Estado |
|---|---|---|
| EP-10 Gestión de acudientes | Por definir | Pendiente |
| [EP-02 Gestión de jugadores](epics/EP-02-player-management.md) | HU-002, HU-003 | Pendiente de ajuste |
| [EP-04 Gestión de actividades](epics/EP-04-activity-management.md) | HU-005, HU-006 | Pendiente de ajuste |
| [EP-05 Convocatorias](epics/EP-05-call-ups.md) | HU-007, HU-008 | Pendiente de ajuste |
| [EP-08 Comunicación](epics/EP-08-call-up-communication.md) | HU-012, HU-013 | Pendiente de ajuste |
| [EP-06 Respuesta del acudiente](epics/EP-06-tutor-responses.md) | HU-009, HU-010 | Pendiente de ajuste |
| [EP-07 Seguimiento de respuestas](epics/EP-07-response-tracking.md) | HU-011 | Pendiente de ajuste |
| [EP-03 Grupos y categorías](epics/EP-03-groups-and-categories.md) | HU-004 | Pendiente de ajuste |

### MVP+

| Épica | Contenido |
|---|---|
| EP-11 Equipo y roles | Invitaciones, roles adicionales y gestión de miembros (incluye HU-018) |
| EP-13 Planes | Cambio de plan, límites y cobro |

Los IDs de épicas e HU se mantienen estables para conservar la trazabilidad; el orden de construcción lo indica la columna **Orden**.
