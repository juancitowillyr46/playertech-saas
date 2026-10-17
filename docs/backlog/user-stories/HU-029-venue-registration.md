# HU-029 — Registrar sede

**Épica:** EP-12 — Sedes · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definida
**Spec:** [`specs/004-venues-management/`](../../../specs/004-venues-management/spec.md) (en especificación)

## Historia de usuario

> Como **owner**, quiero registrar las sedes de mi academia, para identificar sus oficinas y lugares de entrenamiento.

## Criterios de aceptación

### CA-001 — Registro exitoso

**Dado** que el owner proporciona el nombre de la sede,
**cuando** confirma el registro,
**entonces** el sistema crea la sede, activa, y muestra una confirmación.

### CA-002 — Tipo por defecto

**Dado** que el owner registra una sede,
**cuando** no cambia el tipo,
**entonces** la sede queda registrada como lugar de entrenamiento.

### CA-003 — Nombre obligatorio

**Dado** que el nombre de la sede está vacío,
**cuando** el owner intenta registrarla,
**entonces** el sistema indica que el nombre es obligatorio y no crea la sede.

### CA-004 — Nombre duplicado

**Dado** que ya existe en la academia una sede con el mismo nombre (sin distinguir mayúsculas),
**cuando** el owner intenta registrar otra con ese nombre,
**entonces** el sistema indica que el nombre ya está en uso y no crea la sede.

## Reglas de negocio

- Datos de la sede: nombre (obligatorio), tipo (oficina o lugar de entrenamiento), dirección, ciudad y referencia o indicaciones (opcionales).
- Una sede nueva no es principal; la principal se cambia desde HU-031.
- Los nombres de sedes eliminadas pueden reutilizarse.
- En el MVP no hay límite de sedes (plan Free).

## Fuera de alcance

- Enlaces de mapas o geolocalización.
- Horarios de la sede.

## Decisiones relacionadas

DEC-04, DEC-07, DEC-23 (ADR-012).
