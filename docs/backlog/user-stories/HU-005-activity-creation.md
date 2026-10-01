# HU-005 — Activity Creation

**Épica:** EP-04 — Gestión de actividades

## Historia de usuario

> Como **administrador**, quiero crear una actividad deportiva, para organizar un entrenamiento o una competencia.

## Tipos de actividad

- Entrenamiento.
- Competencia.

## Criterios de aceptación

### CA-001 — Crear entrenamiento

**Dado** que el administrador proporciona la información requerida,  
**cuando** selecciona el tipo "Entrenamiento" y confirma,  
**entonces** el sistema debe crear la actividad.

### CA-002 — Crear competencia

**Dado** que el administrador proporciona la información requerida,  
**cuando** selecciona el tipo "Competencia" y confirma,  
**entonces** el sistema debe crear la actividad.

### CA-003 — Campos obligatorios

**Dado** que faltan datos requeridos,  
**cuando** el administrador intenta crear la actividad,  
**entonces** el sistema debe indicar los campos pendientes y no crear la actividad.

### CA-004 — Actividad creada

**Dado** que la actividad fue creada correctamente,  
**cuando** finaliza el proceso,  
**entonces** el sistema debe mostrar una confirmación y permitir continuar con la gestión de la actividad.

## Fuera de alcance

- Registro de asistencia.
- Estadísticas deportivas.
- Resultados deportivos avanzados.