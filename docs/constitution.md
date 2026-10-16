# Constitución de PlayerTech

## Propósito

La Constitución define los principios fundamentales que gobiernan el desarrollo y la evolución de PlayerTech. Las especificaciones, las decisiones de arquitectura y las implementaciones deben respetarla.

## Versión vigente

> **La única versión vigente es [`.specify/memory/constitution.md`](../.specify/memory/constitution.md).**
>
> **Versión:** 3.1.0 · **Ratificada:** 2026-10-03 · **Última enmienda:** 2026-10-16

Esta página es una puerta de entrada y no repite el texto normativo. La Constitución vive en `.specify/memory/` porque es el archivo que leen las herramientas de GitHub Spec Kit para validar cada especificación, plan y conjunto de tareas. Las enmiendas se realizan con `/speckit-constitution`.

## Principios

| # | Principio | En una línea |
|---|---|---|
| I | Desarrollo guiado por especificaciones | Todo trabajo significativo parte de una HU o un habilitador técnico y sigue spec → plan → tareas → implementación → pruebas |
| II | Simplicidad | Solo la complejidad que exigen las necesidades actuales |
| III | Separación de responsabilidades | Presentación, aplicación, datos e infraestructura separadas; la UI no depende de la persistencia |
| IV | Reutilización controlada | Reutilizar lo existente sin abstracciones prematuras |
| V | Base tecnológica y visual reutilizable | SakaiNG, PrimeNG y Tailwind como base; layout adoptado propio, demos solo de referencia, personalización por tokens |
| VI | Arquitectura evolutiva multi-tenant | Cada academia es un tenant aislado; usuario y tenant nunca son lo mismo |
| VII | Trazabilidad | De producto a pruebas, sin duplicación |
| VIII | Seguridad y control de acceso | La seguridad no depende del frontend; sin secretos en el cliente |
| IX | Calidad verificable | Criterios de aceptación claros y pruebas proporcionales al riesgo |
| X | Documentación como fuente de conocimiento | Una única fuente de verdad por concepto |
| XI | Convención de SDD y GitHub Spec Kit | `spec.md`, `plan.md` y `tasks.md` trazables a su HU o habilitador |
| XII | Excepciones controladas | Toda excepción se justifica, documenta y revisa |
| XIII | Experiencia de usuario | Móvil primero, accesible, consistente y con textos claros; requisito del producto |

## Documentación relacionada

- `docs/architecture/` — Arquitectura y decisiones (ADR).
- `docs/engineering/` — Prácticas y estándares de desarrollo, incluido `sdd-and-spec-kit.md`.
- `docs/product/` — Visión, alcance y evolución del producto.
- `docs/backlog/` — Épicas, historias de usuario y habilitadores técnicos.
- `specs/` — Especificaciones de funcionalidades.
- `CLAUDE.md` — Guía operativa para agentes.
