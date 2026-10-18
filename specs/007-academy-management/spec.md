# Especificación de funcionalidad: Gestión de la academia

**Feature Branch**: `007-academy-management`

**Created**: 2026-10-18

**Status**: Draft

**Origen**: Épica **EP-09 — Gestión de la academia**: HU-032 (inicio) y HU-017 (consultar y editar el perfil de la academia). HU-018 (invitar usuarios) es MVP+ y queda fuera.

**Input**: Descripción del usuario: "academy-management: Completar EP-09 con HU-032 y HU-017. La tarjeta «Completa tu academia» con estado y progreso real; la pantalla de perfil de la academia para consultar y editar sus datos y su logo; revisión de experiencia y accesibilidad."

> Esta spec cubre dos HU de la misma épica (principio I) y referencia sus criterios en `docs/backlog/user-stories/`. Su usuario es el **owner de la academia**, que trabaja sobre todo desde el celular. Parte de la pantalla modelo de Inicio de la spec 003: el resumen ya muestra datos reales y «Completa tu academia» es una maqueta sin estado. La ruta del perfil de la academia es hoy un marcador de posición. Los datos, el almacenamiento de archivos y sus reglas de acceso ya existen (spec 001). Es la última épica de la Fase 1.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Editar el perfil de la academia (Prioridad: P1)

Como owner, quiero consultar y corregir los datos de mi academia, para mantener actualizada su identificación y su información de contacto.

**Motivo de prioridad**: El registro solo pide el nombre. Sin esta pantalla, el owner no puede completar su teléfono, dirección ni correo de contacto, que son tareas de «Completa tu academia».

**Prueba independiente**: Desde el celular, el owner abre el perfil, ve todos los datos y el plan, cambia varios y guarda; intenta guardar sin nombre y con un correo de contacto inválido; comprueba que su correo de inicio de sesión no cambia.

**Referencia**: CA-001 a CA-005 y CA-009 de HU-017.

**Escenarios de aceptación**:

1. **Dado** el perfil de la academia, **cuando** el owner lo abre, **entonces** se cumple CA-001 de HU-017: ve el nombre, el logo, el teléfono, el correo de contacto, la dirección, la ciudad y el plan.
2. **Dado** uno o varios datos cambiados, **cuando** guarda, **entonces** se cumple CA-002 de HU-017: se actualizan y ve una confirmación.
3. **Dado** el nombre vacío o solo con espacios, **cuando** intenta guardar, **entonces** se cumple CA-003 de HU-017.
4. **Dado** un correo de contacto con formato inválido, **cuando** intenta guardar, **entonces** se cumple CA-004 de HU-017.
5. **Dado** un correo de contacto nuevo, **cuando** guarda, **entonces** se cumple CA-005 de HU-017: el correo con el que inicia sesión no cambia.
6. **Dado** otra academia en PlayerTech, **cuando** el owner consulta o edita su perfil, **entonces** se cumple CA-009 de HU-017: solo ve y modifica la suya.

---

### Historia 2 - Logo de la academia (Prioridad: P1)

Como owner, quiero cargar, reemplazar o retirar el logo de mi academia, para que PlayerTech la identifique con su imagen.

**Motivo de prioridad**: El logo identifica a la academia en el inicio y es una tarea de «Completa tu academia».

**Prueba independiente**: El owner carga un logo válido, lo reemplaza por otro, intenta cargar un archivo inválido (formato o tamaño) y lo retira.

**Referencia**: CA-006 a CA-008 de HU-017; DEC-22 y reglas del logo de HU-017 (actualizadas el 2026-10-18).

**Escenarios de aceptación**:

1. **Dado** una imagen JPG o PNG de hasta 5 MB, **cuando** el owner la carga, **entonces** se cumple CA-006 de HU-017: queda como logo y, si había uno, lo reemplaza.
2. **Dado** un archivo que no es JPG ni PNG o que pesa más de 5 MB, **cuando** intenta cargarlo, **entonces** se cumple CA-007 de HU-017: se explica el problema y se conserva el logo actual.
3. **Dado** que la academia tiene logo, **cuando** el owner lo retira, tras confirmarlo, **entonces** se cumple CA-008 de HU-017: queda sin logo y el inicio muestra las iniciales.
4. **Dado** que se reemplaza o retira un logo, **cuando** termina la operación, **entonces** la imagen anterior se borra del almacenamiento y su registro queda con fecha de borrado (regla de HU-017).
5. **Dado** una imagen válida grande (por ejemplo, una foto del celular), **cuando** el owner la carga, **entonces** se guarda redimensionada y comprimida, sin que el owner tenga que prepararla.

---

### Historia 3 - «Completa tu academia» con progreso real (Prioridad: P1)

Como owner, quiero ver en el inicio qué me falta configurar y cuánto llevo, para saber por dónde seguir.

**Motivo de prioridad**: Es la guía del owner tras registrarse. Hoy es una maqueta.

**Prueba independiente**: Con una academia recién registrada, el inicio muestra «1 de 4». Al completar la dirección de la sede principal, el logo y los datos de contacto, el progreso avanza y, con todo completo, la tarjeta desaparece.

**Referencia**: CA-001 a CA-004 de HU-032; reglas de HU-032 (tareas actualizadas el 2026-10-18).

**Escenarios de aceptación**:

1. **Dado** que el owner inicia sesión, **cuando** ve el inicio, **entonces** se cumple CA-001 de HU-032 (ya construido en la spec 003; se verifica): nombre, logo o iniciales, plan y sede principal.
2. **Dado** que faltan datos recomendados, **cuando** ve el inicio, **entonces** se cumple CA-002 de HU-032: la tarjeta muestra cada tarea como completa o pendiente y el progreso «n de 4».
3. **Dado** una tarea pendiente, **cuando** el owner toca su enlace, **entonces** se cumple CA-003 de HU-032: llega a la pantalla donde la completa (Sedes para la sede principal; perfil de la academia para el logo y los datos de contacto).
4. **Dado** que las cuatro tareas están completas, **cuando** ve el inicio, **entonces** se cumple CA-004 de HU-032: la tarjeta no se muestra.

**Tareas** (regla de HU-032, actualizada el 2026-10-18):

| Tarea | Completa cuando | Lleva a |
|---|---|---|
| Academia creada | Siempre | — |
| Dirección de la sede principal | La sede principal tiene dirección | Sedes |
| Logo de la academia | La academia tiene logo | Perfil de la academia |
| Teléfono y dirección de la academia | La academia tiene teléfono y dirección de contacto | Perfil de la academia |

La dirección de la academia (de contacto, en el perfil) y la de la sede principal (en Sedes) son datos distintos: cada tarea nombra la suya y el campo del perfil lo explica.

---

### Historia 4 - Pantallas revisadas (Prioridad: P2)

Como owner, quiero que el perfil y el inicio sean claros y cómodos en el celular.

**Motivo de prioridad**: Principio XIII.

**Prueba independiente**: Se revisan el perfil y el inicio a 360 px y en escritorio, en modo claro y oscuro.

**Escenarios de aceptación**:

1. **Dado** el perfil o el inicio, **cuando** se revisan, **entonces** no hay hallazgos críticos ni altos sin resolver, no hay desplazamiento horizontal a 360 px y los controles miden al menos 44 px.

---

### Edge Cases

- **Cambios sin guardar**: al ir a otra pantalla de PlayerTech con cambios sin guardar se pide confirmación; sin cambios, se sale sin preguntar. Cerrar o recargar la pestaña no pide confirmación.
- **Espacios al inicio o al final**: se ignoran en todos los campos; un campo opcional que queda vacío se guarda sin valor.
- **Doble toque en «Guardar» o en una acción del logo**: no se aplica dos veces.
- **Fallo al subir el logo**: se conserva el logo actual y se puede reintentar; no queda un logo a medias.
- **Sin conexión o fallo del servidor al guardar**: el formulario conserva lo escrito y muestra un mensaje en español.
- **Datos cambiados en otra pestaña**: al guardar, la pantalla queda con los datos actuales; no se muestra un error técnico.
- **Imagen con extensión correcta pero contenido inválido**: se rechaza como formato no admitido.
- **Textos largos** (nombre, dirección): no rompen el perfil ni el inicio.
- **Inicio tras editar el perfil o la sede**: el resumen y la tarjeta reflejan los cambios al volver, sin recargar la página.
- **Sede principal sin dirección pero con ciudad**: la tarea sigue pendiente (la regla pide dirección).

## Requirements *(mandatory)*

### Functional Requirements

**Perfil de la academia (HU-017)**

- **FR-001**: El owner DEBE poder consultar el nombre, el logo, el teléfono, el correo de contacto, la dirección, la ciudad y el plan de su academia (CA-001).
- **FR-002**: El owner DEBE poder editar el nombre, el teléfono, el correo de contacto, la dirección y la ciudad; al guardar, DEBE ver una confirmación (CA-002, DEC-21).
- **FR-003**: El nombre DEBE ser obligatorio; el resto de datos, opcional (CA-003).
- **FR-004**: El correo de contacto, si se ingresa, DEBE tener formato de correo válido (CA-004).
- **FR-005**: Cambiar el correo de contacto NO DEBE cambiar el correo de inicio de sesión (CA-005, DEC-21).
- **FR-006**: El plan DEBE mostrarse solo como consulta. El país y la zona horaria no se muestran (reglas de HU-017).
- **FR-007**: Las validaciones DEBEN mostrarse junto al campo, en español, al salir del campo y al guardar.
- **FR-007a**: El campo de dirección del perfil DEBE indicar que es la dirección de contacto de la academia y que las de las sedes se editan en Sedes.
- **FR-008**: Salir con cambios sin guardar DEBE pedir confirmación.

**Logo (HU-017, DEC-22)**

- **FR-009**: El owner DEBE poder cargar un logo JPG o PNG de hasta 5 MB; si había uno, lo reemplaza (CA-006).
- **FR-009a**: Antes de guardarlo, el logo DEBE redimensionarse (lado mayor de 512 px como máximo, sin agrandar imágenes menores) y comprimirse conservando su formato; lo guardado NO DEBE superar 1 MB (DEC-22).
- **FR-010**: Un archivo que no sea JPG o PNG, o que supere 5 MB, DEBE rechazarse con un mensaje claro, conservando el logo actual (CA-007).
- **FR-011**: El owner DEBE poder retirar el logo tras una confirmación (CA-008).
- **FR-012**: Al reemplazar o retirar el logo, la imagen anterior DEBE borrarse del almacenamiento y su registro DEBE conservarse con fecha de borrado (DEC-22, excepción de ADR-013).

**«Completa tu academia» (HU-032)**

- **FR-013**: El inicio DEBE mostrar la tarjeta con las cuatro tareas, el estado de cada una (completa o pendiente) y el progreso «n de 4» según la tabla de la Historia 3 (CA-002).
- **FR-014**: Cada tarea pendiente DEBE enlazar con la pantalla donde se completa (CA-003).
- **FR-015**: Con las cuatro tareas completas, la tarjeta NO DEBE mostrarse (CA-004). La tarjeta es informativa y no bloquea el uso de PlayerTech.
- **FR-016**: El inicio DEBE reflejar los cambios del perfil y de las sedes al volver a él, sin recargar la página.

**Seguridad, experiencia y verificación**

- **FR-017**: Toda lectura y escritura DEBE depender de la autorización de la base de datos: solo el owner de la academia la modifica, y nunca se accede a datos de otra academia (CA-009, ADR-012).
- **FR-018**: Las pantallas DEBEN cumplir `DESIGN.md` y `ui.md`, con controles de al menos 44 px y sin desplazamiento horizontal a 360 px, en modo claro y oscuro, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-019**: Cada criterio de HU-017 y HU-032 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Academia**: nombre, logo, teléfono, correo de contacto, dirección, ciudad, plan (consulta). Pertenece a su owner por la membresía.
- **Logo**: imagen JPG o PNG asociada a la academia, guardada redimensionada y comprimida; de las versiones anteriores solo queda el registro, sin imagen.
- **Tarea de «Completa tu academia»**: nombre, estado (completa o pendiente) y pantalla donde se completa. El estado se calcula a partir de los datos de la academia y de su sede principal.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un owner completa los datos de contacto desde el celular en menos de 2 minutos, desde tocar la tarea en el inicio hasta ver la confirmación.
- **SC-002**: El 100 % de los intentos de guardar sin nombre o con un correo de contacto inválido se rechazan junto al campo, sin modificar datos.
- **SC-003**: El 100 % de los archivos inválidos (formato o tamaño) se rechazan y el logo anterior se conserva.
- **SC-003a**: Cada academia ocupa en el almacenamiento solo su logo vigente, y un logo guardado pesa normalmente menos de 200 KB en JPG y menos de 500 KB en PNG.
- **SC-004**: El progreso de «Completa tu academia» coincide con el estado real de los datos en el 100 % de las combinaciones de tareas completas y pendientes, y la tarjeta desaparece con las cuatro completas.
- **SC-005**: Ningún owner puede ver ni modificar el perfil ni el logo de otra academia (verificado con las dos academias del seed).
- **SC-006**: A 360 px no hay desplazamiento horizontal en el perfil ni en el inicio, todos los controles miden al menos 44 px y la auditoría de accesibilidad no deja hallazgos críticos.
- **SC-007**: Las pruebas existentes siguen en verde y cada criterio de HU-017 y HU-032 tiene al menos una prueba automática o un paso de validación documentado.

## Assumptions

- La base de datos de la spec 001 ya tiene los campos de la academia, el registro de archivos con borrado lógico, el almacenamiento con sus políticas por academia y la escritura solo del owner. No se esperan migraciones salvo que el plan detecte un hueco.
- El acceso a archivos pasa por la abstracción de almacenamiento existente (ADR-013), que se amplía para borrar la imagen de un archivo conservando su registro.
- El logo se redimensiona y comprime en el navegador, sin recorte: se conserva la proporción de la imagen (decisión del 2026-10-18, por la capacidad de almacenamiento).
- Retirar el logo pide confirmación porque deja la academia sin imagen; guardar los datos no la pide.
- El único rol con escritura en el MVP es el owner.
- Durante el desarrollo se corren solo las pruebas de las zonas tocadas; el conjunto completo, una vez antes del commit.
- Se aplican las reglas de portabilidad de ADR-017: sin usos nuevos de `auth.uid()` fuera de las funciones de autorización ni referencias nuevas al esquema `auth`.
- Quedan fuera de alcance: cambio de plan, cambio del correo de inicio de sesión, eliminar o suspender la academia, asistente de configuración, ocultar la tarjeta manualmente, métricas, invitar usuarios (HU-018) e información de negocio de la Fase 2 en el inicio.
