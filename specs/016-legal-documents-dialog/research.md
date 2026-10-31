# Investigación: Documentos legales en la aplicación

Decisiones técnicas de la spec 016. Las de producto están en DEC-49 (ADR-018).

## R1 — Archivos estáticos por versión

- **Decisión**: `frontend/public/legal/terms/2026-10-v2.html` y `frontend/public/legal/privacy_policy/2026-10-v2.html`, publicados con el frontend. `legal_documents.url` guarda la ruta relativa (`/legal/terms/2026-10-v2.html`).
  - **Página completa:** cada archivo es una página HTML propia (FR-006), con su `<head>` y una hoja mínima en `<style>` con los colores de `DESIGN.md`. Es un documento aparte, como los correos de `supabase/templates/`, no una plantilla de Angular.
  - **Contenido:** el texto va dentro de `<main>`, solo con elementos semánticos (`h1`, `h2`, `p`, `ul`, `li`, `strong`), sin clases ni estilos en línea.
  - **En Vercel:** los archivos existentes se sirven antes de la reescritura a `index.html`, así que la ruta abre el documento y no la aplicación.
- **Motivo**: lo aceptado queda ligado a un texto que no cambia (FR-004); no hay tabla ni editor nuevo.
- **Alternativa descartada**: guardar el texto en la base de datos: exige editarlo por SQL y mostrar HTML guardado en la base.

## R2 — Versión nueva en la base de datos

- **Decisión**: la migración `20261025100000_legal_documents_v2.sql` hace dos cosas, en este orden por el índice de una sola versión vigente por tipo:
  1. deja la v1 como no vigente;
  2. inserta las dos v2 como vigentes, con su URL relativa y `published_at` del 2026-10-25.

  `seed.sql` pasa a aceptar la v2: el registro exige la versión vigente.
- **Motivo**: FR-005. El registro y la autorización del acudiente ya toman la versión vigente: no cambian.

## R3 — Leer el texto

- **Decisión**: un repositorio propio, sin SDK de Supabase:
  - `LegalTextRepository` (abstracto) con `getText(url): Promise<string>`;
  - `FetchLegalTextRepository`, que descarga el archivo con `fetch` y devuelve el contenido de su `<main>` (con `DOMParser`).

  El servicio `LegalDocumentService` (`core/legal`) guarda en memoria el texto ya leído, para no descargarlo dos veces.
- **Motivo**: capas del proyecto (ADR-002); el texto es estático y no pasa por Supabase (ADR-017 sin cambios).

## R4 — El dialog

- **Decisión**: componente compartido `shared/components/legal-document-dialog` con `p-dialog` (PrimeNG):
  - **Contenido:** el título del documento, «Versión 2026-10-v2 · publicada el 25 de octubre de 2026», el texto con desplazamiento propio y «Cerrar».
  - **Comportamiento:** es modal, se cierra con Escape y mantiene el foco dentro.
  - **Tamaño:** en el celular (menos de 768 px) ocupa toda la pantalla; en escritorio, 40 rem de ancho y hasta el 85 % del alto.
  - **Estilos:** el texto se muestra con `[innerHTML]` (Angular lo sanea) y toma la tipografía base de `_typography.scss`. Las listas y el espaciado usan utilidades sobre el contenedor; ningún estilo apunta a `.p-dialog`.
  - **Si no carga:** muestra un mensaje en español y el enlace «Abrir en otra pestaña» (FR-007).
- **Motivo**: un solo componente para los tres sitios (principio IV); `ui.md` usa el drawer para formularios y el dialog para leer o confirmar.

## R5 — Los tres sitios

- **Registro** (`features/auth/register`): los dos enlaces abren el dialog con el documento que ya cargó la pantalla.
- **Ficha del jugador** (`guardian-drawer`): la política se abre en el dialog. `PlayerDetailService.privacyPolicyUrl` pasa a devolver el documento completo (`privacyPolicy`).
- **Respuesta pública** (`call-up-response`): igual, sin sesión. `legal_documents` ya es legible por `anon`.

## R6 — Texto base

- **Política de Tratamiento de Datos:**
  1. responsable y encargado;
  2. definiciones;
  3. datos que se tratan (cuenta del owner, jugadores, acudientes, respuestas);
  4. finalidades;
  5. datos de menores (interés superior, autorización del representante legal, art. 7 de la Ley 1581 y art. 12 del Decreto 1377);
  6. derechos del titular (art. 8);
  7. autorización;
  8. consultas y reclamos, con los plazos de 10 y 15 días hábiles (arts. 14 y 15);
  9. seguridad;
  10. transferencias y transmisiones (proveedores de infraestructura);
  11. vigencia.
- **Términos y Condiciones:**
  1. objeto;
  2. cuenta y acceso;
  3. obligaciones de la academia (incluida la autorización de los datos que carga);
  4. uso permitido;
  5. plan gratuito;
  6. propiedad intelectual;
  7. disponibilidad y responsabilidad;
  8. suspensión y terminación;
  9. cambios;
  10. ley aplicable.
- **Responsable** (ajuste del 2026-10-25): la persona natural que opera la marca, con nombre, domicilio, correo (`playertech.app@gmail.com`) y teléfono, como pide el artículo 13 del Decreto 1377 de 2013, sin número de cédula. Cuando exista la sociedad, una versión nueva.
- **Aviso:** al inicio, «Borrador sujeto a revisión legal» (FR-010).
- **Motivo**: HU-043 y DEC-49. No es asesoría legal: un abogado lo revisa antes de cargar datos reales.

## R7 — Maqueta

- **Decisión**: dos pantallas de baja fidelidad en un artifact privado, copiadas en `mockups/`: el dialog en el celular, sobre el registro, y el estado «no se pudo cargar».
