# HU-032 — Inicio de la academia

**Épica:** EP-09 — Gestión de la academia · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminada (entorno local) · spec 007
**Spec:** pendiente

> **Versión de lectura disponible:** la spec 003 (`specs/003-design-system/`, T-01) construyó la pantalla modelo de Inicio en `frontend/src/app/features/home/`: resumen real con el nombre, el logo o las iniciales, el plan y la sede principal (adelanta CA-001). La sección «Completa tu academia» es una maqueta con las tareas y sus enlaces, sin estado ni progreso: esta HU completa CA-002 a CA-004.

## Historia de usuario

> Como **owner**, quiero ver un inicio con el resumen de mi academia y lo que me falta configurar, para saber por dónde empezar después de registrarme.

## Criterios de aceptación

### CA-001 — Inicio tras iniciar sesión

**Dado** que el owner inicia sesión,
**cuando** accede a PlayerTech,
**entonces** ve el inicio con el nombre y el logo de su academia (si existe), su plan y su sede principal.

### CA-002 — Tarjeta "Completa tu academia"

**Dado** que a la academia le faltan datos recomendados,
**cuando** el owner ve el inicio,
**entonces** se muestra la tarjeta "Completa tu academia" con las tareas completadas y pendientes y el progreso (por ejemplo, "2 de 4").

### CA-003 — Ir a completar un dato

**Dado** que la tarjeta muestra una tarea pendiente,
**cuando** el owner selecciona su enlace,
**entonces** llega a la pantalla donde puede completarla.

### CA-004 — Academia completa

**Dado** que la academia tiene todos los datos recomendados,
**cuando** el owner ve el inicio,
**entonces** la tarjeta no se muestra.

## Reglas de negocio

Tareas de la tarjeta en la Fase 1:

| Tarea | Se considera completa cuando |
|---|---|
| Academia creada | Siempre (se completa en el registro) |
| Dirección de la sede principal | La sede principal tiene dirección (decisión del 2026-10-18: cubre la invitación a completar la sede acordada en la spec 006) |
| Logo de la academia | La academia tiene logo |
| Teléfono y dirección de la academia | La academia tiene teléfono y dirección de contacto (distinta de la dirección de las sedes) |

- La tarjeta es informativa: no bloquea el uso de PlayerTech.
- En la Fase 2, el inicio mostrará también información de negocio (por ejemplo, las próximas actividades).

## Fuera de alcance

- Asistente de configuración paso a paso.
- Ocultar la tarjeta manualmente.
- Métricas o gráficos.

## Decisiones relacionadas

DEC-17 (ADR-012) y FE-13, FE-14 (ADR-015).
