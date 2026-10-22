# Especificación de funcionalidad: Avisos en la aplicación

**Feature Branch**: `014-in-app-notices`

**Created**: 2026-10-21

**Status**: Draft

**Origen**: Spec 4b de la **Fase 2 — Negocio** (ADR-018, DEC-37 y DEC-46). Épica **EP-07** (seguimiento): HU-041.

**Input**: Descripción del usuario: "in-app-notices: un contador en «Actividades» con los acudientes por validar, un aviso en el inicio con los pendientes y las respuestas nuevas de cada convocatoria, y un drawer para validar o rechazar todos los pendientes de la academia sin buscar la actividad. Maquetas de baja fidelidad antes de implementar."

> Esta spec cubre una HU (principio I) y referencia sus criterios en `docs/backlog/user-stories/HU-041-in-app-notices.md`. Su usuario es el **owner de la academia**, sobre todo desde el celular. Completa el flujo de la spec 013: el owner ya no tiene que abrir cada actividad para saber qué respondieron ni a quién validar. Decisiones: DEC-41, DEC-46 y DEC-47 (ADR-018).

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Saber al instante si hay que validar a alguien (Prioridad: P1)

Como owner, quiero ver en la navegación cuántos acudientes esperan validación, para atenderlos sin revisar cada actividad.

**Motivo de prioridad**: Validar es la protección de la identificación sin códigos (SEC-03); un pendiente olvidado deja respuestas «sin validar».

**Prueba independiente**: Con dos personas identificadas desde un enlace y sin validar, el owner ve «2» junto a «Inicio» en el celular; al validarlas, el contador desaparece.

**Referencia**: CA-001 de HU-041; DEC-47.

**Escenarios de aceptación**:

1. **Dado** pendientes de validar, **cuando** el owner navega, **entonces** se cumple CA-001 de HU-041.
2. **Dado** que no quedan pendientes, **entonces** el contador no se muestra.

---

### Historia 2 - Avisos en el inicio (Prioridad: P1)

Como owner, quiero que el inicio me diga a quién validar y qué convocatorias tienen respuestas que no he visto.

**Motivo de prioridad**: Es la primera pantalla tras iniciar sesión; reemplaza revisar el grupo de WhatsApp para saber quién respondió.

**Prueba independiente**: El owner entra al inicio y ve «2 acudientes por validar» y «5 respuestas nuevas en el partido del sábado»; toca el segundo, llega a la actividad, vuelve al inicio y ese aviso ya no está.

**Referencia**: CA-002 y CA-003 de HU-041; DEC-47.

**Escenarios de aceptación**:

1. **Dado** pendientes o respuestas nuevas, **cuando** abre el inicio, **entonces** se cumple CA-002 de HU-041.
2. **Dado** una convocatoria con respuestas nuevas, **cuando** abre su actividad, **entonces** se cumple CA-003 de HU-041.

---

### Historia 3 - Validar todos los pendientes de una vez (Prioridad: P1)

Como owner, quiero validar o rechazar a todos los pendientes de la academia desde un solo lugar.

**Motivo de prioridad**: Ahorra entrar a cada actividad o ficha cuando hay varias personas nuevas (típico la primera semana).

**Prueba independiente**: Desde el aviso «3 acudientes por validar», el owner abre el drawer, valida a dos y rechaza a uno, con su confirmación; el contador y el aviso se actualizan.

**Referencia**: CA-004 de HU-041; HU-040.

**Escenarios de aceptación**:

1. **Dado** el aviso de pendientes, **cuando** lo toca, **entonces** se cumple CA-004 de HU-041.
2. **Dado** el drawer, **cuando** valida o rechaza, **entonces** se cumplen CA-001 a CA-003 de HU-040 y el contador baja.

---

### Historia 4 - Pantallas revisadas y aprobadas (Prioridad: P2)

Como owner, quiero que estos avisos se vean claros en el celular, y el responsable quiere aprobar su diseño antes de construirlos.

**Motivo de prioridad**: Principio XIII y aprobación de maquetas antes de implementar.

**Prueba independiente**: El responsable aprueba las maquetas; al implementar, se revisan a 360 px y en escritorio, en claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el plan, **cuando** el responsable revisa las maquetas (navegación con contador, inicio con avisos, drawer de pendientes), **entonces** las aprueba o pide cambios.
2. **Dado** las pantallas implementadas, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Convocatoria nunca abierta por el owner**: todas sus respuestas cuentan como nuevas.
- **El owner registra él mismo una respuesta**: no cuenta como nueva para él.
- **Respuesta rechazada**: deja de contar como nueva.
- **Respuestas de un jugador quitado**: no cuentan como nuevas.
- **Convocatoria cerrada o actividad cancelada**: sus respuestas nuevas se avisan hasta que el owner abre la actividad; una actividad eliminada no genera avisos.
- **Muchas convocatorias con respuestas nuevas**: el inicio muestra las 5 más próximas y «Ver más» para el resto (supuesto aprobado el 2026-10-21).
- **Pendiente validado desde otra pantalla** (seguimiento o ficha): el contador y el aviso se actualizan al navegar.
- **Varios dispositivos del mismo acudiente pendientes**: cada uno cuenta como un pendiente, como en la ficha del jugador.
- **Contadores grandes**: a partir de 100 se muestra «99+».

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La navegación DEBE mostrar junto a «Inicio» (ajuste del 2026-10-22) el número de acudientes y dispositivos pendientes de validar de la academia actual; sin pendientes, no muestra nada. Las respuestas nuevas NO DEBEN sumar al contador (DEC-47).
- **FR-002**: El inicio DEBE mostrar un aviso «N acudientes por validar» cuando haya pendientes, que abre el drawer de pendientes.
- **FR-003**: El inicio DEBE mostrar un aviso por cada convocatoria con respuestas nuevas («N respuestas nuevas en …», con la actividad y su fecha), que lleva a esa actividad.
- **FR-004**: Una respuesta es nueva para el owner si se registró después de la última vez que él abrió la actividad de esa convocatoria, si la dio un acudiente (no el propio owner), si cuenta (no rechazada) y si el jugador sigue convocado.
- **FR-005**: Al abrir la actividad de una convocatoria, sus respuestas DEBEN quedar vistas para ese owner.
- **FR-006**: El drawer de pendientes DEBE listar todos los pendientes de la academia agrupados por persona (una tarjeta por celular nuevo, con los vínculos nuevos y los jugadores que ya acompaña; ajuste del 2026-10-22), con lo que muestra el bloque «Por validar» de la ficha (nombre declarado, parentesco, celular, cuándo y la coincidencia de celular), y permitir «Validar» y «Rechazar» (con confirmación) con la misma operación de HU-040.
- **FR-007**: El contador y los avisos DEBEN actualizarse al navegar, al volver a la aplicación y tras validar o rechazar; no hay actualización en vivo (DEC-46).
- **FR-008**: La marca de «visto» DEBE ser por owner y por convocatoria, y quedar aislada por academia: ningún owner ve ni altera la de otro.
- **FR-009**: Cada operación exitosa DEBE confirmarse con un mensaje breve; los errores DEBEN mostrarse en español sin detalles técnicos.
- **FR-010**: Antes de implementar, el plan DEBE incluir maquetas de baja fidelidad (navegación con contador, inicio con avisos, drawer de pendientes) para la aprobación del responsable.
- **FR-011**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px, sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-012**: Cada criterio de HU-041 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Visita a una convocatoria**: por owner y convocatoria, cuándo la vio por última vez. Nueva.
- **Pendiente de validar**: vínculo o dispositivo pendiente (spec 013); ya existe.
- **Respuesta nueva**: respuesta de un acudiente posterior a la última visita (spec 013); se calcula, no se guarda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier pantalla, el owner sabe si hay pendientes de validar sin hacer ningún toque.
- **SC-002**: El owner valida o rechaza a 3 pendientes de distintas actividades en menos de 1 minuto desde el inicio, sin abrir ninguna actividad.
- **SC-003**: El owner llega a una convocatoria con respuestas nuevas con un toque desde el inicio.
- **SC-004**: El 100 % de los avisos de respuestas nuevas desaparecen tras abrir la actividad correspondiente, y ninguno cuenta respuestas registradas por el propio owner.
- **SC-005**: Ningún owner ve pendientes, respuestas ni marcas de visto de otra academia (verificado con las academias del seed y pruebas de base de datos).
- **SC-006**: El responsable aprueba las maquetas antes de implementar; a 360 px no hay desplazamiento horizontal, los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.

## Assumptions

- Las respuestas, los pendientes y la validación ya existen (spec 013); esta spec solo los resume y los hace visibles.
- Hace falta una tabla nueva para las visitas a cada convocatoria, con las reglas de ADR-012 y ADR-017. La define el plan.
- Un owner puede pertenecer a varias academias: el contador y los avisos son de la academia actual.
- «Respuestas nuevas» se calcula con la hora del servidor.
- El inicio conserva lo que ya muestra (por ejemplo, «Completa tu academia»); los avisos se suman arriba.
- Durante el desarrollo y antes del commit se corren solo las pruebas de la spec.
- Fuera de alcance: notificaciones push (T-03), correo, actualización en vivo, avisos para otros roles y un historial de avisos.
