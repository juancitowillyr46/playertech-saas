# HU-034 — Acudientes del jugador

**Épica:** EP-10 — Gestión de acudientes · **Fase:** 2 — Negocio · **Prioridad:** MVP · **Estado:** Definida
**Spec:** spec 1 de la Fase 2 (jugadores, acudientes y grupos)

## Historia de usuario

> Como **owner**, quiero registrar a los acudientes de un jugador cuando ya los conozco, para que sus respuestas a las convocatorias cuenten desde el principio como validadas.

## Criterios de aceptación

### CA-001 — Agregar acudiente
**Dado** la ficha de un jugador,
**cuando** el owner agrega un acudiente con nombre, celular y parentesco (mamá, papá, abuelo o abuela, u otro) y guarda,
**entonces** el acudiente queda **vinculado y validado** con ese jugador y aparece en su ficha.

### CA-002 — Datos obligatorios y celular válido
**Dado** que falta el nombre, el celular o el parentesco, o el celular no tiene el formato colombiano (10 dígitos que empiezan por 3),
**cuando** el owner intenta guardar,
**entonces** el campo lo indica y no se guarda nada.

### CA-003 — Acudiente que ya existe (hermanos)
**Dado** que el celular escrito pertenece a un acudiente ya registrado en la academia,
**cuando** el owner guarda,
**entonces** no se crea otra persona: se ofrece **vincular a ese acudiente** con este jugador (por ejemplo, el papá de dos hermanos).

### CA-004 — Varios acudientes
**Dado** un jugador con un acudiente,
**cuando** el owner agrega otro (por ejemplo, la mamá y el papá),
**entonces** ambos quedan vinculados, cada uno con su propio registro.

### CA-005 — Editar y retirar
**Dado** un acudiente vinculado,
**cuando** el owner edita sus datos, o lo retira de ese jugador y confirma,
**entonces** se actualiza, o deja de estar vinculado con ese jugador. Si no le quedan jugadores, deja de mostrarse (borrado lógico).

### CA-006 — Autorización de datos
**Dado** que el owner registra los datos de un acudiente,
**cuando** guarda,
**entonces** debe marcar que **cuenta con la autorización del acudiente** para tratar sus datos (Ley 1581); sin esa marca no se guarda.

### CA-007 — Aislamiento
**Dado** que existen otras academias,
**cuando** el owner gestiona acudientes,
**entonces** solo ve y modifica los de su academia.

## Reglas de negocio

- Modelo de acudiente, vínculo y dispositivo (DEC-40). Un vínculo creado por el owner nace **validado**. El primer dispositivo desde el que ese acudiente responda quedará pendiente una vez (DEC-31, spec 4).
- Un acudiente puede tener varios jugadores y un jugador varios acudientes.
- El celular identifica a la persona dentro de la academia para no duplicarla; **no** verifica su identidad (DEC-31).
- La autorización de datos registra la versión de la Política vigente y la hora (DEC-39). Cuando el owner registra al acudiente, declara haber obtenido su autorización.

## Fuera de alcance (spec 4)

- Acudientes que nacen desde el enlace de una convocatoria.
- Validar o rechazar vínculos y dispositivos pendientes.
- Avisos de acudientes por validar.

## Decisiones relacionadas

ADR-018: DEC-30, DEC-31, DEC-39 y DEC-40.
