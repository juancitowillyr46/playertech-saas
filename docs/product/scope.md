# Alcance del Producto — MVP v1

## 1. Objetivo

El **MVP v1 de PlayerTech** tiene como objetivo validar un primer flujo digital para la gestión operativa de una academia deportiva, reemplazando un proceso actualmente realizado mediante herramientas manuales y canales dispersos.

El MVP se centra inicialmente en **una academia de fútbol** y prioriza la gestión de jugadores, grupos y actividades, junto con la convocatoria y confirmación de participación por parte de los tutores.

El MVP utiliza una arquitectura **SaaS multi-tenant desde el inicio**: cada academia constituye un tenant y sus datos deben permanecer aislados. La administración SaaS avanzada no forma parte del alcance funcional del MVP v1.

El MVP se construye en dos fases:

| Fase | Objetivo |
|---|---|
| **Fase 1 — Fundación SaaS** | Una academia se registra, su owner accede y gestiona la información base de la academia, aislada de las demás |
| **Fase 2 — Negocio** | Jugadores, acudientes, grupos, actividades, convocatorias y respuestas sobre la base de la Fase 1 |

Las decisiones de la Fase 1 están registradas en ADR-012, ADR-013 y ADR-014 (`docs/architecture/decisions.md`).

---

## 2. Alcance funcional

### Fase 1 — Fundación SaaS

#### Alta de academia

- Registro autoservicio de una academia y de su owner con nombre de la academia, nombre del owner, correo, contraseña y confirmación.
- Aceptación obligatoria de Términos y Condiciones y de la Política de Tratamiento de Datos Personales, con registro de auditoría.
- Verificación del correo antes del primer acceso.
- Al registrarse, la academia queda creada con el plan Free y una sede principal.
- País (Colombia) y zona horaria (America/Bogota) se asignan internamente y no se muestran.

#### Gestión de acceso

- Inicio de sesión del owner mediante correo electrónico y contraseña.
- Cierre de sesión manual y cierre automático tras 60 minutos sin interacción.
- Recuperación de contraseña mediante enlace por correo.
- Control de acceso a la aplicación: solo usuarios con membresía activa en una academia activa.

#### Gestión de la academia

- Consulta y edición de nombre, logo, teléfono, correo de contacto, dirección y ciudad.

#### Gestión de sedes

- Registro, consulta y edición de sedes (oficinas o lugares de entrenamiento).
- Cambio de la sede principal.
- Desactivación reversible y eliminación lógica de sedes, excepto la principal.

#### Plan

- Toda academia tiene el plan **Free sin límites**. No hay cambio de plan ni cobro en el MVP.

### Fase 2 — Negocio

> Refinada en la ideación del 2026-10-18. Decisiones en `docs/architecture/decisions.md` (ADR-018, DEC-30 a DEC-42).

### Gestión de jugadores y acudientes

- Registro y consulta de jugadores con datos básicos: nombres y apellidos, apodo opcional, fecha de nacimiento, celular propio y activo o inactivo. Sin documento ni foto (DEC-36).
- Cada jugador puede tener uno o más acudientes (nombre, celular, parentesco). Un jugador adulto sin acudiente responde él mismo desde el enlace («Soy el jugador»). El celular del jugador es opcional (DEC-30, DEC-36).
- No se registra dos veces el mismo jugador (nombres, apellidos y fecha de nacimiento); se ofrece actualizar sus datos (DEC-42).
- Asociación de jugadores con grupos o categorías; un jugador puede pertenecer a más de un grupo.

### Gestión de grupos

- Creación y gestión básica de grupos o categorías.
- Asociación de jugadores a los grupos correspondientes.

### Gestión de actividades

El administrador puede crear actividades de la academia. Se realizan en una sede de la academia o en una cancha externa de su catálogo de canchas, reutilizables y que se pueden crear al crear la actividad (DEC-32).

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

Se comparte **un solo mensaje generado por grupo**, con un enlace secreto y temporal (DEC-31). Los acudientes no necesitan estar registrados: la primera vez eligen a su jugador en la lista de convocados (nombre, inicial del apellido y apodo) y se identifican; el owner valida cada vínculo y cada dispositivo nuevo con un toque, y el dispositivo queda recordado. No se envían códigos por SMS ni por WhatsApp. Flujo en `docs/product/call-up-flow.md`. La convocatoria tiene una fecha límite opcional; sin ella, se cierra al empezar la actividad (DEC-34).

### Respuesta del tutor

El tutor puede acceder a la convocatoria mediante el enlace recibido y registrar su respuesta:

- **Sí** — confirma la participación.
- **Sí, provisional** — confirma de forma provisional y puede indicar de qué depende.
- **No** — no confirma la participación y puede indicar un motivo.

El motivo se elige de una lista fija y es opcional; *Otro* pide un texto de hasta 200 caracteres. Si al cierre la respuesta sigue provisional, queda como provisional (DEC-38).

Puede cambiar la respuesta hasta 3 veces por jugador, siempre antes del cierre (DEC-33). Vale la última, con quién la dio y cuándo.

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
| **Visitante** | Registra una academia y su cuenta de owner. |
| **Owner** | Administrador de la academia y único rol del MVP. Gestiona la academia, sus sedes y, en la Fase 2, jugadores, grupos, actividades, convocatorias y respuestas. Otros roles (admin, entrenador) se incorporarán en el MVP+. |
| **Tutor / Padre** | Accede a una convocatoria y registra la respuesta del jugador. |
| **Jugador** | Es la persona convocada a una actividad. |
| **Entrenador** | Forma parte del dominio de la plataforma, pero no tiene un flujo funcional propio dentro del MVP v1. |

El owner es el actor principal del MVP. En este documento, "administrador" se refiere al owner de la academia.

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

- Registro de asistencia real al entrenamiento o competencia (lista completa de presentes).
- Control de asistencia por entrenador.
- Historial de asistencia.

La convocatoria y confirmación de participación **no representan asistencia**.

> **Excepción incluida en el MVP** (DEC-48, 2026-10-23): el **aviso de inasistencia por excepción**. El owner marca solo a quien no llegó y le escribe a su acudiente por WhatsApp (EP-15, HU-042). La asistencia formal sigue en la Etapa 2.

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

Aunque existen diferentes actores dentro del dominio, el MVP mantiene un modelo de acceso reducido: un único usuario Owner por academia.

### Administración SaaS avanzada

- Invitaciones y múltiples usuarios por academia.
- Cambio de plan, límites de plan y cobro.
- Pertenencia de una persona a varias academias.
- Panel de administración de la plataforma.
- Suspensión de academias desde una interfaz (el estado existe en el modelo).
- Captcha en el registro.

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

El **alta autoservicio de academias** forma parte del MVP (Fase 1). La administración avanzada de múltiples organizaciones, la facturación y otras funcionalidades SaaS avanzadas quedan fuera del MVP v1. El aislamiento completo entre tenants no queda fuera de alcance.

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
