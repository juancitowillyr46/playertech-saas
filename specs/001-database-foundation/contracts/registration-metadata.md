# Contrato: metadatos del registro

Contrato entre el cliente que registra una cuenta (la spec 002 y HU-014) y la función `handle_new_user()`.

## Origen

El cliente envía los datos en el registro de Supabase Auth, en `options.data`. Supabase Auth los guarda en `auth.users.raw_user_meta_data`.

## Estructura

```json
{
  "academy_name": "Academia Fútbol Club",
  "full_name": "Juan Pérez",
  "legal_acceptances": {
    "terms": "2026-10-v1",
    "privacy_policy": "2026-10-v1"
  }
}
```

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `academy_name` | texto | Sí | No vacío tras recortar espacios |
| `full_name` | texto | Sí | No vacío tras recortar espacios |
| `legal_acceptances.terms` | texto | Sí | Igual a la versión vigente de `terms` |
| `legal_acceptances.privacy_policy` | texto | Sí | Igual a la versión vigente de `privacy_policy` |

El correo y la contraseña viajan en los campos propios del registro de Supabase Auth, no en estos metadatos.

## Resultado

| Caso | Resultado observable |
|---|---|
| Datos válidos | Se crea la cuenta, pendiente de verificar el correo, con todos los datos de la academia (spec, Historia 3) |
| Falta un campo o una versión no coincide | El registro falla con un error genérico y **no se crea nada** |
| El correo ya existe | Supabase Auth no crea un usuario nuevo y no se crea ninguna academia; el cliente muestra el mensaje genérico (DEC-12) |

## Cómo obtiene el cliente las versiones vigentes

El cliente lee `legal_documents` filtrando por `is_current = true` antes de mostrar el formulario. La lectura de esta tabla está permitida para `anon` y `authenticated`, porque los documentos legales son públicos.
