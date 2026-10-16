# UI Architecture

## Propósito

Define las tecnologías, el tema visual y los patrones de interfaz reutilizables de PlayerTech.

Los patrones de este documento se aplican a todas las funcionalidades. El detalle de cada pantalla se define en la spec correspondiente.

## Stack visual

- **SakaiNG** como base de layout y estructura general.
- **PrimeNG** como biblioteca principal de componentes.
- **Tailwind CSS** para composición, espaciado y diseño responsive.
- Estilos propios de PlayerTech solo cuando ninguna de las anteriores resuelve la necesidad.

SakaiNG no debe convertirse en una dependencia conceptual de las funcionalidades del dominio.

## Tema

| Parámetro | Valor |
|---|---|
| Preset | Aura |
| Color primario | `rgb(59, 130, 246)` (paleta `blue` de Aura) |
| Surface | La de Aura por defecto |
| Modo de menú | Estático |
| Modo oscuro | Disponible mediante un único botón claro/oscuro en el topbar |
| Configurador de temas | Oculto para el usuario final |

Mientras no exista un logo definitivo, la marca se muestra como texto ("PlayerTech").

## Arquitectura de información

Se separan dos conceptos:

| Concepto | Contenido | Ubicación |
|---|---|---|
| **Configuración de la academia** | Datos del tenant: perfil, sedes y, más adelante, plan y equipo | Menú lateral → **Configuración** |
| **Cuenta personal** | Datos de la persona y su sesión | Menú de usuario del topbar |

Cuando existan más roles, un usuario podrá tener cuenta personal sin acceso a la configuración de la academia.

```text
TOPBAR       [Logo academia] Nombre de la academia        [☀/☾]  (Iniciales ▾)
                                                                 ├ Mi perfil (MVP+)
                                                                 └ Cerrar sesión
MENÚ LATERAL
├── Inicio                              /home
├── (Fase 2: Jugadores, Acudientes, Actividades, Convocatorias…)
└── CONFIGURACIÓN
    ├── Academia                        /settings/academy
    └── Sedes                           /settings/venues
        (MVP+: Equipo, Plan)
```

## Patrón: layout de autenticación

Todas las pantallas públicas (inicio de sesión, registro, verificación de correo, recuperación, nueva contraseña, acceso denegado y academia suspendida) comparten un layout propio de PlayerTech. No se reutilizan las pantallas de demostración de SakaiNG.

```text
┌─────────────────────────────┬──────────────────────────────┐
│   Logo PlayerTech           │   Título de la pantalla      │
│                             │   Subtítulo                  │
│   Propuesta de valor        │                              │
│   ✓ Beneficio               │   Formulario                 │
│   ✓ Beneficio               │                              │
│   ✓ Beneficio               │   [   Acción principal   ]   │
│                             │                              │
│   (fondo color primario)    │   Enlaces secundarios        │
│                             │   Términos · Privacidad      │
└─────────────────────────────┴──────────────────────────────┘
  Panel de marca: oculto en móvil       Formulario: siempre visible
```

Reglas:

- Etiquetas visibles en todos los campos (no solo marcadores de posición).
- Contraseñas con opción de mostrar u ocultar.
- Errores de campo bajo cada campo; errores generales con `p-message`.
- Botón principal con estado de carga, que impide envíos duplicados.
- Sin opción "Recordarme" (ADR-014).

## Patrón: página de gestión

Todas las gestiones de entidades (sedes y, en la Fase 2, jugadores, acudientes, actividades…) siguen el mismo patrón, tomando como referencia la demo `pages/crud` de SakaiNG pero con un **drawer** en lugar de un diálogo.

```text
┌────────────────────────────────────────────────┬──────────────────────┐
│ Título                           [+ Nuevo …]   │ Nuevo …           ✕  │
│ Descripción breve                              │──────────────────────│
├────────────────────────────────────────────────┤ Campo *              │
│ 🔍 Buscar…                     [Estado ▾]       │ [                  ] │
├────────────────────────────────────────────────┤ Campo                │
│ Columna ↕     Columna      Columna   Estado   ⋮ │ [                  ] │
│ …                                              │                      │
├────────────────────────────────────────────────┤──────────────────────│
│                         ‹ 1 2 ›  10 por página │ [Cancelar] [Guardar] │
└────────────────────────────────────────────────┴──────────────────────┘
```

| Elemento | Componente | Comportamiento |
|---|---|---|
| Encabezado | — | Título, descripción y acción principal |
| Tabla | `p-table` | Búsqueda, filtro por estado, ordenamiento y paginación |
| Estado | `p-tag` | Activa, inactiva u otros estados del dominio |
| Acciones por fila | `p-menu` (`⋮`) | Editar, desactivar o reactivar, eliminar |
| Crear y editar | `p-drawer` (derecha) | Unos 480 px en escritorio, pantalla completa en móvil. Pide confirmación si se cierra con cambios sin guardar |
| Acciones destructivas | `p-confirmdialog` | Confirmación explícita antes de eliminar |
| Resultado | `p-toast` | Aviso tras guardar o al ocurrir un error |

No se incluyen selección múltiple, acciones masivas ni exportación, salvo que una HU lo requiera.

La primera implementación del patrón es la gestión de sedes. Las piezas que se repitan se extraen a `shared/components/` cuando aparezca la segunda gestión.

## Patrón: inicio con tareas pendientes

Tras el registro no hay un asistente de configuración. El inicio muestra una tarjeta **"Completa tu academia"** mientras falten datos recomendados (por ejemplo, logo o datos de contacto), con un enlace a la pantalla donde se completan. La tarjeta desaparece cuando todo está completo (HU-032).

## PrimeNG

PrimeNG es la biblioteca principal para componentes de interfaz y se utiliza cuando existe un componente adecuado: Button, InputText, Password, Select, Table, Drawer, Dialog, ConfirmDialog, Toast, Menu, Message, Tag, DatePicker, FileUpload, entre otros.

Los textos de PrimeNG (calendarios, paginación, mensajes) se configuran en español.

## Tailwind CSS

Tailwind CSS se utiliza para composición de layouts, espaciado, diseño responsive y ajustes visuales. No se introduce CSS personalizado cuando una utilidad o un componente existente resuelve la necesidad.

## Componentes propios

Cuando PrimeNG o SakaiNG no proporcionen una solución adecuada, podrán desarrollarse componentes propios:

- en `shared/components/` si son reutilizables por varias features;
- dentro de `features/<feature>/components/` si pertenecen a una sola funcionalidad.

## Separación UI / dominio

Los componentes visuales no asumen responsabilidades de acceso a Supabase, consultas, reglas de persistencia ni detalles de infraestructura. La UI consume servicios y modelos definidos por la aplicación.
