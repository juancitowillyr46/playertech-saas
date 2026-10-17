-- Almacenamiento portable y aislado por academia (ADR-013; research R10).
-- Los buckets se crean aquí, y no solo en config.toml, para que se apliquen igual
-- en la nube. El tipo y el tamaño los aplica la API de Storage según la
-- configuración del bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 1048576, array['image/jpeg', 'image/png']),
  ('private-files', 'private-files', false, null, null)
on conflict (id) do nothing;

-- Academia a la que pertenece un objeto: el primer segmento de su ruta, si es un
-- UUID. Devuelve NULL en cualquier otro caso, y is_academy_member(NULL) es falso.
create or replace function public.storage_object_academy_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when (storage.foldername(p_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then ((storage.foldername(p_name))[1])::uuid
  end;
$$;

revoke execute on function public.storage_object_academy_id(text) from public, anon;
grant execute on function public.storage_object_academy_id(text) to authenticated;

-- Escritura y gestión: solo miembros de la academia del prefijo, en ambos buckets.
create policy academy_objects_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('public-assets', 'private-files')
    and public.is_academy_member(public.storage_object_academy_id(name))
  );

create policy academy_objects_update
  on storage.objects for update to authenticated
  using (
    bucket_id in ('public-assets', 'private-files')
    and public.is_academy_member(public.storage_object_academy_id(name))
  )
  with check (
    bucket_id in ('public-assets', 'private-files')
    and public.is_academy_member(public.storage_object_academy_id(name))
  );

create policy academy_objects_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('public-assets', 'private-files')
    and public.is_academy_member(public.storage_object_academy_id(name))
  );

-- Lectura vía API (listar, descargar, firmar URL): solo miembros de la academia.
-- La lectura pública de public-assets se hace por su URL pública, que no pasa por
-- RLS; por eso no se concede SELECT a anon, lo que evitaría que cualquiera pueda
-- listar las claves de todas las academias.
create policy academy_objects_select
  on storage.objects for select to authenticated
  using (
    bucket_id in ('public-assets', 'private-files')
    and public.is_academy_member(public.storage_object_academy_id(name))
  );
