# Flujo de convocatoria y respuesta del acudiente

> **Decisión de la ideación de la Fase 2 (2026-10-18).** DEC-31 y DEC-33 de `docs/architecture/decisions.md` (ADR-018): un enlace por grupo, identificación del acudiente en el primer uso, validación del owner, dispositivo recordado y hasta 3 cambios de respuesta.

## Objetivo

Reemplazar el mensaje que el administrador escribe a mano en el grupo de WhatsApp de cada categoría por **un mensaje generado automáticamente, con un solo enlace por grupo**. Los padres no necesitan estar registrados de antemano, y siempre se sabe quién respondió.

## Diagrama de secuencia

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant PT as PlayerTech
    participant WA as Grupo de WhatsApp<br/>(Sub-12)
    actor P as Papá<br/>(celular)
    actor M as Mamá<br/>(celular)

    Note over O,PT: Preparación: el owner ya registró a los jugadores y el grupo Sub-12

    O->>PT: Crea la actividad "Entrenamiento martes 4:00 p. m., Sede Norte" para Sub-12
    PT-->>O: Convocatoria con los jugadores de Sub-12 (ajustable)
    O->>PT: Toca "Compartir"
    PT-->>O: Mensaje generado con un enlace del grupo
    O->>WA: Elige el grupo Sub-12 y envía (un solo mensaje)

    rect rgb(235, 242, 255)
    Note over P,PT: Caso 1: primera vez (el papá no está registrado)
    WA-->>P: Llega el mensaje con el enlace
    P->>PT: Abre el enlace
    PT-->>P: "Entrenamiento Sub-12 · martes 4:00 p. m. · Sede Norte"<br/>¿Por quién respondes? Juan P. · Samuel V. · Samu · Mateo R. …
    alt Su jugador está en la lista
        P->>PT: Elige "Juan P."
        PT-->>P: Tu nombre y tu celular
        P->>PT: "Carlos Pérez", 300…
        PT-->>P: Juan P. · ¿Asiste? Sí / Sí, provisional / No
        P->>PT: Sí
        PT->>PT: Guarda la respuesta y el acudiente pendiente de validar<br/>Recuerda este dispositivo
        PT-->>P: ¡Listo! Respuesta registrada (puedes cambiarla hasta el cierre)
    else No está en la lista
        PT-->>P: ¿No ves a tu jugador? Escribe al owner de la academia
    end
    end

    rect rgb(255, 245, 230)
    Note over O,PT: Validación del owner (una sola vez por acudiente)
    O->>PT: Abre el seguimiento de la convocatoria
    PT-->>O: Juan Pérez: Sí · respondió Carlos Pérez (papá, sin validar)<br/>[Validar] [Rechazar]
    alt Es su acudiente
        O->>PT: Validar
        PT->>PT: Carlos queda como acudiente de Juan
    else No lo es
        O->>PT: Rechazar
        PT->>PT: Se descarta el vínculo y la respuesta
    end
    end

    rect rgb(235, 250, 240)
    Note over M,PT: La mamá también está en el grupo
    WA-->>M: Mismo mensaje y enlace
    M->>PT: Abre el enlace (primera vez, igual que el papá)
    PT-->>M: Juan Pérez · ¿Asiste?
    M->>PT: No · motivo "Enfermedad o lesión"
    PT->>PT: Vale la última respuesta (cambio 1 de 3, DEC-33)<br/>Guarda quién y cuándo · mamá pendiente de validar
    end

    O->>PT: Abre el seguimiento
    PT-->>O: Juan Pérez: No · Enfermedad o lesión · mamá 2:10 p. m.<br/>(antes: papá, Sí, 9:30 a. m.)

    rect rgb(245, 240, 255)
    Note over P,PT: Caso 2: siguientes convocatorias (dispositivo recordado)
    O->>WA: Nuevo mensaje generado (partido sábado)
    WA-->>P: Enlace
    P->>PT: Abre el enlace
    PT->>PT: Reconoce la llave del dispositivo de Carlos (validado)<br/>Un dispositivo nuevo volvería a quedar pendiente de validar
    PT-->>P: Juan Pérez · Partido sábado · ¿Asiste? Sí / Sí, provisional / No
    P->>PT: Sí, provisional · motivo "Horario (colegio o trabajo)"
    PT-->>P: ¡Listo!
    end

    Note over O,M: Tras 3 cambios, la respuesta de ese jugador queda fija (escribir al owner).<br/>Al cierre (fecha límite o inicio de la actividad), el enlace ya no admite respuestas.<br/>Una respuesta provisional queda como provisional (DEC-38).
```

## Cómo leerlo

| Bloque | Qué muestra |
|---|---|
| Preparación | El owner crea la actividad para un grupo y comparte **un solo mensaje** generado en el grupo de WhatsApp |
| Azul: primera vez | El padre elige a su jugador en la lista de convocados (nombre e inicial del apellido), escribe su nombre y su celular, y responde de inmediato |
| Naranja: validación | El owner valida o rechaza con un toque el vínculo de cada acudiente nuevo, solo la primera vez |
| Verde: segundo acudiente | La mamá se vincula por su cuenta. Vale la última respuesta y el owner ve quién respondió y el historial |
| Morado: siguientes veces | El dispositivo recordado (una llave secreta, no el celular) lleva directo a responder. Un dispositivo nuevo vuelve a quedar pendiente de validar |

## Reglas que refleja

- **Un mensaje por grupo** con un solo enlace; sin mensajes individuales.
- **Sin registro previo de los padres**: el vínculo nace en el primer uso.
- **Cada acudiente tiene su propio vínculo**: siempre se sabe quién respondió.
- **Identificación sin códigos**: enlace secreto del grupo, validación del owner de cada vínculo y dispositivo nuevo, y una llave secreta en el dispositivo. El celular es solo contacto (DEC-31).
- **Respuestas**: Sí, Sí provisional o No, con un motivo opcional de una lista fija en las dos últimas; *Otro* pide texto (DEC-38). Hasta 3 cambios por jugador, siempre antes del cierre (DEC-33).
- **Privacidad de menores**: la lista muestra solo el nombre y la inicial del apellido. El enlace es secreto y caduca al cierre. Sin código de familia (DEC-31).
- **Respuestas sin validar**: se distinguen en el seguimiento hasta que el owner las valida.
