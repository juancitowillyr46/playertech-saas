-- Actividades y canchas externas (spec 011; DEC-32 y DEC-44).

-- ============================================================
-- 1. Canchas externas
-- ============================================================

create table public.external_fields (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  name text not null check (length(trim(name)) between 1 and 80),
  address text check (address is null or length(address) <= 160),
  city text check (city is null or length(city) <= 80),
  directions text check (directions is null or length(directions) <= 500),
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_fields_academy_id_id_key unique (academy_id, id)
);

comment on table public.external_fields is 'Canchas donde la academia juega torneos (DEC-32). No son sedes. Borrado lógico con deleted_at.';

create unique index external_fields_unique_name_per_academy
  on public.external_fields (academy_id, lower(trim(name)))
  where deleted_at is null;

create trigger external_fields_set_updated_at
  before update on public.external_fields
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. Actividades
-- ============================================================

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  type text not null check (type in ('training', 'competition')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  call_at timestamptz,
  venue_id uuid,
  external_field_id uuid,
  notes text check (notes is null or length(notes) <= 500),
  opponent text check (opponent is null or length(trim(opponent)) between 1 and 80),
  tournament text check (tournament is null or length(trim(tournament)) between 1 and 80),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  series_id uuid,
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_academy_id_id_key unique (academy_id, id),
  constraint activities_one_place check (num_nonnulls(venue_id, external_field_id) = 1),
  constraint activities_ends_after_start check (ends_at is null or ends_at > starts_at),
  constraint activities_call_before_start check (call_at is null or call_at <= starts_at),
  constraint activities_competition_details check (type = 'competition' or (opponent is null and tournament is null)),
  foreign key (academy_id, venue_id) references public.venues (academy_id, id),
  foreign key (academy_id, external_field_id) references public.external_fields (academy_id, id)
);

comment on table public.activities is 'Entrenamientos y competencias (DEC-44). Una actividad pasada solo admite borrado lógico.';

create index activities_academy_starts_idx on public.activities (academy_id, starts_at) where deleted_at is null;

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Reglas de tiempo y lugar en la base de datos (FR-002, FR-003 y FR-007).
create or replace function public.activities_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.starts_at <= now() then
    -- Una actividad pasada no se modifica: solo se elimina (decisión del responsable).
    if (new.type, new.starts_at, new.ends_at, new.call_at, new.venue_id, new.external_field_id,
        new.notes, new.opponent, new.tournament, new.status)
       is distinct from
       (old.type, old.starts_at, old.ends_at, old.call_at, old.venue_id, old.external_field_id,
        old.notes, old.opponent, old.tournament, old.status) then
      raise exception 'activity_is_past' using errcode = '23514';
    end if;

    return new;
  end if;

  if new.starts_at <= now() then
    raise exception 'activity_in_past' using errcode = '23514';
  end if;

  -- El lugar debe estar vigente cuando se elige: sede activa o cancha no retirada, de la misma academia.
  if tg_op = 'INSERT'
     or new.venue_id is distinct from old.venue_id
     or new.external_field_id is distinct from old.external_field_id then
    if new.venue_id is not null and not exists (
      select 1 from public.venues v
      where v.id = new.venue_id and v.academy_id = new.academy_id and v.is_active and v.deleted_at is null
    ) then
      raise exception 'place_unavailable' using errcode = '23514';
    end if;

    if new.external_field_id is not null and not exists (
      select 1 from public.external_fields f
      where f.id = new.external_field_id and f.academy_id = new.academy_id and f.deleted_at is null
    ) then
      raise exception 'place_unavailable' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.activities_guard() from public, anon, authenticated;

create trigger activities_guard
  before insert or update on public.activities
  for each row execute function public.activities_guard();

-- ============================================================
-- 3. RLS, políticas y privilegios
-- ============================================================

alter table public.external_fields enable row level security;
alter table public.activities enable row level security;

revoke all on table public.external_fields, public.activities from anon, authenticated;

grant select on public.external_fields, public.activities to authenticated;

grant insert (academy_id, name, address, city, directions, created_by) on public.external_fields to authenticated;
grant update (name, address, city, directions, deleted_at) on public.external_fields to authenticated;

grant insert (academy_id, type, starts_at, ends_at, call_at, venue_id, external_field_id, notes, opponent, tournament, series_id, created_by)
  on public.activities to authenticated;
grant update (type, starts_at, ends_at, call_at, venue_id, external_field_id, notes, opponent, tournament, status, deleted_at)
  on public.activities to authenticated;

create policy external_fields_select_member on public.external_fields for select to authenticated
  using (public.is_academy_member(academy_id));
create policy external_fields_insert_owner on public.external_fields for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and created_by = public.current_user_id());
create policy external_fields_update_owner on public.external_fields for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

create policy activities_select_member on public.activities for select to authenticated
  using (public.is_academy_member(academy_id));
create policy activities_insert_owner on public.activities for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and created_by = public.current_user_id());
create policy activities_update_owner on public.activities for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));
