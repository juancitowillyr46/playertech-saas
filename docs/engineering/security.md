# Security

## Propósito

Define los principios de seguridad aplicables al MVP de PlayerTech.

La seguridad debe formar parte del diseño de las funcionalidades y no tratarse únicamente como una actividad posterior.

## Authentication

El acceso administrativo utilizará autenticación mediante Supabase Auth durante el MVP.

El frontend debe mantener protegidas las rutas que requieren sesión.

Ejemplo:

```text
Public
  └── Login

Authenticated
  ├── Dashboard
  ├── Players
  ├── Activities
  └── Call-ups
```

## Authorization

La autenticación determina quién es el usuario.

La autorización determina qué datos y operaciones puede realizar.

Durante el MVP se mantendrá un modelo simple centrado en el administrador de la academia.

La autorización debe determinarse mediante la pertenencia del usuario a una academia. La identidad autenticada (`auth.uid()`) identifica al usuario; no identifica a la academia ni reemplaza la membresía.

```text
auth.users
   ↓ user_id
academy_members
   ↓ academy_id
academies / tenants
   ↓
business data
```

El MVP puede mantener un modelo de roles reducido, pero el aislamiento entre academias es obligatorio desde el inicio. La evolución hacia roles y permisos avanzados queda fuera del alcance actual.

## Row Level Security

La protección de datos debe implementarse mediante Row Level Security cuando corresponda.

No se debe confiar exclusivamente en restricciones implementadas en Angular.

```text
Frontend validation
        +
Supabase RLS
        ↓
Data protection
```

Las políticas RLS deben validar la pertenencia del usuario a la academia para las operaciones `SELECT`, `INSERT`, `UPDATE` y `DELETE` que correspondan. Un `academy_id` enviado por el cliente no constituye autorización.

## Datos sensibles

No deben almacenarse innecesariamente datos sensibles.

El MVP debe limitar la información almacenada a la necesaria para las funcionalidades definidas.

Los datos adicionales deberán justificarse por una necesidad funcional.

## Secrets

Las credenciales y secretos no deben almacenarse en el repositorio.

No deben incluirse:

```text
API keys privadas
Passwords
Service role keys
Tokens
Secrets
```

Los valores necesarios para el frontend deben gestionarse mediante la configuración correspondiente y nunca utilizar credenciales privilegiadas en el cliente.

## Supabase

El cliente frontend debe utilizar únicamente las credenciales y mecanismos destinados al acceso público/cliente.

Las claves privilegiadas de Supabase no deben exponerse en Angular.

## Enlaces de convocatoria

Los enlaces utilizados para las convocatorias deben respetar las reglas definidas funcionalmente:

- acceso temporal;
- expiración;
- asociación con una convocatoria;
- asociación con el jugador correspondiente;
- no permitir modificaciones después de registrar la respuesta.

Los detalles técnicos de implementación deberán definirse en la especificación de la funcionalidad correspondiente.

El acceso público mediante token debe limitarse a la convocatoria y operación autorizadas; no debe deshabilitarse RLS ni permitir acceso a datos de otras academias.

## Validación

Las validaciones del frontend mejoran la experiencia del usuario, pero no constituyen por sí mismas una frontera de seguridad.

Las restricciones importantes deben aplicarse también en la capa de datos o servicio correspondiente.

## Riesgos aceptados y mejoras pendientes

Registro de los riesgos de seguridad que el MVP acepta de forma consciente y de las mejoras previstas para una iteración futura. Cada mejora se especifica en su propia spec cuando se priorice.

**Criterio común:** las mitigaciones se diseñan **independientes del proveedor de autenticación** (hoy Supabase Auth). Se implementan en una capa propia de PlayerTech (servidor o servicios propios, detrás de las abstracciones de ADR-009) y no con funciones exclusivas del proveedor, para poder cambiarlo sin perder los controles. La spec de cada mejora define esa capa.

### SEC-01 — Enumeración de cuentas en el registro

- **Origen:** excepción a DEC-12 decidida el 2026-10-18 (HU-014 CA-005, spec 006). El registro indica «Ya existe una cuenta con este correo».
- **Riesgo:** cualquiera puede averiguar si un correo tiene cuenta en PlayerTech probando registrarlo. Facilita correos de suplantación dirigidos a owners reales.
- **Por qué se acepta:** claridad para el owner, que de otro modo espera un correo que nunca llega. El dato que se filtra es de bajo valor: muchas academias publican su correo de contacto.
- **Lo que sigue protegido:** el inicio de sesión, la recuperación de contraseña y el reenvío de la verificación no revelan si una cuenta existe (DEC-12).
- **Mitigaciones previstas:**

| # | Mitigación | Qué evita | Prioridad |
|---|---|---|---|
| 1 | Autenticación del dominio de correo (SPF, DKIM, DMARC) al configurar el envío real | Que se suplante el remitente de PlayerTech | Antes del piloto |
| 2 | Aviso en los correos: «PlayerTech nunca te pedirá tu contraseña por correo» | Que el owner caiga en una suplantación | Antes del piloto |
| 3 | Límite de intentos de registro e inicio de sesión por origen, en la capa propia | La enumeración y los ataques automatizados masivos | Antes del piloto |
| 4 | Captcha en el registro, verificado en el servidor propio, con un proveedor intercambiable | La automatización de pruebas de correos | Antes del piloto |
| 5 | Flujo neutral con aviso: el registro siempre dice «Revisa tu correo» y, si la cuenta ya existía, se envía al dueño real un correo para iniciar sesión o recuperar la contraseña. Elimina la excepción a DEC-12 sin perder la claridad | La enumeración, por completo | MVP+, si el volumen o el tipo de cliente lo justifica |
| 6 | Segundo factor (MFA) para los owners | El acceso aunque roben la contraseña | MVP+ |

### SEC-02 — Cierre por inactividad solo en el cliente

- **Origen:** ADR-014 y DEC-28 (spec 005).
- **Riesgo:** el cierre por inactividad lo hace la aplicación. El token de renovación sigue válido en el servidor hasta que la aplicación cierra la sesión.
- **Mitigación prevista:** caducidad por inactividad también en el servidor, en la capa propia de sesión o con la función equivalente del proveedor que se use, sin acoplar la aplicación a ella.
- **Prioridad:** MVP+.

### SEC-03 — Verificación débil del acudiente en la convocatoria

- **Origen:** DEC-31 (ADR-018), ideación de la Fase 2 del 2026-10-18.
- **Riesgo:** el acudiente responde sin cuenta, desde el enlace del grupo. Si el enlace sale del grupo, alguien podría ver los convocados (nombre e inicial del apellido) y responder por un jugador.
- **Por qué se acepta:** reemplaza el mensaje manual de hoy (que suele listar los nombres completos en el grupo) sin servicios externos ni cuentas para los acudientes. La respuesta solo afecta la confirmación de una actividad.
- **Mitigaciones** (implementadas en la spec 013):
  - enlace impredecible (128 bits) que deja de aceptar respuestas al cierre; un enlace inválido no revela si existe;
  - `anon` no accede a ninguna tabla: solo a tres funciones que devuelven lo mínimo (nombre e inicial del apellido, nunca celulares ni respuestas de otros);
  - el formulario para identificarse es el mismo exista o no el celular, para no revelar qué celulares están registrados;
  - la llave del dispositivo la genera el servidor y solo se guarda su huella;
  - cada vínculo nuevo, y cada dispositivo nuevo aunque el celular coincida con un acudiente registrado, queda pendiente hasta que el owner lo valida; sus respuestas se distinguen y el owner ve la coincidencia de celular;
  - rechazar descarta el vínculo, la respuesta deja de contar y el dispositivo deja de reconocerse, sin avisar a quien fue rechazado;
  - máximo 3 cambios de respuesta por jugador, garantizado en la base de datos; registro inmutable de quién respondió y cuándo;
  - en el MVP+: código de un solo uso por SMS o WhatsApp, cuando exista la integración oficial.

## Principio

> Ninguna funcionalidad debe asumir que una validación realizada únicamente en el frontend constituye una protección de seguridad.
