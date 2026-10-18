# Investigación: Gestión de la academia

## R1 — Sin migraciones

- **Decisión**: no se toca la base de datos.
- **Motivo**: la spec 001 ya concede al owner `update (name, logo_file_id, contact_email, contact_phone, address, city)` sobre `academies` con la política `academies_update_owner`. El logo solo puede apuntar a un archivo de la propia academia (`academies_logo_file_fk`). El bucket `public-assets` limita a `image/jpeg` e `image/png` y a 1 048 576 bytes. `files` admite `update (deleted_at)`. pgTAP (`030-isolation`, `060-storage`) cubre el aislamiento.

## R2 — Feature `academy-profile`

- **Decisión**: feature nueva con el patrón de `venues` (spec 004): `AcademyProfileRepository` abstracto, implementación Supabase, `AcademyProfileService` con señales (`profile`, `status`, `busy`) y la pantalla. La ruta `/settings/academy` deja de ser un marcador de posición.
- **Motivo**: capas de ADR-002 y ADR-009; el perfil no pertenece a `home` ni a `core`.

## R3 — Lectura y guardado del perfil

- **Lectura**: `academies` (`name`, `contact_email`, `contact_phone`, `address`, `city`, `logo_file_id`), plan activo (`subscriptions` → `plans.name`) y el archivo del logo vigente (`files`, sin `deleted_at`), con su URL pública mediante `FileStorageRepository.getUrl`.
- **Guardado**: `update` de los cinco campos sobre la academia del contexto, con `select` de vuelta. Los textos se recortan y los opcionales vacíos se guardan como `null` (patrón `cleanInput` de la spec 004). Ante `not_found` (la fila cambió o no es accesible) se recarga el perfil.
- **Correo de contacto (CA-005)**: es la columna `contact_email` de la academia; el correo de inicio de sesión vive en Auth y esta pantalla no lo toca.

## R4 — Logo: reemplazar y retirar sin acumular imágenes

- **Reemplazar**:
  1. validar el archivo (R5);
  2. redimensionar y comprimir (R5b);
  3. `FileStorageRepository.upload({ bucket: 'public-assets', module: 'academy', entityId: academyId })`;
  4. `update academies set logo_file_id = nuevo`;
  5. `FileStorageRepository.purge(anterior)`: borra la imagen del almacenamiento y marca `deleted_at` en su registro.
  - Si falla el paso 4, se purga el archivo nuevo y se conserva el anterior.
  - Si falla el paso 5, el logo ya cambió: se registra el error sin mostrarlo. Queda una imagen huérfana, que recogerá la limpieza del MVP+.
- **Retirar**: confirmación → `update ... logo_file_id = null` → `purge(anterior)`.
- **Por qué se borra la imagen** (decisión del 2026-10-18): la capacidad de almacenamiento es limitada y nadie necesita los logos anteriores. Se conserva el registro con `deleted_at` (trazabilidad, DEC-27). La política `academy_objects_delete` de la spec 001 ya permite borrar los objetos de la propia academia: no hace falta migración.
- **`purge` en `FileStorageRepository`**: método nuevo junto a `remove` (que solo marca `deleted_at`). Primero marca el registro y luego borra el objeto, para que un fallo nunca deje un registro vigente sin imagen.
- **Alternativas**: una función SQL atómica. Se descarta porque exige una migración, y el orden elegido nunca deja la academia apuntando a un archivo inexistente.

## R5 — Validación del archivo antes de subir

- **Decisión**: `validateLogoFile(file)` en la feature comprueba la imagen que elige el owner:
  - que el tipo sea `image/jpeg` o `image/png`;
  - que los primeros bytes coincidan (PNG `89 50 4E 47`, JPEG `FF D8 FF`), para el caso de extensión correcta con contenido inválido;
  - que el tamaño sea como máximo 5 MB (5 242 880 bytes).
- Devuelve `null` o el motivo (`type` o `size`) con su mensaje: «Usa una imagen JPG o PNG.» o «La imagen pesa más de 5 MB.».
- **Motivo**: CA-007 sin viajar al servidor. El bucket repite la regla (principio VIII).

## R5b — Redimensionar y comprimir en el navegador

- **Decisión**: `prepareLogoImage(file)` (`features/academy-profile/data/logo-image.ts`):
  - dibuja la imagen en un `canvas` con el lado mayor de 512 px como máximo (las menores no se agrandan);
  - exporta en el mismo formato: JPEG con calidad 0,85 o PNG, que conserva la transparencia;
  - si el resultado supera 1 MB (raro), reintenta con calidad menor (JPEG) o con un lado menor (PNG).
- **Motivo**: un logo se muestra como mucho a unos 100 px. Así un logo guardado pesa normalmente entre 30 y 200 KB, y 1 GB alcanza para miles de academias. Usa solo el navegador, sin dependencias (principio II), y es portable (ADR-017).
- **Pruebas**: el cálculo de dimensiones se prueba como función pura. El dibujo en `canvas` se valida en el quickstart, porque el entorno de pruebas no lo implementa.

## R6 — Contexto de academia actualizado sin recargar

- **Decisión**: `AcademyContextService.applyAcademyChanges({ name?, logoFileId? })` actualiza la academia actual en la señal, sin pasar por `loading`.
- **Motivo**: `reload()` limpia el contexto y los guards verían un estado de carga. El nombre y el logo se muestran en la barra superior y en el inicio.

## R7 — Tareas de «Completa tu academia»

- **Decisión**: `HomeSummaryData` añade:
  - `primaryVenue.address`;
  - la dirección y el teléfono de la academia (`academies.address`, `contact_phone`, en la misma lectura).

  El servicio calcula `tasks: { key, label, done, route }[]` y `completedCount`, con la tabla de la spec (la sede principal se completa con `address` no vacía; los datos de contacto, con teléfono y dirección de la academia no vacíos).
- **Pantalla**: lista con estado accesible (icono más texto «Completa» o «Pendiente»), contador «n de 4» y la tarjeta oculta con `completedCount === 4`. Las tareas completas no enlazan; las pendientes sí.
- **Refresco**: el inicio vuelve a cargar su resumen al entrar (comportamiento existente), así que refleja los cambios del perfil y de las sedes sin recargar la página.

## R8 — Revisión de experiencia y accesibilidad

El detector de Impeccable más la medición a 360 px en claro y oscuro (desbordamiento, controles de al menos 44 px) y la revisión visual del perfil (incluido el logo) y del inicio con la tarjeta en distintos estados. Se corrigen los hallazgos críticos y altos en los tres sitios de estilos.
