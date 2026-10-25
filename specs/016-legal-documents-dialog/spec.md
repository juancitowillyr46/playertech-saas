# Especificación de funcionalidad: Documentos legales en la aplicación

**Feature Branch**: `016-legal-documents-dialog`

**Created**: 2026-10-25

**Status**: Draft

**Origen**: Spec 6 de la **Fase 2 — Negocio**, requisito «Antes del piloto» (ADR-018, DEC-49). Épica **EP-00** (alta de academia): HU-043.

**Input**: Descripción del usuario: "legal-documents-dialog: los Términos y Condiciones y la Política de Tratamiento de Datos se leen en un dialog, sin salir del formulario, en el registro, en la autorización del acudiente y en la respuesta pública; un archivo por versión; borrador base para Colombia con marcadores."

> Esta spec cubre una HU (principio I) y referencia sus criterios en `docs/backlog/user-stories/HU-043-legal-documents-dialog.md`. Sus usuarios son el **owner** (al registrarse o al registrar un acudiente) y el **acudiente** que responde desde el enlace público sin sesión, desde el celular. Decisión: DEC-49 (ADR-018). Hoy los enlaces abren una dirección provisional que no existe.

## Escenarios de usuario y pruebas *(mandatory)*

### Historia 1 - Leer los documentos en el registro (Prioridad: P1)

Como persona que registra su academia, quiero leer los Términos y Condiciones y la Política de Tratamiento de Datos sin salir del registro, para aceptarlos sabiendo qué acepto.

**Motivo de prioridad**: Es el primer contacto de una academia real (piloto) y la aceptación tiene efectos legales.

**Prueba independiente**: En el registro, con los campos ya escritos, la persona toca «Términos y Condiciones», lee el texto, cierra el dialog y encuentra sus datos intactos y la casilla sin marcar.

**Referencia**: CA-001 a CA-004 de HU-043; CA-004 de HU-014.

**Escenarios de aceptación**:

1. **Dado** el registro, **cuando** toca el nombre de un documento, **entonces** se cumple CA-001 de HU-043.
2. **Dado** el dialog abierto, **cuando** lo cierra, **entonces** se cumple CA-002 de HU-043.
3. **Dado** un documento vigente, **cuando** se muestra y luego se acepta, **entonces** se cumple CA-003 de HU-043.
4. **Dado** que el texto no carga, **entonces** se cumple CA-004 de HU-043.

---

### Historia 2 - Leer la política al autorizar los datos de un acudiente (Prioridad: P1)

Como owner que registra un acudiente en la ficha del jugador, o como acudiente que se identifica desde el enlace de la convocatoria, quiero leer la Política de Tratamiento de Datos en la misma pantalla antes de autorizar.

**Motivo de prioridad**: La autorización de datos del acudiente (y de los datos del menor) se pide en esos dos sitios.

**Prueba independiente**: En la ficha del jugador, al agregar un acudiente, y en la respuesta pública sin sesión, tocar «Política de Tratamiento de Datos» abre el dialog con el texto; al cerrarlo, el formulario sigue como estaba.

**Referencia**: CA-001 a CA-004 de HU-043; specs 009 y 013.

**Escenarios de aceptación**:

1. **Dado** la autorización del acudiente en la ficha o en la respuesta pública, **cuando** toca la política, **entonces** se cumplen CA-001 y CA-002 de HU-043.
2. **Dado** la respuesta pública sin sesión, **cuando** abre la política, **entonces** el texto se muestra igual que con sesión.

---

### Historia 3 - Texto base de los documentos (Prioridad: P1)

Como responsable de PlayerTech, quiero un borrador base de los dos documentos, adecuado para Colombia, para revisarlo con un abogado antes del piloto.

**Motivo de prioridad**: Sin texto, el dialog no tiene qué mostrar.

**Prueba independiente**: Los dos documentos de la versión vigente se pueden leer completos, con sus secciones, y muestran como marcadores los datos del responsable que faltan.

**Referencia**: Reglas de negocio de HU-043; DEC-49.

**Escenarios de aceptación**:

1. **Dado** la Política de Tratamiento de Datos, **cuando** se lee, **entonces** identifica al responsable y al encargado, las finalidades, los derechos del titular, el procedimiento para ejercerlos, el tratamiento de datos de menores y la vigencia.
2. **Dado** los Términos y Condiciones, **cuando** se leen, **entonces** cubren el objeto del servicio, la cuenta, las obligaciones de la academia, el plan gratuito, la responsabilidad, la terminación y la ley aplicable.

### Edge Cases

- **Texto largo en el celular**: se desplaza dentro del dialog; el botón «Cerrar» siempre está visible.
- **Sin conexión o el archivo no existe**: mensaje en español y enlace para abrirlo en otra pestaña (CA-004 de HU-043).
- **Abrir dos veces**: la segunda vez no vuelve a descargar el texto si ya lo tiene.
- **Versión nueva publicada mientras alguien está en el formulario**: se muestra y se registra la versión que la pantalla cargó; aceptar una versión nueva otra vez queda fuera de alcance.
- **Cuentas de prueba que aceptaron la versión anterior**: conservan su aceptación de esa versión; no se les pide aceptar la nueva.
- **Acceso directo a la dirección del documento**: se puede abrir como página, sin sesión.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En el registro, en la autorización del acudiente de la ficha del jugador y en la respuesta pública, el nombre de cada documento DEBE abrir un dialog con su título, versión, fecha y texto completo, sin salir de la pantalla ni perder lo escrito.
- **FR-002**: Cerrar el dialog NO DEBE marcar ni desmarcar la casilla de aceptación.
- **FR-003**: El texto mostrado DEBE ser el de la versión vigente que se registra al aceptar.
- **FR-004**: Cada documento y versión DEBE ser un archivo propio que no se modifica una vez publicado; un cambio de texto DEBE publicarse como versión nueva.
- **FR-005**: La versión vigente de los dos documentos DEBE pasar a una nueva (`2026-10-v2`) que apunte a su archivo; la anterior DEBE conservarse como historial.
- **FR-006**: El texto DEBE verse sin sesión (respuesta pública) y como página propia en su dirección.
- **FR-007**: Si el texto no se puede cargar, el dialog DEBE mostrar un mensaje en español y un enlace para abrir el documento en otra pestaña.
- **FR-008**: La Política de Tratamiento de Datos DEBE cubrir, como borrador base para Colombia (Ley 1581 de 2012 y Decreto 1377 de 2013): responsable y encargado, datos que se tratan, finalidades, derechos del titular, procedimiento de consultas y reclamos, datos de menores, seguridad, transferencias y vigencia.
- **FR-009**: Los Términos y Condiciones DEBEN cubrir: objeto, cuenta y acceso, obligaciones de la academia (incluida la autorización de los datos que carga), plan gratuito, propiedad intelectual, responsabilidad, suspensión y terminación, cambios y ley aplicable.
- **FR-010**: Los datos del responsable que aún no existen (nombre o razón social, identificación, ciudad, dirección) DEBEN aparecer como marcadores visibles, y el documento DEBE indicar que es un borrador sujeto a revisión legal.
- **FR-011**: El dialog DEBE cumplir `DESIGN.md` y `ui.md`, ocupar toda la pantalla en el celular, tener el foco dentro mientras está abierto, cerrarse con «Cerrar» y con Escape, y pasar la revisión de experiencia y accesibilidad (principio XIII).
- **FR-012**: Cada criterio de HU-043 DEBE tener al menos una prueba automática o un paso de validación documentado.

### Key Entities

- **Documento legal**: tipo (Términos o Política), versión, fecha de publicación, dirección de su texto y si es el vigente. Ya existe (spec 001); cambia su dirección y se agrega una versión.
- **Aceptación legal y autorización del acudiente**: ya existen (HU-014, specs 009 y 013); no cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquiera de los tres formularios, el texto completo de un documento se abre con un toque y se cierra con otro, sin perder ningún dato escrito.
- **SC-002**: El 100 % de las aceptaciones nuevas corresponden a una versión cuyo texto se puede abrir y leer.
- **SC-003**: El documento se lee completo a 360 px sin desplazamiento horizontal.
- **SC-004**: La revisión de accesibilidad del dialog no deja hallazgos críticos ni altos.

## Assumptions

- Los formularios, las casillas y las aceptaciones ya existen (HU-014, specs 009 y 013); esta spec solo cambia cómo se leen los documentos y su texto.
- El texto es un **borrador**: un abogado lo revisa antes de que una academia real cargue datos. Si cambia, se publica como versión nueva (DEC-49).
- El contacto para consultas y reclamos de datos es el correo de PlayerTech usado para el SMTP del piloto, hasta tener dominio propio.
- No se pide volver a aceptar a quien aceptó una versión anterior (fuera de alcance), ni hay Términos para acudientes: el acudiente solo autoriza el tratamiento de datos.
- Fuera de alcance: texto legal definitivo, editor de documentos y aviso de cambios de versión.
