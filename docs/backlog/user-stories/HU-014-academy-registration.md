# HU-014 — Registrar academia y owner

**Épica:** EP-00 — Alta de academia · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminada (entorno local) · spec 006
**Spec:** pendiente

> **Versión básica disponible:** la spec 002 (`specs/002-frontend-foundation/`, Historia 7) construyó una versión básica funcional de esta pantalla en `frontend/src/app/features/auth/`. Esta HU la **completa** con todos sus criterios de aceptación y la revisión de diseño de T-01; no la reemplaza.

## Historia de usuario

> Como **visitante**, quiero registrar mi academia y mi cuenta de owner, para empezar a gestionar mi academia en PlayerTech.

## Objetivo

Permitir que una academia se registre por su cuenta y quede creada como un tenant aislado, con su owner, su plan Free y su sede principal.

## Criterios de aceptación

### CA-001 — Registro exitoso

**Dado** que el visitante proporciona nombre de la academia, su nombre, correo, contraseña y confirmación de contraseña, y acepta los documentos legales,
**cuando** confirma el registro,
**entonces** el sistema crea la academia y su cuenta, envía un correo de verificación y le indica que debe verificar su correo para acceder.

### CA-002 — Campos obligatorios

**Dado** que falta alguno de los datos del registro,
**cuando** el visitante intenta registrarse,
**entonces** el sistema indica los campos pendientes y no completa el registro.

### CA-003 — Contraseña

**Dado** que la contraseña tiene menos de 8 caracteres o no coincide con su confirmación,
**cuando** el visitante intenta registrarse,
**entonces** el sistema indica el problema y no completa el registro.

### CA-004 — Aceptaciones legales obligatorias

**Dado** que el visitante no aceptó los Términos y Condiciones o la Política de Tratamiento de Datos Personales,
**cuando** intenta registrarse,
**entonces** el sistema indica que debe aceptar ambos documentos y no completa el registro.

### CA-005 — Correo ya registrado

**Dado** que el correo ya pertenece a una cuenta existente,
**cuando** el visitante intenta registrarse,
**entonces** el sistema indica junto al correo que ya existe una cuenta con ese correo, ofrece iniciar sesión o recuperar la contraseña, y no crea una nueva academia.

> Criterio cambiado el 2026-10-18 por decisión del responsable de producto (spec 006): antes mostraba el mismo mensaje que un registro exitoso. Es una excepción a DEC-12 con riesgo aceptado (ver `docs/architecture/decisions.md`).

### CA-006 — Verificación de correo

**Dado** que el owner recibió el correo de verificación,
**cuando** accede al enlace de verificación,
**entonces** su cuenta queda verificada y puede iniciar sesión.

### CA-007 — Academia lista para operar

**Dado** que el owner verificó su correo e inició sesión por primera vez,
**cuando** consulta su academia,
**entonces** la academia tiene el nombre registrado, el plan Free, una sede principal y como correo de contacto el correo del registro.

### CA-008 — Registro atómico

**Dado** que ocurre un error durante el registro,
**cuando** el sistema no puede completarlo,
**entonces** no queda creado ningún dato parcial (ni cuenta ni academia) y el visitante recibe un mensaje comprensible para reintentar.

## Reglas de negocio

- El registro crea en una sola operación: la cuenta, el perfil, la academia, la membresía de owner, la suscripción Free, la sede principal y las dos aceptaciones legales.
- Las aceptaciones legales registran el documento, su versión y la fecha y hora del servidor.
- El nombre de la academia puede repetirse entre academias.
- La academia se crea con país Colombia y zona horaria America/Bogota, sin mostrarlos.
- La sede principal se crea con el nombre "Sede principal" y el tipo lugar de entrenamiento.
- Una persona solo puede pertenecer a una academia.
- El owner no puede acceder hasta verificar su correo.
- Desde la pantalla de verificar correo se puede reenviar el correo de verificación, con espera entre intentos y el mismo mensaje exista o no la cuenta (decisión del 2026-10-17, spec 006).
- La pantalla de verificar correo ofrece, al pie, iniciar sesión o recuperar la contraseña a quien ya tenga cuenta (decisión del 2026-10-18).

## Fuera de alcance

- Captcha.
- Selección de país o zona horaria.
- Onboarding guiado posterior al registro.
- Limpieza de registros no verificados (MVP+).

## Posibles evoluciones

Ideas del responsable de producto (2026-10-17) para una spec propia (`feat`). Cambiarían DEC-24 y los metadatos del registro de la spec 001:

- Pedir en el registro datos de la sede principal, como la dirección.
- Al terminar el registro, invitar de forma destacada a completar los datos de la sede principal.

Decisión del 2026-10-17: ninguna entra en la spec 006. La invitación a completar la sede la cubre «Completa tu academia» de HU-032 (EP-09); pedir la dirección en el registro queda como `feat` futura.

## Decisiones relacionadas

DEC-01, DEC-02, DEC-05, DEC-07, DEC-08, DEC-09, DEC-10, DEC-11, DEC-12, DEC-13, DEC-14, DEC-15, DEC-19, DEC-20, DEC-21, DEC-24 (ADR-012) y ADR-014.
