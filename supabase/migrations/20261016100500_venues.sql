-- Sedes: oficinas o lugares de entrenamiento (DEC-04, DEC-05, DEC-23 a DEC-27).

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  name text not null,
  type text not null default 'training_ground' check (type in ('office', 'training_ground')),
  address text,
  city text,
  directions text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venues_academy_id_id_key unique (academy_id, id),
  -- La sede principal siempre está activa y no eliminada (FR-022).
  constraint venues_primary_is_active check (not is_primary or (is_active and deleted_at is null))
);

comment on table public.venues is 'Sedes de la academia. Borrado lógico con deleted_at.';

-- Como máximo una sede principal por academia (FR-022). Que exista siempre una
-- lo garantizan el registro, el CHECK anterior y set_primary_venue().
create unique index venues_one_primary_per_academy
  on public.venues (academy_id)
  where is_primary and deleted_at is null;

-- Nombre único por academia entre sedes no eliminadas, sin distinguir mayúsculas (FR-023).
create unique index venues_unique_name_per_academy
  on public.venues (academy_id, lower(name))
  where deleted_at is null;

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();
