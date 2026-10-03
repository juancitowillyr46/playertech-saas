# Alcance del Producto — MVP v1

## 1. Objetivo

El **MVP v1 de PlayerTech** tiene como objetivo validar un primer flujo digital para la gestión operativa de una academia deportiva, reemplazando un proceso actualmente realizado mediante herramientas manuales y canales dispersos.

El MVP se centra inicialmente en **una academia de fútbol** y prioriza la gestión de jugadores, grupos y actividades, junto con la convocatoria y confirmación de participación por parte de los tutores.

El MVP utiliza una arquitectura **SaaS multi-tenant desde el inicio**: cada academia constituye un tenant y sus datos deben permanecer aislados. La administración SaaS avanzada no forma parte del alcance funcional del MVP v1.

---

## 2. Alcance funcional

El MVP v1 contempla los siguientes procesos:

### Gestión de acceso

- Inicio de sesión del administrador mediante correo electrónico y contraseña.
- Control de acceso a la aplicación.
- Gestión de la sesión del administrador.

El MVP no contempla recuperación de contraseña.

### Gestión de jugadores

- Registro y consulta de jugadores.
- Asociación de jugadores con grupos o categorías.
- Un jugador puede pertenecer a más de un grupo.

### Gestión de grupos

- Creación y gestión básica de grupos o categorías.
- Asociación de jugadores a los grupos correspondientes.

### Gestión de actividades

El administrador puede crear actividades de la academia.

El MVP contempla inicialmente dos tipos:

- Entrenamiento.
- Competencia.

Una actividad contiene la información necesaria para comunicarla y realizar su convocatoria.

### Convocatorias

El administrador puede generar una convocatoria asociada a una actividad.

La convocatoria permite:

- Identificar al jugador convocado.
- Compartir un enlace de respuesta.
- Generar el contenido necesario para comunicar la convocatoria.

El enlace es público y temporal.

### Respuesta del tutor

El tutor puede acceder a la convocatoria mediante el enlace recibido y registrar su respuesta:

- **Sí** — confirma la participación.
- **No** — no confirma la participación y puede indicar un motivo.

Una vez registrada la respuesta, el enlace deja de estar disponible para modificarla.

El MVP no contempla que el tutor tenga que crear una cuenta para responder.

### Consulta de respuestas

El administrador puede consultar las respuestas recibidas para una actividad o convocatoria.

Esto permite conocer qué jugadores confirmaron o no su participación.

### Comunicación mediante WhatsApp

El MVP contempla la generación del mensaje necesario para compartir la convocatoria mediante WhatsApp.

La comunicación se realiza mediante **copiar y pegar**.

No se contempla una integración directa con la API oficial de WhatsApp.

---

## 3. Actores

| Actor | Participación en el MVP |
|---|---|
| **Administrador** | Gestiona jugadores, grupos, actividades, convocatorias y consulta respuestas. |
| **Tutor / Padre** | Accede a una convocatoria y registra la respuesta del jugador. |
| **Jugador** | Es la persona convocada a una actividad. |
| **Entrenador** | Forma parte del dominio de la plataforma, pero no tiene un flujo funcional propio dentro del MVP v1. |

El administrador es el actor principal del MVP.

---

## 4. Flujo principal del MVP

El flujo principal que se busca validar es:

```text
Administrador
     │
     ▼
Selecciona / gestiona jugadores
     │
     ▼
Crea actividad
(Entrenamiento / Competencia)
     │
     ▼
Genera convocatoria
     │
     ▼
Genera mensaje
     │
     ▼
Comparte mediante WhatsApp
     │
     ▼
Tutor recibe el enlace
     │
     ▼
Consulta convocatoria
     │
     ├──────────────┐
     ▼              ▼
    SÍ              NO
     │              │
     │         Ingresa motivo
     │              │
     └───────┬──────┘
             ▼
       Respuesta registrada
             │
             ▼
     Administrador consulta
        las respuestas
```

Este flujo constituye el **vertical slice principal del MVP v1**.

---

## 5. Fuera del alcance del MVP v1

Las siguientes funcionalidades no forman parte del MVP v1:

### Asistencia

- Registro de asistencia real al entrenamiento o competencia.
- Control de asistencia por entrenador.
- Historial de asistencia.

La convocatoria y confirmación de participación **no representan asistencia**.

### Estadísticas

- Estadísticas deportivas de jugadores.
- Estadísticas de equipos.
- Indicadores avanzados de rendimiento.

### Documentación

- Gestión de documentos de jugadores.
- Carga de documentos administrativos.
- Gestión documental de la academia.

### Información médica

- Fichas médicas.
- Lesiones.
- Información médica de jugadores.
- Datos clínicos o de salud.

### Roles y permisos avanzados

- Sistema complejo de roles.
- Matrices avanzadas de permisos.
- Flujos diferenciados de autorización.

Aunque existen diferentes actores dentro del dominio, el MVP mantiene un modelo de acceso reducido.

### Comunicación integrada

- API oficial de WhatsApp.
- Envío automático de mensajes.
- Gestión de conversaciones.
- Automatizaciones de mensajería.

La comunicación del MVP se realiza mediante generación y copia del mensaje.

### Registro completo de tutores

El tutor no requiere una cuenta propia para participar en el flujo de convocatoria.

No se contempla en el MVP:

- Registro de tutores.
- Gestión de credenciales de tutores.
- Recuperación de contraseña de tutores.
- Perfil completo de tutor.

### Cambio de respuesta

El tutor no puede modificar su respuesta después de haberla enviado.

Si una convocatoria necesita ser modificada, el administrador deberá gestionar nuevamente el proceso de publicación/convocatoria.

---

## 6. Multi-tenancy

El escenario inicial del MVP v1 está orientado a **una academia operativa**, pero su arquitectura es multi-tenant desde el inicio. Cada academia constituye un tenant independiente y el aislamiento de datos forma parte del MVP.

Por tanto:

```text
MVP v1 — arquitectura
├── Academia A / Tenant A
│   ├── Jugadores, grupos, actividades y convocatorias
│   └── Datos aislados de otros tenants
└── Escenario funcional inicial
    └── Una academia de fútbol operativa
```

El escenario inicial de una sola academia no modifica el requisito arquitectónico de aislamiento entre tenants.

La implementación de onboarding multi-tenant, administración avanzada de múltiples organizaciones, facturación y otras funcionalidades SaaS avanzadas quedan fuera del MVP v1. El aislamiento completo entre tenants no queda fuera de alcance.

---

## 7. Criterio de alcance

El MVP v1 prioriza la validación de un proceso concreto de negocio:

> **Crear una actividad → convocar jugadores → comunicar la convocatoria → recibir confirmaciones → consultar respuestas.**

Las funcionalidades que no sean necesarias para validar este flujo deben considerarse fuera del alcance inicial y evaluarse para futuras versiones.

---

## 8. Evolución posterior

El alcance del MVP v1 no representa el alcance final de PlayerTech.

Las funcionalidades futuras podrán ampliar progresivamente la plataforma hacia:

- Gestión administrativa integral.
- Matrículas.
- Pagos.
- Gestión avanzada de tutores.
- Gestión de entrenadores.
- Asistencia.
- Reportes y estadísticas.
- Comunicación integrada.
- Administración SaaS avanzada de múltiples academias.
- Soporte para otras disciplinas deportivas.
