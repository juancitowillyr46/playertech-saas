# T-01 — Sistema de diseño PlayerTech

**Tipo:** Habilitador técnico (*enabler*) · **Fase:** 1 — Fundación SaaS · **Prioridad:** MVP · **Estado:** Definido
**Spec:** pendiente

## Propósito

Definir una identidad visual y de experiencia propia de PlayerTech **una sola vez**, para que todas las funcionalidades la hereden desde su primera versión en lugar de pulirse al final.

Se mantienen los componentes de PrimeNG, SakaiNG como base de layout y Tailwind CSS. Lo que se define es la **capa visual** (tokens, tipografía, color, densidad) y la **composición** (layout, patrones de pantalla, estados y textos).

## Necesidad del equipo

> Como **equipo de producto**, necesitamos un sistema de diseño propio sobre PrimeNG, para que PlayerTech se perciba como un producto profesional, cercano y deportivo, y no como una plantilla de administración genérica.

## Habilita

Todas las pantallas de la Fase 1 (HU-001, HU-014 a HU-017, HU-029 a HU-032) y las de la Fase 2.

## Brief de marca

### Usuario principal

| Aspecto | Definición |
|---|---|
| Quién | Owner de una academia deportiva pequeña en Colombia |
| Nivel técnico | 6 de 10 |
| Dispositivo principal | **Celular** |

**Implicación:** el diseño se piensa **primero para móvil** y después se amplía a escritorio.

### Personalidad

Deportivo · Confiable · Cercano · Moderno · Enérgico · Profesional · Sencillo

### Referencias

| Referencia | Qué se toma |
|---|---|
| Payoneer (web y app) | Confianza, orden y claridad en la gestión |
| Trello (gestión de tableros) | Gestión práctica y directa, sin fricción |
| iCloud (web y app) | Limpieza, espacio en blanco y sencillez |
| Real Madrid (web) | Energía deportiva, imagen e identidad fuerte |
| ChatGPT (web) | Minimalismo e interfaz neutra que no estorba |
| Mercado Libre (web) | Familiaridad para el usuario latinoamericano, accesibilidad |
| Spotify | Energía, contraste y un color de marca protagonista |

**Rasgo común:** interfaces limpias con mucho espacio, tipografía con carácter, **un color de marca protagonista** y trato cercano, con la energía del deporte.

### Restricciones

- Componentes de PrimeNG, layout de SakaiNG adoptado (ADR-015) y Tailwind CSS.
- Sin logo definido: se usará una marca tipográfica provisional.
- Paleta abierta: el azul `rgb(59, 130, 246)` es solo un punto de partida.
- Interfaz en español (Colombia).

## Alcance

1. **Brief de producto y marca** en `PRODUCT.md` (generado con `/impeccable init` a partir de este brief).
2. **Dirección visual**: explorar 2 o 3 direcciones y elegir una.
3. **Tokens**: preset de PlayerTech sobre Aura (`definePreset`), con paleta, superficies, tipografía, radios, foco, densidad y ajustes por componente (botón, tabla, drawer, tarjeta, formularios).
4. **Chasis**: topbar, sidebar, menú de usuario y encabezado de página, con navegación móvil.
5. **Pantallas modelo**: inicio de sesión, registro, página de gestión (sedes) e inicio. Se convierten en la referencia de los patrones de `ui.md`. Parten de las pantallas de acceso básicas de la spec 002 y afinan su experiencia (textos, orden de campos, mensajes y uso en el celular).
6. **Patrones móviles**: en pantallas pequeñas, las tablas se presentan como listas de tarjetas y el drawer ocupa la pantalla completa.
7. **Correos de autenticación**: confirmación de cuenta y recuperación de contraseña con la identidad de PlayerTech (asunto, texto en español de Colombia, marca y botón de acción). Hoy Supabase envía sus plantillas por defecto, en inglés. Se definen como plantillas HTML en `supabase/templates/`, registradas en `supabase/config.toml`, y se verifican en local con Mailpit.
8. **Documentación** del sistema de diseño (ver la regla de fuente única más abajo).

## Reglas

### Cómo entran los cambios visuales

Todo cambio visual entra por uno de tres sitios:

1. El **preset de tokens** de PlayerTech.
2. **Utilidades de Tailwind** en las plantillas.
3. Los **componentes del layout** adoptado.

No se escribe CSS que sobrescriba estilos internos de PrimeNG (por ejemplo, con `!important` o selectores de sus clases internas).

### Fuente única

| Documento | Contenido |
|---|---|
| `PRODUCT.md` | Brief de producto y marca que consume Impeccable; enlaza a `docs/product/vision.md` en lugar de repetirlo |
| `DESIGN.md` | Sistema visual: tokens, tipografía, color y reglas de estilo |
| `docs/architecture/ui.md` | Arquitectura de información, patrones de pantalla y uso de componentes |

### Calidad

Cada pantalla de la Fase 1 y posteriores pasa por `/impeccable critique`, `/impeccable audit` y `/impeccable polish` antes de considerarse terminada (Definition of Done).

## Criterios de aceptación

### CA-001 — Brief aprobado

**Dado** el brief de marca,
**cuando** se genera `PRODUCT.md`,
**entonces** refleja el usuario, la personalidad, las referencias y las restricciones definidas, y el responsable de producto lo aprueba.

### CA-002 — Dirección visual elegida

**Dado** que se presentan entre 2 y 3 direcciones visuales,
**cuando** el responsable de producto elige una,
**entonces** queda registrada en `DESIGN.md` con su paleta, tipografía y principios.

### CA-003 — Tema aplicado por tokens

**Dado** el preset de PlayerTech,
**cuando** se aplica a la aplicación,
**entonces** los componentes de PrimeNG adoptan la nueva identidad sin CSS que sobrescriba sus estilos internos.

### CA-004 — Móvil primero

**Dado** un celular de 360 px de ancho,
**cuando** se usan las pantallas modelo,
**entonces** son completamente utilizables sin desplazamiento horizontal y con áreas táctiles de al menos 44 px.

### CA-005 — Accesibilidad

**Dado** las pantallas modelo,
**cuando** se ejecuta `/impeccable audit`,
**entonces** no quedan hallazgos críticos de contraste, foco de teclado ni etiquetas de formulario.

### CA-006 — Modo claro y oscuro

**Dado** el tema de PlayerTech,
**cuando** se cambia entre modo claro y oscuro,
**entonces** ambos mantienen la identidad y un contraste adecuado.

### CA-007 — Correos con la identidad de PlayerTech

**Dado** un registro o una solicitud de recuperación de contraseña,
**cuando** llega el correo,
**entonces** su asunto y su texto están en español de Colombia, llevan la marca de PlayerTech, el botón de acción funciona, y se leen bien en un cliente de correo móvil.

## Fuera de alcance

- Diseño del logo definitivo.
- Ilustraciones o fotografía propias.
- Landing page comercial de PlayerTech.
- Componentes propios que sustituyan a los de PrimeNG.

## Decisiones que revisa

| Decisión | Ajuste propuesto |
|---|---|
| FE-06 (Aura + azul + surface por defecto) | Pasa a ser un **preset de PlayerTech sobre Aura**; el color definitivo lo fija la dirección visual elegida |
| ADR-003 (evitar componentes custom y *gold plating*) | Se mantiene para los componentes. La **calidad visual y de experiencia es prioridad de producto** y no se considera *gold plating* |

Estos ajustes se registrarán en `decisions.md` cuando se elija la dirección visual.

## Herramientas

- `impeccable` (skill del proyecto): `init`, `shape`, `typeset`, `colorize`, `layout`, `live`, `critique`, `audit`, `harden`, `onboard`, `clarify`, `polish`.
- `frontend-design` (skill del proyecto): proceso de diseño y guía de textos.

## Decisiones relacionadas

ADR-003, ADR-015 (`docs/architecture/decisions.md`).
