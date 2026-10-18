# EP-01 — Acceso y sesión

**Fase:** 1 — Fundación SaaS · **Prioridad:** MVP

## Objetivo

Permitir que el owner acceda de forma segura a PlayerTech, mantenga su sesión mientras la usa y recupere el acceso si olvida su contraseña. Solo pueden operar usuarios con membresía activa en una academia activa.

## Alcance

- Inicio de sesión mediante correo electrónico y contraseña.
- Acceso restringido a usuarios con correo verificado, membresía activa y academia activa.
- Cierre de sesión manual.
- Cierre automático de sesión tras 60 minutos sin interacción.
- Recuperación de contraseña mediante enlace por correo.

## Fuera del alcance

- Inicio de sesión con proveedores externos (Google, Facebook…).
- Autenticación de dos factores.
- Gestión avanzada de roles y permisos.

## Decisiones relacionadas

ADR-012 (DEC-10, DEC-11, DEC-12, DEC-16, DEC-17, DEC-18, DEC-28) y ADR-014.

## Historias de usuario

| ID | Historia | Prioridad | Estado |
|---|---|---|---|
| HU-001 | Iniciar sesión | MVP | Terminada (local) |
| HU-015 | Cerrar sesión | MVP | Terminada (local) |
| HU-016 | Recuperar contraseña | MVP | Terminada (local) |
