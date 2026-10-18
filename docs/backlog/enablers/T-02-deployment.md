# T-02 — Despliegue del entorno de pruebas

**Tipo:** Habilitador técnico (*enabler*) · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Terminado (entorno de pruebas)
**Spec:** [`specs/008-deployment/`](../../../specs/008-deployment/spec.md) · Guía: [`docs/engineering/deployment.md`](../../engineering/deployment.md)

## Avance

Entorno de pruebas: **https://playertech-saas.vercel.app** · Supabase `ztibxfmcysicwfrypbef`.

| Criterio | Estado | Evidencia |
|---|---|---|
| CA-001 — Base de datos en la nube | ✅ | 11 migraciones aplicadas con `db:push`, sin el seed; RLS y permisos verificados con la clave publicable |
| CA-002 — Frontend publicado | ✅ | Vercel desde `main` con HTTPS. La vista previa de los PR se confirma en el próximo PR |
| CA-003 — Rutas de la aplicación | ✅ | Las rutas internas cargan al abrirse directamente |
| CA-004 — Flujo de cuenta | ✅ | Registro, verificación e inicio de sesión validados en el celular. Recuperación: pendiente por el cupo de correo (se confirma con SMTP propio) |
| CA-005 — Sin secretos en el cliente | ✅ | `check:bundle` en cada compilación de Vercel; los JS publicados solo tienen la URL del proyecto |
| CA-006 — Desarrollo local intacto | ✅ | `config.toml` y `environment.ts` sin cambios en el repositorio |

## Propósito

Publicar PlayerTech en la nube como **entorno de pruebas** para el equipo: el frontend en **Vercel** y el backend en **Supabase** (plan Free, ADR-016). Así se prueba el producto en condiciones reales (red, HTTPS, celular) antes del piloto, sin academias reales.

## Necesidad del equipo

> Como **equipo de producto**, necesitamos PlayerTech desplegado en la nube, para probarlo desde cualquier dispositivo con HTTPS y preparar el piloto con academias reales.

## Alcance (decisión del responsable de producto del 2026-10-18)

- **Incluye:**
  - proyecto de Supabase en la nube con todas las migraciones y **sin el seed** (sin cuentas de prueba);
  - Auth configurado: URL del sitio, redirecciones a `/auth/callback`, verificación de correo, contraseña mínima de 8;
  - frontend en Vercel conectado a GitHub, con despliegue automático de `main` y vistas previas de los PR;
  - configuración pública de producción en el frontend;
  - guía de despliegue y verificación.
- **No incluye** (queda en «Antes del piloto» del roadmap):
  - SMTP propio y dominio propio;
  - correos con la identidad en la nube. Supabase solo permite editar las plantillas con un plan de pago o con SMTP propio, comprobado el 2026-10-18; se aplicarán junto con el SMTP propio;
  - copias de seguridad propias;
  - documentos legales definitivos;
  - mitigaciones de SEC-01.

  Sin SMTP propio, Supabase solo envía correos a los miembros del equipo del proyecto y con un límite bajo por hora: **solo el equipo puede registrarse** en este entorno.

## Criterios de aceptación

### CA-001 — Base de datos en la nube
**Dado** el proyecto de Supabase en la nube, **cuando** se aplican las migraciones del repositorio, **entonces** el esquema, RLS, las funciones, los catálogos (planes y documentos legales) y los buckets quedan iguales a los locales, sin datos de prueba.

### CA-002 — Frontend publicado
**Dado** el repositorio en GitHub, **cuando** se hace merge a `main`, **entonces** Vercel compila y publica el frontend con HTTPS, y cada PR obtiene una vista previa.

### CA-003 — Rutas de la aplicación
**Dado** el frontend publicado, **cuando** se abre o recarga directamente una ruta interna (por ejemplo `/settings/venues`), **entonces** carga la aplicación y no un error 404.

### CA-004 — Flujo de cuenta de punta a punta
**Dado** un miembro del equipo, **cuando** se registra en el entorno de pruebas, verifica su correo con el enlace recibido e inicia sesión, **entonces** llega al inicio de una academia nueva lista para operar (plan Free y sede principal).

### CA-005 — Sin secretos en el cliente
**Dado** el frontend publicado, **cuando** se inspecciona lo que descarga el navegador, **entonces** solo contiene valores públicos de Supabase (URL y clave publicable); nunca la clave `service_role` ni la contraseña de la base de datos.

### CA-006 — Desarrollo local intacto
**Dado** el entorno local, **cuando** se trabaja como hasta ahora, **entonces** sigue funcionando contra Supabase local sin cambios.

## Decisiones relacionadas

ADR-014, ADR-015 (FE-03), ADR-016 y ADR-017.
