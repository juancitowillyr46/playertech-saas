# Contratos del perfil de la academia

## AcademyProfileRepository (`features/academy-profile/data/`)

```ts
abstract class AcademyProfileRepository {
    /** Perfil de la academia del contexto, con el plan y el logo vigente. */
    abstract getProfile(): Promise<AcademyProfile>;
    /** Guarda los cinco campos editables y devuelve el perfil actualizado. */
    abstract updateProfile(input: AcademyProfileInput): Promise<AcademyProfile>;
    /** Asigna (o retira con null) el logo de la academia. */
    abstract setLogo(fileId: string | null): Promise<void>;
}
```

La implementación Supabase toma `academy_id` de `AcademyContextService` (sin academia: `forbidden`) y traduce snake_case a camelCase. Errores: `mapSupabaseError`. Una actualización que no afecta ninguna fila es `not_found`.

## AcademyProfileService (`features/academy-profile/services/`)

| Miembro | Comportamiento |
|---|---|
| `profile`, `status`, `busy` | Señales de solo lectura |
| `load()` | Lee el perfil |
| `save(input)` | Limpia el input, guarda, actualiza `profile` y el contexto (`applyAcademyChanges({ name })`) |
| `replaceLogo(file)` | Valida (`validateLogoFile`), prepara (`prepareLogoImage`), sube, asigna y purga el anterior (research R4). Actualiza `profile` y el contexto (`logoFileId`) |
| `removeLogo()` | Asigna `null` y purga el anterior. Actualiza `profile` y el contexto |

Mientras `busy` es verdadero, las demás operaciones se ignoran (doble toque). Ante `not_found`, recarga el perfil.

## Pantalla `/settings/academy`

| Elemento | Comportamiento |
|---|---|
| Cabecera | «Academia», con el plan como dato de solo lectura |
| Logo | Imagen actual o iniciales. Botones «Cambiar logo» (o «Subir logo») y «Retirar logo» (este con confirmación). Ayuda: «JPG o PNG, hasta 5 MB.». El error del archivo va junto al logo |
| Formulario | Nombre (obligatorio), teléfono (`type=tel`), correo de contacto (`type=email`, con la ayuda «No cambia el correo con el que inicias sesión.»), dirección (con la ayuda «Dirección de contacto de la academia. Las de tus sedes se editan en Sedes.», con enlace a Sedes) y ciudad. Errores junto al campo al salir y al guardar |
| Guardar | Botón principal con estado de carga; aviso «Cambios guardados.» |
| Salir con cambios | Al navegar dentro de la app: confirmación «Tienes cambios sin guardar» con «Descartar» y «Seguir editando». Cerrar o recargar la pestaña no la pide |
| Errores | Mensaje del catálogo; el formulario conserva lo escrito |

## Validación del logo (`features/academy-profile/validators/logo-file.ts`)

`validateLogoFile(file: File): Promise<'type' | 'size' | null>`, según `data-model.md`. Mensajes: `type` → «Usa una imagen JPG o PNG.»; `size` → «La imagen pesa más de 5 MB.».

## Preparación del logo (`features/academy-profile/data/logo-image.ts`)

`prepareLogoImage(file: File): Promise<File>` redimensiona (lado mayor de 512 px como máximo) y comprime en el mismo formato. El resultado nunca supera 1 MB (research R5b).

## FileStorageRepository (`core/storage`, ampliación)

```ts
/** Marca el registro como eliminado y borra la imagen del almacenamiento (DEC-22, excepción de ADR-013). */
abstract purge(file: StoredFile): Promise<void>;
```

## Contexto de academia

`AcademyContextService.applyAcademyChanges(changes: Partial<Pick<CurrentAcademy, 'name' | 'logoFileId'>>): void`. Actualiza la academia actual sin cambiar `status`.

## Inicio

`HomeSummary` añade `tasks: readonly HomeTask[]` y `completedCount: number`, con `HomeTask = { key, label, done, route | null }` (tabla en `data-model.md`). La sección «Completa tu academia» muestra el contador «n de 4» y cada tarea con su estado en texto. Se oculta con las cuatro completas.
