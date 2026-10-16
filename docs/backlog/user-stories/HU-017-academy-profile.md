# HU-017 — Consultar y editar el perfil de la academia

**Épica:** EP-09 — Gestión de la academia · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definida
**Spec:** pendiente

## Historia de usuario

> Como **owner**, quiero consultar y editar los datos de mi academia, para mantener actualizada su identificación y su información de contacto.

## Criterios de aceptación

### CA-001 — Consultar perfil

**Dado** que el owner accede al perfil de su academia,
**cuando** se muestra la información,
**entonces** puede ver el nombre, logo, teléfono, correo de contacto, dirección, ciudad y el plan actual.

### CA-002 — Editar datos

**Dado** que el owner modifica uno o varios datos del perfil,
**cuando** guarda los cambios,
**entonces** el sistema los actualiza y muestra una confirmación.

### CA-003 — Nombre obligatorio

**Dado** que el owner deja vacío el nombre de la academia,
**cuando** intenta guardar,
**entonces** el sistema indica que el nombre es obligatorio y no guarda los cambios.

### CA-004 — Correo de contacto válido

**Dado** que el owner ingresa un correo de contacto con formato inválido,
**cuando** intenta guardar,
**entonces** el sistema indica el error y no guarda los cambios.

### CA-005 — Correo de contacto independiente

**Dado** que el owner cambia el correo de contacto,
**cuando** guarda los cambios,
**entonces** el correo con el que inicia sesión no cambia.

### CA-006 — Cargar o reemplazar el logo

**Dado** que el owner selecciona una imagen JPG o PNG de hasta 1 MB,
**cuando** la carga,
**entonces** el sistema la guarda como logo de la academia y reemplaza el anterior si existía.

### CA-007 — Logo inválido

**Dado** que el owner selecciona un archivo que no es JPG o PNG, o que supera 1 MB,
**cuando** intenta cargarlo,
**entonces** el sistema indica el problema y conserva el logo actual.

### CA-008 — Retirar el logo

**Dado** que la academia tiene un logo,
**cuando** el owner lo retira,
**entonces** la academia queda sin logo.

### CA-009 — Aislamiento

**Dado** que existen otras academias en PlayerTech,
**cuando** el owner consulta o edita el perfil,
**entonces** solo puede ver y modificar los datos de su propia academia.

## Reglas de negocio

- Solo el nombre es obligatorio; el resto de datos es opcional.
- El país y la zona horaria no se muestran ni se editan en el MVP.
- El plan se muestra solo como consulta.
- Al reemplazar o retirar el logo, el archivo anterior no se borra físicamente (borrado lógico).

## Fuera de alcance

- Cambio de plan.
- Cambio del correo de inicio de sesión.
- Eliminar o suspender la academia.

## Decisiones relacionadas

DEC-07, DEC-15, DEC-21, DEC-22, DEC-27 (ADR-012) y ADR-013.
