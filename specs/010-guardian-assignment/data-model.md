# Modelo de datos: Asignar acudientes ya registrados

Migración `supabase/migrations/20261018110000_guardian_consent_and_assignment.sql`. Parte del modelo de la spec 009 (`specs/009-players-guardians-groups/data-model.md`); aquí solo los cambios.

## guardians (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `consent_document_id` | uuid FK legal_documents | **Nueva**, obligatoria: la Política vigente cuando se registró la persona (DEC-39 ajustada) |
| `consent_at` | timestamptz | **Nueva**, obligatoria: hora del servidor |

Las columnas nuevas no son actualizables por `authenticated`: solo las escriben las funciones.

## guardian_links (cambia)

- Pierden `consent_document_id` y `consent_at` (se trasladan a `guardians`).
- Sin otros cambios: el único `(guardian_id, player_id) where deleted_at is null` evita los vínculos repetidos.

## Traslado

```text
1. alter table guardians add consent_document_id, consent_at (nulos)
2. update guardians g set (consent_document_id, consent_at) =
     primer vínculo de g (distinct on guardian_id order by created_at), incluidos los retirados
3. alter table guardians alter ... set not null
4. alter table guardian_links drop consent_document_id, consent_at
5. create or replace add_player_guardian (autorización en la persona) y create assign_guardians
```

Todo en la transacción de la migración. En la nube de pruebas se aplica sobre los datos de la spec 009.
