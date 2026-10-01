# HU-001 — Admin Login

**Épica:** EP-01 — Acceso y sesión

## Historia de usuario

> Como **administrador**, quiero iniciar sesión con mi correo electrónico y contraseña, para acceder de forma segura a la gestión de mi academia.

## Objetivo

Permitir que un administrador autenticado acceda a las funcionalidades privadas de PlayerTech.

## Criterios de aceptación

### CA-001 — Inicio de sesión válido

**Dado** que el administrador tiene credenciales válidas,  
**cuando** ingresa su correo electrónico y contraseña,  
**entonces** el sistema debe autenticarlo y permitirle acceder a la aplicación.

### CA-002 — Credenciales inválidas

**Dado** que el administrador proporciona credenciales incorrectas,  
**cuando** intenta iniciar sesión,  
**entonces** el sistema debe rechazar el acceso y mostrar un mensaje indicando que las credenciales no son válidas.

### CA-003 — Campos obligatorios

**Dado** que el administrador intenta iniciar sesión,  
**cuando** uno o ambos campos requeridos están vacíos,  
**entonces** el sistema debe indicar que los campos son obligatorios y no debe intentar autenticarlo.

### CA-004 — Acceso protegido

**Dado** que el administrador no está autenticado,  
**cuando** intenta acceder directamente a una funcionalidad privada,  
**entonces** el sistema debe impedir el acceso y solicitar autenticación.

## Fuera de alcance

- Recuperación de contraseña.
- Registro público de administradores.
- Inicio de sesión mediante proveedores externos.
- Gestión avanzada de roles.