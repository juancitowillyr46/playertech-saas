# Investigación: Sistema de diseño PlayerTech

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-10-17

Cada decisión sigue el formato: decisión, motivo y alternativas descartadas.

## R1 — Proceso de diseño con Impeccable

**Decisión**: Seguir el flujo propio de la skill, en este orden:
1. `/impeccable init` genera `PRODUCT.md` con la entrevista de la skill. Se parte del brief de T-01 y de `docs/product/` para no repetir preguntas. El responsable de producto lo aprueba (US1).
2. Flujo "Create or replace the visual world" de `reference/new-work.md`:
   - modo **Operate** (aplicación de gestión, no landing), que por regla de la skill es **code-led**: las muestras son pantallas construidas, no imágenes generadas;
   - `concept-seed --scope direction --mode operate`, obligatorio antes de escribir cualquier muestra;
   - página de decisión local con 2 o 3 direcciones y la salida "estándar de la categoría", que solo el responsable de producto puede elegir.
3. El contrato de dirección se guarda en el *surface brief* de Impeccable (`surface-brief write`), nunca en el código servido al navegador.
4. `DESIGN.md` se escribe **al final**, desde la aplicación construida, con el documentador de Impeccable (`/impeccable document` o el agente `impeccable-documenter`). Durante la construcción, la fuente provisional es el contrato de dirección.

**Motivo**: Es el proceso que la skill exige para un mundo visual nuevo. Escribir `DESIGN.md` antes de construir produce reglas que luego se defienden contra la realidad. Las superficies Operate salen mejor construidas que dibujadas.

**Alternativas descartadas**:
- Mockups en imagen: la skill los reserva para superficies Persuade o Experience.
- Escribir `DESIGN.md` primero: lo desaconseja la propia skill (sección 5 de new-work).
- Elegir la dirección sin muestras: no cumple FR-002.

## R2 — Muestras de las direcciones

**Decisión**: Cada dirección se muestra con el **inicio de sesión** y una **pantalla interna** (la de sedes, con datos de ejemplo), a 360 px y a 1280 px, en modo claro y oscuro.
- Las muestras son HTML autónomo servido por la página de decisión de Impeccable desde `.impeccable/mocks/decision/`. No forman parte de la aplicación ni de su compilación.
- Se añaden a `.gitignore` las rutas de muestras que la skill no ignora ya.
- La evidencia de la elección (capturas y el porqué) queda resumida en `DESIGN.md` y en el registro de decisiones.

**Motivo**: El responsable de producto compara las direcciones sobre las mismas pantallas y tamaños (FR-002) sin tocar la aplicación, que solo recibe la dirección elegida (FR-003). Las muestras no se versionan porque son descartables.

**Alternativas descartadas**:
- Ramas o rutas de la aplicación por dirección: mezclan código descartable y chocan con FR-037 de la spec 002.
- Selector de tema en vivo dentro de la app: es más trabajo y no se conserva.

## R3 — Tokens: preset de PlayerTech sobre Aura

**Decisión**: Se amplía `core/theme/playertech-preset.ts` (`definePreset(Aura, …)`):
- **Primitivos**: escala de marca propia de 50 a 950 y, si la dirección la pide, una escala de acento.
- **Semánticos**:
  - `primary` con color de acción AA en cada modo;
  - `colorScheme.light` y `colorScheme.dark` con `surface` (tintado según la dirección), `formField` y `text`;
  - `focusRing` (ancho, estilo, color y desplazamiento visibles en ambos modos);
  - radios (`borderRadius`), densidad (`formField` y `navigation`) y `transitionDuration`.
- **Componentes**: solo los usados (button, inputtext, password, select, checkbox, table, drawer, card, menu, message, toast, tag, confirmdialog, dialog).

Tipografía:
- La familia se declara en un único sitio: la variable de fuente de `assets/layout/_core.scss` y su equivalente en el bloque `@theme` de `src/assets/tailwind.css`, para que las utilidades `font-*` coincidan.
- El tamaño base de Sakai (14 px) se revisa con la dirección, con una condición fija: **los campos de formulario usan al menos 16 px en móvil**, porque Safari de iOS amplía la página al enfocar campos más pequeños.

**Motivo**: Es el primer sitio de estilos de `AGENTS.md`. Las variables del layout de Sakai leen los `--p-*`, así que un solo cambio llega a PrimeNG y al chasis (FR-005).

**Alternativas descartadas**:
- Preset desde cero sin Aura: se pierde la base mantenida.
- CSS sobre las clases `.p-*`: está prohibido (FR-006).
- Un tema por modo en archivos separados: Aura ya resuelve los dos modos con `colorScheme`.

## R4 — Carga de la tipografía

**Decisión**:
- Archivos `woff2` **alojados en el proyecto** (`frontend/public/fonts/`), solo el subconjunto latino y solo los pesos que use la dirección.
- `@font-face` con `font-display: swap` en `src/assets/styles.scss`, una pila de respaldo con métricas parecidas y `preload` del peso principal en `index.html`.
- Se incluye la licencia (OFL u otra libre).
- Se elimina el enlace actual a `fonts.cdnfonts.com` (Lato).

**Motivo**:
- No depender de un tercero en cada carga (rendimiento y privacidad).
- La interfaz funciona aunque la fuente no cargue (caso límite de la spec).
- No añadir una dependencia npm para algo que son archivos estáticos (principio II).
- De paso se resuelve el aviso pendiente de la auditoría de la spec 002 sobre Lato.

**Alternativas descartadas**:
- Google Fonts o cdnfonts por CDN: dependen de un tercero y fallan sin red.
- Paquetes `@fontsource`: añaden una dependencia para unos pocos archivos.

## R5 — Modo claro y oscuro

**Decisión**: `LayoutService`:
- sin valor guardado en `playertech.darkTheme`, toma el valor inicial de `prefers-color-scheme`;
- con valor guardado, este prevalece (FR-009);
- no sigue los cambios del sistema en caliente una vez que el owner eligió.

**Motivo**: Cubre FR-009 con un cambio mínimo en el servicio adoptado.

**Alternativas descartadas**: un tercer estado "automático" en el botón; complica la interfaz y ninguna HU lo pide.

## R6 — Movimiento reducido

**Decisión**:
- En `_core.scss`, `@media (prefers-reduced-motion: reduce)` pone a cero la **variable de token** `--p-transition-duration` y las transiciones propias del layout (menú y máscara).
- En las plantillas se usa la variante `motion-reduce:` de Tailwind.

**Motivo**: Cambiar una variable de token no sobrescribe clases internas de PrimeNG ni necesita `!important` (FR-006, FR-011).

**Alternativas descartadas**: una regla universal `* { transition: none !important }`, que está prohibida.

## R7 — Chasis y encabezado de página

**Decisión**:
- El chasis se ajusta en sus archivos: `layout/component/app.topbar.ts`, `app.menu.ts`, `app.menuitem.ts`, `app.sidebar.ts` y los parciales `_topbar.scss`, `_menu.scss`, `_main.scss` y `_responsive.scss`, respetando su estructura (`docs/engineering/sakai-upstream.md`).
- Se crean dos componentes compartidos, porque los usan al menos dos features:
  - `shared/components/page-header`: título, descripción y una zona de acción proyectada;
  - `shared/components/brand-mark`: la marca tipográfica, usada en el topbar y en el layout de autenticación.
- En el celular, la acción principal del encabezado queda visible (si hace falta, fija al pie de la pantalla).

**Motivo**:
- FR-012 a FR-014.
- Componer elementos propios con Tailwind no sustituye ningún componente de PrimeNG (principio XIII).

**Alternativas descartadas**: `p-toolbar` como encabezado, cuya estructura de tres zonas no encaja con el patrón de título, descripción y acción.

## R8 — Listado adaptable y drawer a pantalla completa

**Decisión**:
- **Listado**: a partir del punto de corte `md`, `p-table` con búsqueda, filtro por estado, ordenamiento y paginación del lado del cliente. Por debajo, una lista semántica (`<ul>`) de tarjetas compuestas con Tailwind, con `p-tag` y `p-menu`. La visibilidad se alterna con utilidades responsive (`hidden md:block`).
- **Drawer**: `p-drawer` con `[fullScreen]` ligado a una señal de `BreakpointObserver` (`@angular/cdk`, ya instalado). Las acciones van en la plantilla de pie del drawer, siempre visibles.

**Motivo**:
- Una academia tiene pocas sedes, así que renderizar las dos vistas no tiene coste apreciable y evita lógica de puntos de corte en la plantilla.
- La anchura del drawer no se puede fijar sin estilos en línea, que están prohibidos; `fullScreen` es la API del componente.

**Alternativas descartadas**:
- `p-dataview`: su estructura no aporta frente a la lista compuesta.
- Tabla con desplazamiento horizontal en el celular: incumple FR-019.
- Anchura del drawer por `[style]`: incumple `AGENTS.md`.

## R9 — Pantallas modelo con datos reales de solo lectura (aclaración A)

**Decisión**:

| Pantalla | Datos reales (solo lectura) | Maqueta visual (no guarda ni calcula) |
|---|---|---|
| Sedes (`/settings/venues`) | Listado de sedes no eliminadas: nombre, tipo, ciudad, principal y estado (CA-001 a CA-003 de HU-030) | Botón "Nueva sede" y "Editar" abren el drawer con el formulario; **Guardar** deshabilitado y `p-message` "Disponible próximamente". "Desactivar" y "Eliminar" aparecen en el menú de fila deshabilitados con la marca "Próximamente" |
| Inicio (`/home`) | Nombre y logo de la academia (o sus iniciales), plan vigente y sede principal (CA-001 de HU-032) | Tarjeta "Completa tu academia" con las tareas recomendadas y su enlace de destino, **sin** contador ni estado de completado, que llegan con HU-032 |

Acceso a datos, siguiendo ADR-002 y ADR-009 (página → servicio → repositorio abstracto → implementación Supabase):
- `features/venues/data/venue.repository.ts` con `listVenues()`, y su implementación `supabase-venue.repository.ts`.
- `features/home/data/home-summary.repository.ts` con `loadSummary()` (plan y sede principal), y su implementación Supabase.
- RLS limita las lecturas a la academia del miembro. El cliente no envía `academy_id` (principio VI).
- El logo se resuelve con el `FileStorageRepository` existente.

**Motivo**:
- Valida los patrones con datos reales en el celular.
- HU-029 a HU-032 solo añadirán escritura, que es lo que la tabla de acceso de la spec 001 ya permite al owner.
- Mostrar un progreso inventado a un owner real sería engañoso, así que no se muestra contador.

**Alternativas descartadas**: las opciones B y C de la aclaración.

## R10 — Correos de autenticación

**Decisión**:
- `supabase/templates/confirmation.html` y `supabase/templates/recovery.html`, registrados en `supabase/config.toml` bajo `[auth.email.template.confirmation]` y `[auth.email.template.recovery]`, con `subject` en español.
- El botón y el enlace en texto usan `{{ .ConfirmationURL }}`, la misma variable que funciona hoy con PKCE, así que el retorno por `/auth/callback` no cambia.
- HTML de correo: maquetación con tablas, estilos **en línea** y ancho máximo de unos 600 px. Los colores se copian de los tokens de `DESIGN.md` y se anotan como tales.
- Se verifican en Mailpit tras reiniciar Supabase local, porque `config.toml` solo se lee al arrancar.

**Motivo**: Los clientes de correo ignoran las hojas externas y gran parte del CSS moderno. Las reglas de estilos de `AGENTS.md` gobiernan la aplicación Angular, no el HTML de correo, y esta diferencia se documenta en `DESIGN.md`.

**Alternativas descartadas**:
- Generar los correos desde el frontend: no aplica, los envía Supabase Auth.
- Usar MJML u otra herramienta de compilación: añade una dependencia para solo dos plantillas.

## R11 — Verificación de las reglas de estilo

**Decisión**:
- Activar en ESLint la regla `@angular-eslint/template/no-inline-styles`.
- Añadir `npm run check:styles` (`frontend/scripts/check-styles.mjs`), que falla si encuentra:
  - `!important` en `src/app/**` o en `src/assets/layout/**`;
  - selectores de clases internas de PrimeNG (`.p-…`) en el SCSS del layout o en estilos de componentes;
  - colores hexadecimales en plantillas.
- Las demos (`src/app/pages/**`, `src/assets/demo/**`) quedan excluidas.

**Motivo**: SC-002 y FR-006 pasan a comprobarse en cada ejecución, igual que `check:bundle` en la spec 002 (principio IX).

**Alternativas descartadas**: Stylelint, una dependencia y configuración nuevas para tres comprobaciones.

## R12 — Verificación visual y de accesibilidad

**Decisión**:
- Por cada pantalla modelo y por el chasis:
  - `/impeccable critique`, `/impeccable audit` y `/impeccable polish` (FR-021);
  - capturas con puppeteer-core en emulación móvil (360 × 800) y de escritorio (1280 × 800), en ambos modos;
  - medición de áreas táctiles y de desplazamiento horizontal;
  - contraste calculado de los pares de tokens texto/fondo y control/fondo.
- Los scripts viven en el scratchpad de la sesión, como en la spec 002, y sus resultados se resumen en el `quickstart.md`.

**Motivo**: Hace medibles SC-003 y SC-004. Repite herramientas que ya funcionaron en la spec 002.

**Alternativas descartadas**: Playwright en el repositorio, que `testing.md` deja para la Fase 2.

## R13 — Pruebas automáticas

**Decisión**:
- Las pruebas existentes (106) se mantienen. Si cambian textos de las pantallas de acceso, se ajustan los textos que consultan, sin perder casos de comportamiento (SC-005).
- Se añaden pruebas de:
  - las implementaciones Supabase de `VenueRepository` y `HomeSummaryRepository` (consultas y mapeo de errores);
  - `PageHeader`;
  - la página de sedes: vista de tarjetas y de tabla presente, búsqueda y filtro, drawer con Guardar deshabilitado;
  - la página de inicio: resumen e iniciales cuando no hay logo;
  - `LayoutService`: preferencia del sistema sin valor guardado.

**Motivo**: Principio IX y `docs/engineering/testing.md`.

## R14 — Observaciones de experiencia del responsable de producto

**Decisión**: Antes de rediseñar el inicio de sesión y el registro, se piden al responsable de producto, con una pregunta estructurada, las observaciones que anotó al probar el flujo completo. Se registran en el *surface brief* de autenticación y se aplican junto con `/impeccable clarify` para los textos.

**Motivo**: FR-015 y el supuesto correspondiente de la spec.

## R15 — Documentación y decisiones

**Decisión**:
- **`PRODUCT.md`** y **`DESIGN.md`**, en la raíz.
- **`docs/architecture/ui.md`**: la sección "Tema" se sustituye por un enlace a `DESIGN.md`. Se añaden el encabezado de página, la variante móvil del patrón de gestión y las pantallas modelo como referencia.
- **`docs/architecture/decisions.md`**:
  - FE-06 se enmienda con el preset definitivo, la tipografía alojada en el proyecto y la preferencia del sistema;
  - ADR-003 recibe la nota de T-01: la calidad visual no es *gold plating*.
- **`docs/architecture/frontend.md`**: carpetas `features/venues/` y `features/home/data/` y los componentes compartidos nuevos.
- **T-01**: pasa a Terminado. HU-030 y HU-032 reciben la nota "Versión de lectura disponible".

**Motivo**: FR-026, FR-027 y el principio X (enlazar, no duplicar).
