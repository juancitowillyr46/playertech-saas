---
name: PlayerTech
description: Sistema visual «Planilla» de PlayerTech, la gestión de academias deportivas llevada como la planilla oficial de juego.
colors:
  tinta: "#1c2b4a"
  tinta-hover: "#141f36"
  tinta-clara: "#9db4da"
  papel: "#fbfaf7"
  superficie: "#ffffff"
  texto: "#20242b"
  texto-secundario: "#5a606b"
  filete: "#ddd9cf"
  borde-campo: "#8b8f98"
  inactivo: "#6b7079"
  sello: "#b3261e"
  pizarra: "#10141d"
  pizarra-superficie: "#171d29"
  texto-sobre-pizarra: "#eceae4"
  texto-secundario-sobre-pizarra: "#a9afbb"
  sello-sobre-pizarra: "#f08a80"
typography:
  titulo-pagina:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  titulo-acceso:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
  titulo-seccion:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
  cuerpo:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  etiqueta:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.45
  secundario:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  sello:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.05em"
  numero-fila:
    fontFamily: "JetBrains Mono, ui-monospace, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  xs: "1px"
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "4px"
  full: "9999px"
spacing:
  margen-celular: "16px"
  margen-escritorio: "32px"
  control: "44px"
  campo-y: "12px"
  campo-x: "14px"
components:
  boton-principal:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
    height: "44px"
  boton-principal-hover:
    backgroundColor: "{colors.tinta-hover}"
  campo:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
    height: "46px"
  sello-activa:
    textColor: "{colors.tinta}"
    typography: "{typography.sello}"
    rounded: "{rounded.sm}"
  sello-inactiva:
    textColor: "{colors.inactivo}"
    typography: "{typography.sello}"
    rounded: "{rounded.sm}"
  barra-superior:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    height: "56px"
  navegacion-inferior:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto-secundario}"
    height: "64px"
---

# Design System: PlayerTech

> Documentado desde la aplicación construida (spec 003, T-01). Fuente única del sistema visual (principio X). Los encabezados de sección siguen el formato estándar de DESIGN.md; el contenido está en español. El brief de producto está en [`PRODUCT.md`](PRODUCT.md); los patrones de pantalla y la arquitectura de información, en [`docs/architecture/ui.md`](docs/architecture/ui.md).

## Overview

**Creative North Star: "La planilla oficial"**

PlayerTech se lleva como la planilla oficial de juego de una liga de fútbol: cada registro es una fila numerada y reglada, la tinta azul marca lo que se hace y cada estado queda sellado. La planilla es el documento en el que todos confían, y esa es la impresión que debe dejar el producto: **serio y confiable**, sin dejar de ser del mundo del fútbol formativo.

Es una superficie de trabajo (modo Operate): primero se encuentra todo y después se nota el estilo. El mundo de la planilla aporta solo cuatro cosas: la paleta de tinta y papel, la tipografía, la densidad reglada y una firma, el filete de tinta bajo cada título. La navegación y los controles son los estándar de una app.

Se diseña primero para el celular: el owner lo usa en la cancha, al sol, con una mano y con datos limitados.

**Key Characteristics:**
- Papel claro y tinta azul; el rojo de sello vive solo en la marca.
- Filas regladas y numeradas en lugar de tarjetas flotantes.
- Estados como sellos: sin relleno, con borde y en mayúsculas espaciadas.
- Controles firmes y precisos: rectos, de 44 px y sin sombras decorativas.
- En el celular, chasis de app: barra superior con la academia y navegación inferior.

**Lo que NO es:** un panel de administración genérico, algo infantil o escolar, una estética agresiva de apuestas o videojuego, ni algo frío y bancario (anti-referencias confirmadas por el responsable de producto).

## Colors

Todos los pares texto/fondo cumplen WCAG AA en ambos modos (contrastes medidos en la spec 003).

### Primary

- **Tinta** (`#1c2b4a`): acciones principales, chasis (topbar y menú lateral), foco y enlaces. Texto blanco encima: 14,06:1.
- **Tinta clara** (`#9db4da`): la tinta en modo oscuro, para acciones y foco sobre pizarra (8,02:1).

### Neutral

- **Papel** (`#fbfaf7`): fondo de la aplicación en modo claro.
- **Superficie** (`#ffffff`): campos, drawer, navegación inferior y diálogos.
- **Texto** (`#20242b`): 14,92:1 sobre papel. **Texto secundario** (`#5a606b`): 6,06:1.
- **Filete** (`#ddd9cf`): las líneas de la planilla (separadores de filas y secciones).
- **Borde de campo** (`#8b8f98`): 3,24:1 sobre blanco (WCAG 1.4.11).
- **Pizarra** (`#10141d`) y **pizarra superficie** (`#171d29`): fondos del modo oscuro, con texto `#eceae4` (15,31:1) y secundario `#a9afbb` (7,66:1).

### Tertiary

- **Sello** (`#b3261e`; `#f08a80` en oscuro): exclusivo del logo provisional «PT».

### Named Rules

**The Tinta Manda Rule.** Solo la tinta señala lo que se puede hacer. Una pantalla tiene una sola acción en tinta sólida; las demás son contorno o texto.

**The Sello en su Sitio Rule.** El rojo de sello no se usa para errores, avisos ni decoración: solo en la marca. Los errores usan el rojo de error de PrimeNG.

**The Estado sin Color Solo Rule.** Ningún estado se comunica solo con color: el sello lleva texto («ACTIVA», «INACTIVA»), la sección actual lleva negrita y `aria-current`.

## Typography

- **Public Sans** (variable, 100–900) para todo el texto; alojada en el proyecto (`frontend/public/fonts/`, licencia OFL) con pila de respaldo del sistema y `font-display: swap`.
- **JetBrains Mono 500** solo para datos que se cuentan: el número de fila de la planilla.
- Base de 16 px: legible al sol y sin zoom de Safari en iOS al enfocar campos.
- Cifras tabulares en todo el documento (`font-variant-numeric: tabular-nums`).

### Hierarchy

| Rol | Tamaño | Peso | Uso |
|---|---|---|---|
| Título de página (`h1`) | 1,75 rem | 800 | Uno por página, con el filete de tinta debajo |
| Título de acceso | 1,875 rem | 800 | Inicio de sesión, registro y pantallas de estado |
| Título de sección (`h2`) | 1,25 rem | 800 | «Completa tu academia», nombre de la academia |
| Cuerpo y etiquetas | 1 rem | 400 / 500 | Texto y etiquetas de campo, siempre visibles |
| Secundario | 0,875 rem | 400 | Tipo y ciudad, ayudas de campo |
| Sello | 0,6875 rem | 700, mayúsculas, 0,05 em | Estados |

### Named Rules

**The Un Borde Rule.** Todo se alinea a la izquierda sobre un solo borde: marca, título, descripción, campos y enlaces. Nada centrado ni a la derecha en formularios (observaciones del responsable de producto, T043).

**The Sin Rótulo Rule.** No hay rótulos ni "eyebrows" sobre los títulos; el título habla solo.

## Layout

- **Celular (< 992 px)**: barra superior en tinta de 56 px con la insignia y el nombre de la academia y el menú de usuario; navegación inferior de 64 px (más la zona segura) con los destinos principales; márgenes laterales de 16 px. La acción principal de la página flota abajo a la derecha, sobre la barra. Sin menú hamburguesa.
- **Escritorio (≥ 992 px)**: topbar en tinta con la marca y la academia y menú lateral en tinta de 17 rem pegado al borde.
- **Acceso**: bloque de 28 rem de ancho máximo, anclado arriba en el celular para que el teclado no lo mueva; en escritorio, panel de marca en tinta a la izquierda.
- **Listados**: por debajo de 768 px, filas regladas; desde 768 px, tabla con ordenamiento y paginación de 10.
- Puntos de corte: 576, 768, 992, 1200 y 1920 px (tema de Tailwind).
- Ancho mínimo de cualquier control interactivo: 44 × 44 px.

## Elevation & Depth

Plano. La profundidad la dan los filetes, no las sombras. Solo flotan los elementos que están por encima del contenido: la acción principal en el celular (sombra suave con desplazamiento vertical), los menús emergentes, el drawer y los diálogos (las capas de PrimeNG). No hay sombras decorativas ni halos de color.

## Shapes

- Radios casi rectos: 2 px en botones, campos, sellos y menús. El papel no se redondea.
- Círculo completo solo para la insignia de la academia, el avatar del usuario y el logo.
- Filete de 1 px (`filete`) entre filas y secciones; filete de 2 px en `texto` bajo cada título de página: la firma de la planilla.
- Ningún borde lateral de color de más de 1 px en filas, tarjetas o avisos.

## Components

Los componentes son los de PrimeNG con el preset de PlayerTech (`frontend/src/app/core/theme/playertech-preset.ts`); no hay componentes que los sustituyan.

### Buttons

- **Principal**: tinta sólida, texto blanco en 600, 44 px de alto. Uno por pantalla.
- **Secundario**: contorno (`outlined`), por ejemplo «Cancelar» o «Reintentar».
- **De icono**: 44 × 44 px, texto, redondo (acciones de fila, cerrar).
- Deshabilitado y en carga los gestiona PrimeNG; el botón en carga impide envíos duplicados.

### Chips

**Sellos de estado** (`p-tag` sin relleno por token y con borde de 2 px en `currentColor`): «ACTIVA» en tinta, «INACTIVA» en gris inactivo, «PRINCIPAL» en texto. Siempre con texto.

### Cards / Containers

No se usan tarjetas como estructura. Los contenidos se agrupan en **filas regladas** (listas con filete inferior) y **fichas** (listas de definición con filas «etiqueta → valor»). Los estados vacíos van entre dos filetes con un título corto y una acción.

### Inputs / Fields

Campos de 46 px (relleno 12 × 14 px), fondo blanco, borde `borde-campo`, foco con anillo de tinta de 2 px separado 2 px. Etiqueta visible encima; ayuda en secundario debajo (por ejemplo, «Mínimo 8 caracteres.») que el error sustituye cuando aparece. Las casillas miden 28 px y toda su fila (≥ 44 px) es tocable.

### Navigation

- **Navegación inferior** (celular): icono y etiqueta; la sección actual con pastilla de `highlight` de tinta, negrita y `aria-current="page"`. Máximo 5 destinos; en la Fase 2 el quinto agrupará el resto («Más»).
- **Menú lateral** (escritorio): en tinta; sección actual con fondo, negrita y `aria-current`.
- **Menú de usuario** (avatar): correo, «Modo claro / Modo oscuro» y «Cerrar sesión».

### Encabezado de página

`PageHeader` (`shared/components/page-header`): `h1`, descripción opcional y filete de tinta de 2 px; la acción principal se proyecta con `appPageHeaderAction`.

### Logo

`BrandMark` (`shared/components/brand-mark`) es el único sitio del logo: un SVG cuadrado (`viewBox 0 0 40 40`) pintado con `currentColor`, a 28, 32 o 40 px. Hoy ocupa ese espacio el sello provisional «PT»; el logo definitivo se cambia ahí, debe leerse a 28 px y funcionar en un solo color (sello, texto y sobre tinta).

### Estados de pantalla

- **Cargando**: esqueletos (`p-skeleton`) con la forma del contenido y `role="status"`.
- **Vacío**: título corto («Aún no hay sedes.») y la acción que lo resuelve.
- **Sin resultados**: «Ninguna sede coincide con la búsqueda.» con «Limpiar búsqueda».
- **Error**: mensaje en español sin detalles técnicos y «Reintentar».
- **Maqueta** (funciones aún no disponibles): visibles, pero deshabilitadas con «Disponible próximamente» o «(próximamente)».

### Correos

Los correos de autenticación (`supabase/templates/`) copian estos tokens en estilos en línea, porque los clientes de correo ignoran las hojas externas: logo «PT» en sello, título con filete de tinta, botón en tinta y enlace también en texto. Es la única excepción a «sin estilos en línea», y aplica solo al HTML de correo, no a la aplicación.

## Do's and Don'ts

### Do:

- Do cambiar el aspecto de un componente desde los tokens del preset; si no hay token, combinar utilidades de Tailwind en la plantilla o la API `pt` de PrimeNG.
- Do alinear todo a un solo borde izquierdo y anclar los formularios arriba en el celular.
- Do usar filas regladas y fichas para agrupar; el filete de tinta bajo cada título de página.
- Do comprobar cada pantalla a 360 px y en escritorio, en modo claro y oscuro, con controles de 44 px y sin desplazamiento horizontal.
- Do respetar el movimiento reducido: las transiciones salen de `--p-transition-duration`.
- Do escribir en español de Colombia, con tuteo y el vocabulario del glosario.

### Don't:

- Don't sobrescribir clases internas de PrimeNG (`.p-*`), usar `!important` ni estilos en línea en la aplicación (lo verifican `npm run check:styles` y `npm run lint`).
- Don't usar tarjetas iguales de icono, título y texto como estructura de página, ni tarjetas anidadas.
- Don't poner rótulos sobre los títulos ni flechas «→» añadidas a botones y enlaces.
- Don't usar el rojo de sello fuera de la marca ni comunicar un estado solo con color.
- Don't anunciar funciones que aún no existen; las de maqueta se muestran deshabilitadas.
- Don't mostrar la marca PlayerTech en las pantallas internas del celular: ahí la identidad es la academia.
