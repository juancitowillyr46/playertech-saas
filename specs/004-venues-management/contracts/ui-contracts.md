# Contrato: interfaz de Sedes

Parte de la pantalla modelo de la spec 003 (`specs/003-design-system/contracts/ui-contracts.md`): listado, encabezado, chasis y estados se mantienen; cambia la maqueta por funciones reales.

## Formulario (drawer)

| Elemento | Comportamiento |
|---|---|
| Título | «Nueva sede» o «Editar sede» |
| Campos | Nombre de la sede (obligatorio), Tipo (por defecto «Lugar de entrenamiento»), Dirección, Ciudad, Indicaciones (opcionales). Al editar, con los datos actuales |
| Validación | Al salir del campo o al guardar: «Ingresa el nombre de la sede.» o «Ya existe una sede con ese nombre.» bajo el campo, con `aria-invalid` y `aria-describedby` |
| Guardar | Activo; con estado de carga; impide envíos repetidos |
| Error general | `p-message` en el formulario (red, permiso, regla); lo escrito se conserva |
| Éxito | Se cierra el drawer y aparece un aviso: «Sede creada.» o «Cambios guardados.» |
| Cerrar con cambios | Confirmación «¿Descartar los cambios?» (sin cambios, se cierra sin preguntar) |
| Celular | A pantalla completa; acciones al pie siempre visibles |

## Menú de cada sede

Las acciones no disponibles se ven deshabilitadas con el motivo entre paréntesis (FR-017).

| Acción | Sede activa no principal | Sede principal | Sede inactiva |
|---|---|---|---|
| Editar | ✅ | ✅ | ✅ |
| Marcar como principal | ✅ | Deshabilitada: «(ya es la principal)» | Deshabilitada: «(reactívala primero)» |
| Desactivar / Reactivar | «Desactivar» ✅ | «Desactivar» deshabilitada: «(marca otra como principal)» | «Reactivar» ✅ |
| Eliminar | ✅ con confirmación | Deshabilitada: «(marca otra como principal)» | ✅ con confirmación |

Mientras una operación está en curso, el menú y el botón «Nueva sede» no lanzan otra.

## Confirmación de eliminar

| Elemento | Contenido |
|---|---|
| Título | «¿Eliminar «{nombre}»?» |
| Mensaje | «Dejará de aparecer en PlayerTech. Esta acción no se puede deshacer desde la aplicación.» |
| Botones | «Cancelar» (contorno) y «Eliminar» (peligro) |

## Avisos (p-toast, ya global)

| Operación | Aviso |
|---|---|
| Crear | «Sede creada.» |
| Editar | «Cambios guardados.» |
| Marcar como principal | ««{nombre}» es ahora la sede principal.» |
| Desactivar / Reactivar | «Sede desactivada.» / «Sede reactivada.» |
| Eliminar | «Sede eliminada.» |
| Error de una acción del menú | Aviso de error con el mensaje de [app-errors.md](./app-errors.md) |
