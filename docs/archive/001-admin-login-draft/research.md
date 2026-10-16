# Investigación: Admin Login

## Decisión: Usar Supabase Auth solo para identidad y sesión

**Justificación**: La arquitectura del proyecto establece Supabase Auth como proveedor de
autenticación del MVP. Gestiona autenticación por correo electrónico/contraseña y restauración de
sesión sin implementar un sistema de credenciales propio.

**Alternativas consideradas**:

- Autenticación propia: descartada porque duplica una capacidad administrada y viola ADR-008.
- Proveedores externos de identidad: descartados porque HU-001 los excluye.

## Decisión: Resolver la autorización de academia mediante `academy_members`

**Justificación**: Un login exitoso prueba identidad, no membresía. El modelo multi-tenant vigente
requiere que la aplicación resuelva la membresía activa por separado y nunca equipare `auth.uid()`
con `academy_id`. Bajo la regla del MVP, una membresía activa produce un contexto de academia. La
ausencia de membresía activa produce un estado autenticado pero con acceso denegado y sin tenant.

**Alternativas consideradas**:

- Tratar a un usuario autenticado como autorizado automáticamente: descartado porque omite la
  membresía.
- Inferir el tenant desde un identificador de academia enviado por el cliente: descartado porque no
  constituye autorización.
- Implementar selección multi-academia: diferido porque está fuera de HU-001 y de la regla MVP.

## Decisión: Proteger rutas privadas mediante un guard reutilizable

**Justificación**: La protección de rutas debe funcionar tanto para navegación directa como para
sesiones restauradas. Un guard diferencia usuarios no autenticados, que regresan a login, de usuarios
autenticados sin membresía activa, que llegan a acceso denegado.

**Alternativas consideradas**:

- Proteger solo acciones de página: descartado porque el contenido protegido podría mostrarse durante
  navegación directa.
- Ubicar decisiones de ruta en la página de login: descartado porque cada ruta privada necesita un
  control de acceso consistente.

## Decisión: Mantener separados UI, lógica de aplicación y acceso a Supabase

**Justificación**: La arquitectura de frontend y ADR-002 requieren `Component → Service → Repository
→ Supabase`. El login existente de SakaiNG solo presenta UI y se adaptará como página de producto; no
debe llamar directamente a Supabase.

**Alternativas consideradas**:

- Llamar Supabase desde el componente de login: descartado por la arquitectura y la Constitución.
- Introducir ahora un backend propio: diferido; la frontera de repository lo permite posteriormente.

## Decisión: Validar seguridad mediante pruebas por capas

**Justificación**: Las pruebas de componente/servicio cubren comportamiento visible, mientras las de
integración validan membresía/RLS. Los filtros del frontend solo son complementarios; RLS protege los
datos reales de academia.

**Alternativas consideradas**:

- Validación solo de UI: descartada porque no puede demostrar autorización ni aislamiento de tenant.
- Instalación de framework E2E: diferida porque no hay uno configurado; la validación manual de
  aceptación cubre el flujo MVP hasta que una decisión de proyecto adopte uno.
