# Glosario

Este documento define los términos utilizados en PlayerTech para mantener un lenguaje común entre producto, diseño y desarrollo.

## Producto y organización

| Término | Definición |
|---|---|
| **PlayerTech** | Plataforma SaaS para la gestión de academias deportivas. |
| **Academia** | Organización deportiva que utiliza PlayerTech para gestionar sus operaciones. En el MVP v1 corresponde a una academia de fútbol. |
| **Tenant** | Organización o academia aislada dentro de la futura arquitectura multi-tenant de PlayerTech. |
| **Administrador** | Usuario responsable de gestionar la información y operación de la academia dentro de la plataforma. |
| **Entrenador** | Persona responsable de dirigir actividades deportivas y trabajar con los jugadores. |
| **Tutor / Padre** | Persona responsable de uno o más jugadores y que puede responder convocatorias en su representación. |
| **Jugador** | Persona que participa en las actividades deportivas de una academia. |

## Organización deportiva

| Término | Definición |
|---|---|
| **Categoría** | Agrupación de jugadores según criterios definidos por la academia, como edad o nivel. |
| **Grupo** | Agrupación operativa de jugadores utilizada para organizar actividades. |
| **Equipo** | Conjunto organizado de jugadores que representa a la academia en actividades o competencias. |

> En el MVP v1, **grupo** y **categoría** pueden utilizarse conjuntamente según el modelo de organización de la academia. Su diferenciación podrá refinarse en futuras versiones.

## Actividades

| Término | Definición |
|---|---|
| **Actividad** | Evento deportivo programado por la academia. |
| **Entrenamiento** | Actividad destinada a la práctica y preparación deportiva de los jugadores. |
| **Competencia** | Actividad deportiva en la que participan jugadores o equipos frente a otros participantes. |
| **Convocatoria** | Comunicación dirigida a uno o más jugadores para solicitar la confirmación de participación en una actividad. |
| **Respuesta** | Confirmación registrada por el tutor respecto a la participación del jugador convocado. |
| **Confirmación** | Respuesta positiva del tutor indicando que el jugador participará en la actividad. |
| **Motivo** | Información proporcionada por el tutor cuando indica que el jugador no participará. |

## Gestión

| Término | Definición |
|---|---|
| **Matrícula** | Registro administrativo mediante el cual un jugador queda formalmente asociado a una academia. |
| **Pago** | Registro económico asociado a una obligación o concepto de la academia. |
| **Estado** | Condición actual de un registro dentro de un proceso determinado. |
| **Publicar convocatoria** | Acción mediante la cual una convocatoria queda disponible para ser compartida con los tutores. |
| **Enlace de convocatoria** | URL temporal utilizada por el tutor para consultar y responder una convocatoria. |

## Comunicación

| Término | Definición |
|---|---|
| **Mensaje de convocatoria** | Contenido generado por PlayerTech para comunicar una convocatoria al tutor. |
| **WhatsApp** | Canal externo utilizado en el MVP para compartir manualmente el mensaje y enlace de una convocatoria. |
| **Copiar y pegar** | Mecanismo utilizado en el MVP para transferir el mensaje generado desde PlayerTech al canal de comunicación utilizado por la academia. |

## Conceptos de evolución

| Término | Definición |
|---|---|
| **Multi-tenant** | Modelo en el que una misma plataforma permite gestionar múltiples academias manteniendo sus datos y operaciones aislados. |
| **SaaS** | Modelo de software en el que PlayerTech se ofrece como un servicio accesible desde la plataforma. |
| **Academia deportiva** | Concepto general que permite extender PlayerTech más allá del fútbol hacia disciplinas como vóley o básquet. |
| **Disciplina deportiva** | Deporte al que pertenece una academia o actividad, por ejemplo fútbol, vóley o básquet. |

## Reglas de lenguaje

- **Jugador** representa a la persona que participa en la actividad deportiva.
- **Tutor** representa al adulto responsable que actúa en nombre del jugador en determinados procesos.
- **Actividad** es el concepto general; **Entrenamiento** y **Competencia** son tipos de actividad.
- **Convocatoria** representa la solicitud de participación; **Respuesta** representa la decisión registrada por el tutor.
- **Confirmación de participación no significa asistencia**. La asistencia corresponde a un proceso diferente que no forma parte del MVP v1.
- Los términos del dominio deben mantenerse consistentes entre historias de usuario, interfaz, documentación y código.