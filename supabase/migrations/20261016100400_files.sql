-- Registro de archivos con almacenamiento portable (ADR-013; research R6).

create table public.files (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  bucket text not null check (bucket in ('public-assets', 'private-files')),
  storage_key text not null unique,
  module text not null,
  entity_id uuid not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint files_academy_id_id_key unique (academy_id, id),
  -- La clave pertenece a la academia de la fila: ninguna academia puede ocupar
  -- las claves de otra, porque storage_key es única en toda la tabla.
  constraint files_storage_key_in_academy check (storage_key like academy_id::text || '/%')
);

comment on table public.files is 'Archivos almacenados de forma portable. storage_key = {academy_id}/{módulo}/{entity_id}/{file_id}.{ext}, sin dominio ni proveedor.';

-- El logo solo puede ser un archivo de la propia academia (FR-006).
alter table public.academies
  add constraint academies_logo_file_fk
  foreign key (id, logo_file_id) references public.files (academy_id, id);
