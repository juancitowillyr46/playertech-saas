# HU-002 — Player Registration

**Épica:** EP-02 — Gestión de jugadores

## Historia de usuario

> Como **administrador**, quiero registrar un jugador en la academia, para mantener centralizada su información.

## Objetivo

Permitir incorporar nuevos jugadores al registro de la academia.

## Criterios de aceptación

### CA-001 — Registro exitoso

**Dado** que el administrador proporciona la información obligatoria del jugador,  
**cuando** confirma el registro,  
**entonces** el sistema debe crear el jugador y mostrar una confirmación.

### CA-002 — Información obligatoria

**Dado** que faltan datos obligatorios,  
**cuando** el administrador intenta registrar al jugador,  
**entonces** el sistema debe indicar los campos pendientes y no debe completar el registro.

### CA-003 — Consulta posterior

**Dado** que un jugador fue registrado correctamente,  
**cuando** el administrador consulta los jugadores de la academia,  
**entonces** el jugador debe aparecer en el listado.

## Reglas de negocio

- Un jugador pertenece a una academia.
- Un jugador puede estar relacionado con uno o más tutores.
- Un tutor puede representar a uno o más jugadores.

## Fuera de alcance

- Historia clínica.
- Información médica.
- Estadísticas deportivas.
- Gestión de pagos.
