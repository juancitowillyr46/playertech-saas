# Roadmap

El roadmap de PlayerTech representa la evolución prevista del producto. No constituye un cronograma ni compromete fechas de implementación.

La evolución se plantea de forma incremental, partiendo de un MVP funcional y ampliando progresivamente las capacidades de gestión de las academias.

## Etapa 1 — MVP v1

**Objetivo:** validar el flujo básico de gestión de actividades y convocatorias.

### Capacidades

- Acceso del administrador.
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

**Arquitectura:** sentar las bases para una futura solución multi-tenant.

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

## Etapa 4 — Plataforma SaaS multi-tenant

**Objetivo:** evolucionar PlayerTech desde una solución para una academia hacia una plataforma SaaS para múltiples organizaciones.

Capacidades previstas:

- Alta de academias.
- Administración de organizaciones.
- Aislamiento de información por academia.
- Administración de usuarios y roles.
- Configuración por academia.
- Gestión centralizada de la plataforma.
- Suscripciones y capacidades propias de un modelo SaaS.

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
             SaaS Multi-Tenant
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