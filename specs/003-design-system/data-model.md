# Modelo de datos: Sistema de diseño PlayerTech

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Esta spec no crea tablas ni migraciones. Define:
- dos **modelos de lectura** del frontend sobre tablas existentes de la spec 001 (`docs/architecture/database-schema.md`);
- los **artefactos de diseño** que se producen.

## Modelos de lectura (frontend)

### Venue (`features/venues/models/venue.models.ts`)

Proyección de solo lectura de `public.venues` (R9).

| Campo | Tipo | Origen | Reglas |
|---|---|---|---|
| `id` | `string` | `venues.id` | — |
| `name` | `string` | `venues.name` | Obligatorio; se recorta visualmente si es largo, con el texto completo accesible |
| `type` | `'office' \| 'training_ground'` | `venues.type` | Etiqueta en la interfaz según el glosario: "Oficina" o "Lugar de entrenamiento" |
| `city` | `string \| null` | `venues.city` | Sin valor se muestra "Sin ciudad" en texto atenuado |
| `isPrimary` | `boolean` | `venues.is_primary` | Como máximo una por academia (garantía de la base de datos) |
| `isActive` | `boolean` | `venues.is_active` | `p-tag` con el texto "Activa" o "Inactiva" |

Consulta:
- Solo sedes con `deleted_at is null` (CA-004 de HU-030).
- Orden: principal primero y después por nombre (`localeCompare` con `es-CO`).
- RLS limita el resultado a la academia del miembro. No se envía `academy_id`.

Estado de la vista: `loading → ready | empty | error`. La búsqueda (por nombre y ciudad, sin distinguir mayúsculas ni tildes) y el filtro por estado (`todas | activas | inactivas`) se aplican en el cliente.

### HomeSummary (`features/home/models/home-summary.models.ts`)

| Campo | Tipo | Origen | Reglas |
|---|---|---|---|
| `academyName` | `string` | Contexto de academia existente | — |
| `logoUrl` | `string \| null` | `academies.logo_file_id` → fila de `files` (`StoredFile`) → `FileStorageRepository.getUrl()` | Sin logo, o si la URL falla, se muestran las iniciales del nombre (máximo 2 letras) |
| `planName` | `string \| null` | `subscriptions` (activa) → `plans.name` | Sin suscripción activa se muestra "Sin plan activo" |
| `primaryVenue` | `{ name: string; city: string \| null } \| null` | `venues` con `is_primary` y no eliminada | Sin sede principal se muestra un estado vacío con enlace a Sedes |

Estado de la vista: `loading → ready | error`.

### Tareas recomendadas de "Completa tu academia" (maqueta)

Lista estática definida en la feature de inicio. **No se calcula** si cada tarea está completa (HU-032).

| Tarea | Destino |
|---|---|
| Sube el logo de tu academia | `/settings/academy` |
| Completa los datos de contacto | `/settings/academy` |
| Revisa tus sedes | `/settings/venues` |

## Artefactos de diseño

| Artefacto | Ubicación | Contenido | Estado |
|---|---|---|---|
| Brief de producto | `PRODUCT.md` | Esquema de Impeccable (`impeccable:product-schema 1`): plataforma `web`, usuarios, propósito, posicionamiento, voz y restricciones. Enlaza a `docs/product/vision.md` | `borrador → aprobado` (aprobación registrada en el propio archivo con la fecha) |
| Dirección visual | Página de decisión y *surface brief* de Impeccable (`.impeccable/`) | 2 o 3 direcciones, más la salida "estándar de la categoría". Se elige una | `propuestas → elegida`. La elegida queda como contrato de dirección |
| Sistema visual | `DESIGN.md` | Paleta y roles de color, superficies por modo, tipografía y escala, radios, foco, densidad, movimiento, marca tipográfica, estados (carga, vacío, error), reglas de uso, correspondencia con el preset y nota sobre el HTML de correo | Se escribe al final desde lo construido (R1) |
| Preset | `frontend/src/app/core/theme/playertech-preset.ts` | Tokens de [contracts/ui-contracts.md](./contracts/ui-contracts.md) | — |
| Plantillas de correo | `supabase/templates/*.html` | Ver [contracts/email-templates.md](./contracts/email-templates.md) | — |

## Relaciones

```text
T-01 brief ──► PRODUCT.md ──► direcciones ──► dirección elegida ──► preset + layout + Tailwind
                                                     │                        │
                                                     └────────► DESIGN.md ◄───┘ (documentado desde lo construido)
                                                                   │
                                          ui.md (patrones) ◄───────┤
                                          plantillas de correo ◄───┘ (colores copiados de los tokens)
```
