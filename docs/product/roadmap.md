# Roadmap

El roadmap de PlayerTech representa la evolución prevista del producto. No constituye un cronograma ni compromete fechas de implementación.

La evolución se plantea de forma incremental, partiendo de un MVP funcional y ampliando progresivamente las capacidades de gestión de las academias.

## Etapa 1 — MVP v1

**Objetivo:** validar el flujo básico de gestión de actividades y convocatorias sobre una plataforma SaaS multi-tenant real.

### Fase 1 — Fundación SaaS

- Alta autoservicio de academia y owner, con verificación de correo y aceptaciones legales.
- Inicio y cierre de sesión, cierre por inactividad y recuperación de contraseña.
- Gestión del perfil de la academia.
- Gestión de sedes y sede principal.
- Plan Free asignado automáticamente, sin límites.

### Antes del piloto con academias reales

Requisitos de operación (ADR-014 y ADR-016) que no son funcionalidades, pero deben existir antes de registrar academias reales:

- Proyecto de Supabase en la nube (plan Free) con las migraciones aplicadas.
- Dominio propio de PlayerTech.
- SMTP propio verificado con ese dominio (recomendación inicial: Resend).
- Correos de autenticación con la identidad de PlayerTech (T-01, CA-007) aplicados en la nube y probados con el SMTP real.
- Copias de seguridad propias de la base de datos y procedimiento de restauración.
- Documentos legales definitivos (Términos y Condiciones y Política de Tratamiento de Datos) publicados en su URL final.

### Fase 2 — Negocio

- Gestión de acudientes.
- Gestión de jugadores.
- Gestión de grupos/categorías.
- Creación de actividades.
- Entrenamientos.
- Competencias.
- Generación de convocatorias.
- Enlaces de convocatoria.
- Respuesta del tutor.
- Registro de confirmación o no participación.
- Motivo de no participación.
- Consulta de respuestas.
- Generación de mensajes para WhatsApp.
- Comunicación manual mediante copiar y pegar.

**Contexto:** una academia de fútbol.

**Arquitectura:** multi-tenant desde el inicio, con aislamiento de datos por academia mediante el modelo de pertenencia y RLS.

---

## Etapa 2 — Gestión operativa

**Objetivo:** ampliar la gestión diaria de la academia.

Capacidades previstas:

- Gestión de entrenadores.
- Gestión más completa de categorías y equipos.
- Gestión de tutores.
- Registro y control de asistencia.
- Historial de actividades.
- Seguimiento operativo de jugadores.
- Mejoras en convocatorias y comunicación.

---

## Etapa 3 — Gestión administrativa

**Objetivo:** centralizar progresivamente los procesos administrativos de la academia.

Capacidades previstas:

- Matrículas.
- Gestión de pagos.
- Estados de cuenta.
- Seguimiento de obligaciones.
- Reportes administrativos.
- Gestión documental.
- Información complementaria de jugadores.

---

## Etapa 4 — Administración SaaS avanzada

**Objetivo:** ampliar las capacidades de administración de una plataforma que ya opera con arquitectura multi-tenant.

El alta autoservicio de academias, el plan Free y la configuración básica por academia se adelantan al MVP v1 (Fase 1).

Capacidades previstas:

- Invitaciones y administración de usuarios y roles por academia.
- Planes Pro y Advanced, límites de plan, cambio de plan y cobro.
- Administración de organizaciones y suspensión de academias.
- Gestión centralizada de la plataforma.
- Pertenencia de una persona a varias academias.

---

## Etapa 5 — Plataforma deportiva multidisciplinaria

**Objetivo:** extender el modelo de PlayerTech más allá del fútbol.

Posibles disciplinas:

- Fútbol.
- Vóley.
- Básquet.
- Otras disciplinas deportivas.

La evolución deberá identificar qué conceptos son comunes a diferentes deportes y cuáles requieren comportamientos específicos de cada disciplina.

```text
                    PLAYERTECH
                        │
                        ▼
                   MVP v1
              Gestión de actividades
                  y convocatorias
                        │
                        ▼
              Gestión operativa
                        │
                        ▼
             Gestión administrativa
                        │
                        ▼
      Administración SaaS avanzada
                        │
                        ▼
          Plataforma Multideportiva
```

## Principio de evolución

El roadmap no implica que todas las capacidades deban implementarse de forma secuencial o que las etapas tengan fechas determinadas.

Las prioridades podrán cambiar según:

- Validación con usuarios.
- Necesidades reales de las academias.
- Resultados del MVP.
- Viabilidad técnica.
- Oportunidades de negocio.
