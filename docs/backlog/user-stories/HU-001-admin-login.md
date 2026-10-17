# HU-001 — Iniciar sesión

**Épica:** EP-01 — Acceso y sesión · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definida
**Spec:** pendiente (el borrador anterior `001-admin-login` está archivado en `docs/archive/`)

> **Versión básica disponible:** la spec 002 (`specs/002-frontend-foundation/`, Historia 7) construyó una versión básica funcional de esta pantalla en `frontend/src/app/features/auth/`. Esta HU la **completa** con todos sus criterios de aceptación y la revisión de diseño de T-01; no la reemplaza.

## Historia de usuario

> Como **owner**, quiero iniciar sesión con mi correo electrónico y contraseña, para acceder de forma segura a la gestión de mi academia.

## Objetivo

Permitir que solo un usuario con correo verificado, membresía activa y academia activa acceda a las funcionalidades privadas de PlayerTech.

## Criterios de aceptación

### CA-001 — Inicio de sesión válido

**Dado** que el owner tiene una cuenta verificada y su academia está activa,
**cuando** ingresa su correo electrónico y contraseña,
**entonces** el sistema le permite acceder y le muestra el inicio de PlayerTech de su academia.

### CA-002 — Credenciales inválidas

**Dado** que una persona proporciona un correo o una contraseña incorrectos,
**cuando** intenta iniciar sesión,
**entonces** el sistema rechaza el acceso y muestra un mensaje genérico que no revela si el correo está registrado.

### CA-003 — Campos obligatorios

**Dado** que una persona intenta iniciar sesión,
**cuando** el correo, la contraseña o ambos están vacíos,
**entonces** el sistema indica los campos obligatorios y no intenta autenticarla.

### CA-004 — Correo sin verificar

**Dado** que el owner aún no verificó su correo,
**cuando** intenta iniciar sesión,
**entonces** el sistema no le permite acceder y le indica que debe verificar su correo.

### CA-005 — Acceso protegido

**Dado** que una persona no tiene una sesión iniciada,
**cuando** intenta acceder directamente a una funcionalidad privada,
**entonces** el sistema impide el acceso y le muestra el inicio de sesión.

### CA-006 — Sesión vigente

**Dado** que el owner ya inició sesión y su sesión sigue vigente,
**cuando** vuelve a abrir PlayerTech,
**entonces** el sistema le permite continuar sin solicitar sus credenciales de nuevo.

### CA-007 — Academia suspendida

**Dado** que la academia del owner está suspendida,
**cuando** inicia sesión,
**entonces** el sistema le muestra un aviso de academia suspendida y no le permite operar.

### CA-008 — Usuario sin membresía activa

**Dado** que una persona tiene una cuenta válida pero no tiene una membresía activa en ninguna academia,
**cuando** inicia sesión,
**entonces** el sistema le muestra un aviso de acceso denegado y no le permite operar.

## Reglas de negocio

- La autenticación (quién es) y la membresía (a qué academia pertenece) son conceptos distintos.
- La academia del usuario se determina por su membresía, nunca por un dato enviado desde la interfaz.
- Los mensajes de error no revelan si un correo está registrado.

## Fuera de alcance

- Inicio de sesión con proveedores externos.
- Autenticación de dos factores.
- Selección entre varias academias.

## Decisiones relacionadas

DEC-02, DEC-10, DEC-12, DEC-17, DEC-18 (ADR-012) y ADR-014.
