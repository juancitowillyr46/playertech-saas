---
version: 1
slug: "frontend-src-app"
primary_target: "frontend/src/app"
related_targets: ["frontend/src/app/features/auth","frontend/src/app/layout"]
---

# Superficie: aplicación PlayerTech (Operate)

Alcance: toda la aplicación Angular (chasis, acceso, inicio, sedes y estados). Modo: Operate. Usuario, voz y principios en `PRODUCT.md`. Elegida por el responsable de producto el 2026-10-17 (T024, spec 003).

## Direction contract

THESIS: La academia llevada como una planilla oficial de juego: cada registro es una fila numerada y reglada, con su estado sellado. Rechaza el panel de administración genérico de tarjetas flotantes y acento azul.

OWN-WORLD: Papel claro (#FBFAF7) con filetes cálidos (#DDD9CF); tinta azul (#1C2B4A) en el menú lateral, el topbar y las acciones; rojo sello (#B3261E) solo en el sello de la marca. Public Sans para todo, peso 800 en títulos; números de fila (el orden: la principal es la 01) en monoespaciada, solo para datos. Estados como sellos de borde doble en mayúsculas espaciadas; radios de 2 px. En oscuro: pizarra (#10141D) con tinta clara.

STORY: El owner entiende en un vistazo qué tiene registrado, en qué orden y en qué estado, y confía en que es el registro oficial de su academia; actúa con una sola acción principal por pantalla.

FIRST VIEWPORT: En el celular, chasis de app: barra superior en tinta con la insignia de iniciales y el nombre de la academia y el avatar (modo claro/oscuro dentro de su menú), navegación inferior en papel con pastilla de tinta en la sección actual. En escritorio, topbar en tinta con el sello «PT», la marca y la academia, y menú lateral en tinta. Encabezado con título en 800, descripción breve y filete grueso de tinta (sin rótulo encima del título: lo prohíbe el suelo de calidad). Buscador y filtro; filas numeradas 01, 02, 03 con nombre, tipo y ciudad, y sellos de estado. Acción principal: botón tinta a todo el ancho al pie en el celular, a la derecha de las herramientas en escritorio.

FORM: Planilla oficial de juego de las ligas de fútbol; puesto 1 de mi lista ordenada (elección de Impeccable, no la asignada por la tirada). seed:8c3cb67082136470

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Observaciones del responsable de producto (T043, 2026-10-17)

Sobre inicio de sesión, registro y recuperación de contraseña, probados en su celular:

- Todo alineado a la izquierda sobre un solo borde (marca, título, descripción, campos y enlaces); nada centrado ni a la derecha.
- Bloque anclado arriba, no centrado en vertical: la marca y el título se ven primero y el formulario no salta al abrir el teclado.
- «¿Olvidaste tu contraseña?» debajo de la acción principal.
- Las tres pantallas como una sola familia.
- Espacio reservado para el logo: el sello de la marca es un SVG en un único sitio (`BrandMark`), cuadrado y con `currentColor`, listo para cambiarse por el logo definitivo.
- El panel de marca de escritorio solo promete lo que existe hoy (sin convocatorias ni confirmaciones de tutores, que son de la Fase 2).
