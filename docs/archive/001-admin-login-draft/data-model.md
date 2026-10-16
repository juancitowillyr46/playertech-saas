# Modelo de datos: Admin Login

## Alcance

HU-001 no agrega tablas de base de datos. Consume el modelo existente de identidad y membresía
multi-tenant documentado en `docs/architecture/supabase.md` y
`docs/architecture/database-schema.md`.

## Entidades

### Usuario autenticado

Representa la identidad verificada con una sesión activa.

| Atributo | Significado | Reglas |
|---|---|---|
| User ID | Identificador de la identidad autenticada | Identifica un usuario, nunca una academia. |
| Estado de sesión | Si la identidad está autenticada actualmente | Una sesión válida es obligatoria para rutas privadas. |

### Membresía de academia

Representa la relación de autorización entre un usuario y una academia.

| Attribute | Meaning | Rules |
|---|---|---|
| User ID | Usuario autenticado referenciado | Debe corresponder a la identidad actual para acceder. |
| Academy ID | Academia/tenant referenciado | Nunca se deriva equiparándolo a User ID. |
| Estado activo | Si la membresía permite acceso a academia | Una membresía inactiva o ausente no concede acceso privado. |
| Rol | Responsabilidad de la membresía | El MVP usa el contexto de administrador; roles avanzados están fuera de alcance. |

## Estados derivados de la aplicación

| Estado | Condición | Resultado permitido |
|---|---|---|
| No autenticado | No existe sesión válida | Mostrar login; las rutas privadas redirigen a login. |
| Autenticado y autorizado | Sesión válida con membresía activa | Establecer contexto de academia y permitir rutas privadas. |
| Autenticado pero no autorizado | Sesión válida sin membresía activa | Conservar sesión, mostrar acceso denegado, no establecer contexto y denegar rutas privadas. |
| Sesión expirada o inválida | La sesión deja de ser válida | Retirar acceso privado y solicitar login nuevamente. |

## Relaciones

```text
Usuario autenticado
       │ user_id
       ▼
Membresía de academia
       │ academy_id
       ▼
Academia / Tenant
```

## Reglas de validación

- Correo electrónico y contraseña son obligatorios antes de realizar una solicitud de autenticación.
- Las credenciales inválidas no establecen una sesión ni autorizan acceso.
- Solo una membresía activa puede establecer un contexto de academia.
- El cliente puede usar el contexto resuelto para comportamiento de aplicación, pero no puede tratarlo
  como autorización; RLS valida el acceso a datos independientemente.
