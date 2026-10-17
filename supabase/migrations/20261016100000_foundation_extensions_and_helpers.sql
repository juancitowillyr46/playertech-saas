-- Extensiones y funciones auxiliares de la Fase 1 (spec 001, research R3 y R13).
-- pgTAP no se instala aquí: lo habilitan las pruebas (tests/database/000-test-helpers.test.sql).

create extension if not exists unaccent with schema extensions;

-- Mantiene updated_at en cada actualización.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Convierte un texto en un identificador amigable: sin tildes, en minúsculas,
-- con guiones en lugar de cualquier carácter no alfanumérico, sin guiones
-- repetidos ni en los extremos. Si el resultado queda vacío, devuelve 'academia'.
create or replace function public.slugify(p_text text)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(p_text, ''))), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'academia'
  );
$$;

-- Funciones internas: no se exponen a los clientes.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.slugify(text) from public, anon, authenticated;
