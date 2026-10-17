# Guía de validación: Sistema de diseño PlayerTech

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## Requisitos previos

- Docker Desktop en ejecución y Supabase local arriba: `npm run db:start` desde la raíz. `npm run db:reset` restaura el seed.
- Node 24 (`frontend/.nvmrc`) y `npm install` en `frontend/`.
- Usuario de prueba: `owner.a@playertech.test` / `PlayerTech-Local-2026` (`supabase/README.md`).

## 1. Controles automáticos

Desde `frontend/`:

```bash
npm run lint           # incluye template/no-inline-styles y la regla de capas
npm run check:styles   # sin !important, sin selectores .p-* y sin hex en plantillas (R11)
npm run test:ci        # pruebas existentes y nuevas (R13)
npm run build
npm run check:bundle   # sin claves privilegiadas ni demos en producción
```

**Resultado esperado**:
- Los cinco comandos terminan sin errores.
- El bundle inicial no crece más de 50 KB frente a los 919 KB de la spec 002.
- `check:styles` falla si se añade a propósito un `!important` en un parcial del layout (prueba negativa) y vuelve a pasar al quitarlo.

## 2. Brief y dirección (US1, US2)

| Comprobación | Esperado |
|---|---|
| `PRODUCT.md` | Esquema de Impeccable; enlaza a `docs/product/vision.md`; registra la aprobación con fecha (CA-001) |
| Página de decisión | Entre 2 y 3 direcciones, cada una con el inicio de sesión y la pantalla de sedes a 360 y 1280 px, en ambos modos (FR-002) |
| Elección | Contrato de dirección guardado en el *surface brief*; la elección queda reflejada después en `DESIGN.md` y en FE-06 (CA-002, FR-027) |

## 3. Identidad, modos y chasis (US3, US4)

Con `npm start`, entrar como owner y recorrer: inicio de sesión, inicio, Configuración → Academia y Sedes, menú de usuario, cerrar sesión, 404 (`/no-existe`), registro, recuperación.

| Comprobación | Cómo | Esperado |
|---|---|---|
| Identidad en todas las pantallas | Recorrido en ambos modos | Tipografía, color y superficies de la dirección en todas las pantallas, incluidas las de acceso y de estado (FR-016) |
| Preferencia del sistema | Borrar `playertech.darkTheme` del almacenamiento local y emular el modo oscuro del sistema | Arranca en oscuro; al elegir claro, se conserva tras recargar (FR-009) |
| Fuente | Bloquear `/fonts/*` en las herramientas del navegador | Se ve la pila de respaldo sin contenido oculto ni saltos grandes |
| Movimiento reducido | Emular `prefers-reduced-motion: reduce` | Sin transiciones en el menú, el drawer ni los diálogos (FR-011) |
| Chasis a 360 px | Emulación móvil 360 × 800 | Menú con una mano, indica la sección y se cierra al navegar; nombre de la academia legible; controles de 44 px o más (FR-013) |
| Foco de teclado | Tabulador en cada pantalla | Foco visible en todo elemento interactivo, en ambos modos (FR-008) |

## 4. Pantallas modelo (US5, US6)

| Pantalla | Comprobación | Esperado |
|---|---|---|
| Inicio de sesión y registro | Flujos de la spec 002 (`specs/002-frontend-foundation/quickstart.md`) | Mismo comportamiento y validaciones; textos y orden mejorados según las observaciones (FR-015); registro completo en menos de 3 min en el celular (SC-006) |
| Sedes, 360 px | Ver listado, buscar, filtrar, abrir "Nueva sede" y "Editar" | Tarjetas sin desplazamiento horizontal; drawer a pantalla completa con acciones visibles; "Guardar" deshabilitado y "Disponible próximamente" (FR-018a, FR-019) |
| Sedes, 1280 px | Igual | Tabla con búsqueda, filtro, ordenamiento y paginación; drawer a la derecha |
| Sedes, aislamiento | Entrar como owner de la academia B | Solo sus sedes (CA-005 de HU-030) |
| Inicio | Ver con el owner A | Nombre, iniciales (sin logo), plan "Free" y sede principal reales; tarjeta "Completa tu academia" sin contador (FR-018) |
| Estados | Cortar Supabase (`npm run db:stop`) y recargar Sedes e Inicio | Estado de error con reintento, en español y sin detalles técnicos (FR-020) |
| Textos largos | Renombrar en local una sede con 60 caracteres | Se recorta sin romper tarjeta ni tabla; el texto completo es accesible |

## 5. Revisión de experiencia y accesibilidad (FR-021)

Por cada pantalla modelo y el chasis:
1. `/impeccable critique <ruta>`, `/impeccable audit <ruta>` y `/impeccable polish <ruta>`.
2. Capturas y mediciones (scripts de puppeteer-core del scratchpad, R12) a 360 × 800 y 1280 × 800, en ambos modos:
   - ancho del documento igual al de la ventana (sin desplazamiento horizontal);
   - todos los controles interactivos con al menos 44 × 44 px;
   - contraste de los pares de tokens de [contracts/ui-contracts.md](./contracts/ui-contracts.md).

**Resultado esperado**: cero hallazgos críticos de contraste, foco o etiquetas (CA-005 de T-01; SC-003; SC-004). El resumen de resultados se anota al final de esta guía.

## 6. Correos (US7)

1. Reiniciar Supabase local: `npm run db:stop` y `npm run db:start`.
2. Registrar una cuenta nueva desde `/auth/register` y abrir Mailpit (http://127.0.0.1:54324).
3. Revisar el correo de confirmación: asunto y texto en español, marca, botón y enlace en texto. Usar la vista móvil de Mailpit y la vista de texto o HTML sin imágenes.
4. Pulsar el botón: verifica la cuenta y llega al inicio (flujo de la spec 002).
5. Pedir la recuperación desde `/auth/forgot-password` y repetir. El botón lleva a "Nueva contraseña" y el texto explica qué hacer si la persona no lo pidió.

**Resultado esperado**: CA-007 de T-01 y SC-007.

## 7. Documentación

| Documento | Esperado |
|---|---|
| `DESIGN.md` | Documentado desde lo construido: tokens, tipografía, color, marca, estados, reglas y nota del HTML de correo |
| `docs/architecture/ui.md` | La sección "Tema" enlaza a `DESIGN.md`; encabezado de página, variante móvil y pantallas modelo como referencia |
| `docs/architecture/decisions.md` | FE-06 enmendada; nota de T-01 en ADR-003 |
| T-01, HU-030 y HU-032 | T-01 terminado; nota "Versión de lectura disponible" en HU-030 y HU-032 |

## Resultados

*Se completa al terminar la implementación.*

| Prueba | Fecha | Resultado |
|---|---|---|
| SC-006, registro cronometrado en el celular (T051) | 2026-10-17 | 20 s desde abrir el registro hasta llegar al inicio, verificación por Mailpit incluida, sin trabas. La hizo el responsable de producto, que ya conocía la pantalla; se repetirá con una persona que no la haya visto antes del piloto |
