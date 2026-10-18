# Glosario

Este documento define los términos utilizados en PlayerTech para mantener un lenguaje común entre producto, diseño y desarrollo.

## Producto y organización

| Término | Definición |
|---|---|
| **PlayerTech** | Plataforma SaaS para la gestión de academias deportivas. |
| **Academia** | Organización deportiva que utiliza PlayerTech para gestionar sus operaciones. Representa un tenant de la plataforma desde el MVP. El escenario inicial corresponde a una academia de fútbol. |
| **Tenant** | Organización o academia aislada dentro de la arquitectura multi-tenant de PlayerTech. |
| **Membresía de academia** | Relación que vincula a un usuario autenticado con una academia y determina su pertenencia al tenant. |
| **Administrador** | Usuario responsable de gestionar la información y operación de la academia dentro de la plataforma. En el MVP corresponde al Owner. |
| **Owner** | Rol del usuario que registró la academia. Es el único rol del MVP y tiene control total sobre su academia. Cada academia tiene exactamente un owner. |
| **Visitante** | Persona sin sesión que puede registrar una nueva academia. |
| **Entrenador** | Persona responsable de dirigir actividades deportivas y trabajar con los jugadores. |
| **Acudiente** | Persona responsable de uno o más jugadores (madre, padre u otro familiar) que responde convocatorias en su representación. Es el término de la interfaz en Colombia (DEC-30); en documentos anteriores aparece como *tutor*. |
| **Cancha externa** | Lugar que no pertenece a la academia, normalmente donde se juegan torneos, guardado en el catálogo de canchas de la academia para reutilizarlo en actividades (DEC-32). |
| **Jugador** | Persona que participa en las actividades deportivas de una academia. |

## Plataforma SaaS

| Término | Definición |
|---|---|
| **Registro de academia** | Proceso autoservicio mediante el cual un visitante crea una academia y su cuenta de owner. |
| **Estado de la academia** | Condición que determina si la academia puede operar: `activa` o `suspendida`. Una academia suspendida conserva sus datos, pero no puede operar. |
| **Plan** | Nivel de servicio de PlayerTech: Free, Pro o Advanced. En el MVP todas las academias usan Free, sin límites. |
| **Suscripción** | Relación entre una academia y el plan que tiene contratado. |
| **Aceptación legal** | Registro auditado de que un usuario aceptó una versión concreta de los Términos y Condiciones o de la Política de Tratamiento de Datos Personales. |
| **Correo de contacto** | Correo público de la academia. Se inicializa con el correo del registro y puede cambiarse sin afectar al correo de inicio de sesión. |
| **Sede** | Lugar físico de la academia: una oficina o un lugar de entrenamiento. No separa datos ni permisos. |
| **Sede principal** | Sede de referencia de la academia. Se crea en el registro, siempre está activa y existe exactamente una por academia. |
| **Desactivar** | Acción reversible que deja un registro fuera de uso sin eliminarlo; sigue visible y puede reactivarse. |
| **Borrado lógico** | Eliminación de un registro de la interfaz sin borrarlo físicamente de la base de datos; se conserva su historial. |

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
| **Confirmación** | Respuesta positiva del acudiente indicando que el jugador participará en la actividad. |
| **Confirmación provisional** | Respuesta «Sí, provisional»: el jugador probablemente participará, pero depende de algo que el acudiente puede explicar en un comentario (DEC-38). |
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
