# HU-016 — Recuperar contraseña

**Épica:** EP-01 — Acceso y sesión · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definida
**Spec:** pendiente

> **Versión básica disponible:** la spec 002 (`specs/002-frontend-foundation/`, Historia 7) construyó una versión básica funcional de esta pantalla en `frontend/src/app/features/auth/`. Esta HU la **completa** con todos sus criterios de aceptación y la revisión de diseño de T-01; no la reemplaza.

## Historia de usuario

> Como **owner**, quiero recuperar mi contraseña si la olvido, para volver a acceder a mi academia sin depender de soporte.

## Criterios de aceptación

### CA-001 — Solicitar recuperación

**Dado** que el owner olvidó su contraseña,
**cuando** ingresa su correo en la opción de recuperar contraseña,
**entonces** el sistema muestra un mensaje genérico indicando que, si el correo está registrado, recibirá instrucciones.

### CA-002 — No revelar cuentas

**Dado** que el correo ingresado no pertenece a ninguna cuenta,
**cuando** se solicita la recuperación,
**entonces** el sistema muestra el mismo mensaje que para un correo registrado.

### CA-003 — Definir nueva contraseña

**Dado** que el owner accede al enlace de recuperación vigente,
**cuando** ingresa una nueva contraseña de al menos 8 caracteres y su confirmación coincide,
**entonces** el sistema actualiza la contraseña y le confirma el cambio.

### CA-004 — Validación de la nueva contraseña

**Dado** que la nueva contraseña tiene menos de 8 caracteres o no coincide con su confirmación,
**cuando** el owner intenta guardarla,
**entonces** el sistema indica el problema y no la actualiza.

### CA-005 — Enlace caducado o usado

**Dado** que el enlace de recuperación ya caducó o ya fue utilizado,
**cuando** el owner accede a él,
**entonces** el sistema indica que el enlace ya no es válido y le permite solicitar uno nuevo.

### CA-006 — Acceso con la nueva contraseña

**Dado** que el owner cambió su contraseña,
**cuando** inicia sesión,
**entonces** puede acceder con la nueva contraseña y no con la anterior.

## Reglas de negocio

- El enlace de recuperación tiene una caducidad limitada (por defecto 1 hora, configurable en Supabase).
- La nueva contraseña sigue las mismas reglas que en el registro.

## Fuera de alcance

- Recuperación por SMS u otros canales.
- Preguntas de seguridad.

## Decisiones relacionadas

DEC-11, DEC-12, DEC-16 (ADR-012) y ADR-014.
