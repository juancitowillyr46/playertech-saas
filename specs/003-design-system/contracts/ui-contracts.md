# Contrato: interfaz y tokens

## Tokens obligatorios del preset

Los valores concretos los fija la dirección elegida (R3). Este contrato fija **qué** debe definirse y las condiciones que debe cumplir.

| Grupo | Tokens | Condición verificable |
|---|---|---|
| Marca | `primitive.<marca>.50…950`; `semantic.primary.*` | `primary.color` sobre `surface.0` y `contrastColor` sobre `primary.color`: ≥ 4,5:1 en cada modo |
| Superficies | `colorScheme.{light,dark}.surface.0…950` | Texto (`text.color`) sobre `surface.0` y sobre el fondo del layout: ≥ 4,5:1; `text.mutedColor`: ≥ 4,5:1 |
| Controles | `formField.borderColor`, `formField.focusBorderColor` | Borde de campo frente al fondo: ≥ 3:1 en cada modo |
| Foco | `focusRing.{width,style,color,offset}` | Visible en ambos modos: ≥ 3:1 frente al fondo adyacente |
| Densidad | `formField.paddingY`, `navigation.item.padding`, tamaño del botón | Altura de controles interactivos ≥ 44 px a 360 px |
| Tipografía | Familia en `_core.scss` y en el bloque `@theme` de `tailwind.css` | Campos de formulario ≥ 16 px en móvil; respaldo declarado |
| Radios | `borderRadius.{sm,md,lg,xl}` | Coherentes con la dirección |
| Movimiento | `transitionDuration` | Cero con `prefers-reduced-motion: reduce` (R6) |

## PageHeader (`shared/components/page-header`)

| Entrada | Tipo | Obligatoria |
|---|---|---|
| `title` | `string` | Sí; se renderiza como `<h1>` |
| `description` | `string` | No |
| Contenido proyectado `[pageHeaderAction]` | Botón u otra acción | No |

Comportamiento:
- En el celular, la acción no se pierde de vista: queda junto al título o fija al pie si no cabe.
- Un solo `<h1>` por página.

## BrandMark (`shared/components/brand-mark`)

Marca tipográfica provisional definida en `DESIGN.md`.

| Entrada | Tipo | Notas |
|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `sm` en el topbar, `lg` en el layout de acceso |

Es texto real (no imagen), con `aria-label="PlayerTech"` cuando se decora.

## Listado adaptable (sedes)

| Ancho | Presentación | Contenido |
|---|---|---|
| < `md` (768 px) | Lista `<ul>` de tarjetas | Nombre, marca "Principal", tipo, ciudad, `p-tag` de estado y botón de acciones (`p-menu`) de 44 px |
| ≥ `md` | `p-table` | Columnas: nombre (con "Principal"), tipo, ciudad, estado, acciones; ordenamiento por nombre y ciudad; paginación de 10 |

En ambos casos: buscador y filtro de estado encima, estado vacío ("Aún no hay sedes" o "Ninguna sede coincide con la búsqueda", con acción para limpiar) y estado de error con reintento.

## Maqueta de escritura (FR-018a)

| Elemento | Comportamiento |
|---|---|
| "Nueva sede" y "Editar" | Abren `p-drawer`: a la derecha en escritorio, a pantalla completa en móvil (`[fullScreen]`). El formulario muestra los campos de HU-029 y los valores actuales al editar |
| Pie del drawer | "Cancelar" activo; "Guardar" deshabilitado; `p-message` informativo "Disponible próximamente" visible sin desplazarse |
| Cerrar el drawer con cambios sin guardar | `p-confirmdialog` "¿Descartar los cambios?" con "Seguir editando" y "Descartar". Es la confirmación real del patrón, no una maqueta |
| "Desactivar" y "Eliminar" en el menú de fila | Deshabilitados, con el texto "Próximamente". La confirmación de eliminar y el aviso (`p-toast`) tras guardar quedan definidos por tokens y en `DESIGN.md`, y se usan por primera vez en HU-031 |
| "Completa tu academia" | Lista de tareas con enlace; sin contador ni estado de completado |

Ninguna acción de la maqueta llama a un repositorio de escritura.

## Rutas afectadas

| Ruta | Antes | Ahora |
|---|---|---|
| `/home` | Placeholder | `HomePage` (resumen real y maqueta de tareas) |
| `/settings/venues` | Placeholder | `VenuesPage` (`features/venues/venues.routes.ts`) |
| `/settings/academy` | Placeholder | Sin cambios de contenido; adopta encabezado e identidad (HU-017) |
