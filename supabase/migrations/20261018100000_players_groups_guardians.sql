-- Jugadores, grupos, integrantes, acudientes y vínculos (spec 009; ADR-012, ADR-017, ADR-018).

-- ============================================================
-- 1. Funciones auxiliares
-- ============================================================

-- Usuario actual (ADR-017): único punto que conoce auth.uid() para las tablas nuevas.
create or replace function public.current_user_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid();
$$;

comment on function public.current_user_id() is 'Usuario autenticado actual. Al cambiar de backend solo cambia esta función (ADR-017).';

-- Nombre comparable: minúsculas, sin tildes y con los espacios colapsados (DEC-42).
create or replace function public.normalize_name(p_text text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select regexp_replace(
    lower(extensions.unaccent('extensions.unaccent'::regdictionary, trim(coalesce(p_text, '')))),
    '\s+', ' ', 'g'
  );
$$;

comment on function public.normalize_name(text) is 'Normaliza nombres para detectar duplicados sin distinguir mayúsculas, tildes ni espacios (DEC-42).';

-- Fecha de nacimiento no futura ni de hace más de 100 años, con la fecha de Colombia (FR-002).
create or replace function public.check_birth_date()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Bogota')::date;
begin
  if new.birth_date > v_today or new.birth_date < v_today - interval '100 years' then
    raise exception 'birth_date_out_of_range' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_birth_date() from public, anon, authenticated;

-- ============================================================
-- 2. Tablas
-- ============================================================

create table public.players (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  first_names text not null check (length(trim(first_names)) between 1 and 80),
  last_names text not null check (length(trim(last_names)) between 1 and 80),
  nickname text check (nickname is null or length(trim(nickname)) between 1 and 40),
  birth_date date not null check (birth_date >= date '1900-01-01'),
  phone text check (phone ~ '^3[0-9]{9}$'),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_academy_id_id_key unique (academy_id, id)
);

comment on table public.players is 'Jugadores de la academia (HU-002, DEC-36). Borrado lógico con deleted_at.';

-- Un jugador no eliminado por nombre completo normalizado y fecha de nacimiento (DEC-42).
create unique index players_unique_identity
  on public.players (academy_id, public.normalize_name(first_names || ' ' || last_names), birth_date)
  where deleted_at is null;

create trigger players_check_birth_date
  before insert or update of birth_date on public.players
  for each row execute function public.check_birth_date();

create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  name text not null check (length(trim(name)) between 1 and 60),
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_academy_id_id_key unique (academy_id, id)
);

comment on table public.groups is 'Grupos de jugadores (HU-004, DEC-35). Borrado lógico con deleted_at.';

create unique index groups_unique_name_per_academy
  on public.groups (academy_id, lower(trim(name)))
  where deleted_at is null;

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

-- Relación sin historia: borrado físico (excepción justificada en el plan).
create table public.group_members (
  academy_id uuid not null,
  group_id uuid not null,
  player_id uuid not null,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (group_id, player_id),
  foreign key (academy_id, group_id) references public.groups (academy_id, id),
  foreign key (academy_id, player_id) references public.players (academy_id, id)
);

comment on table public.group_members is 'Integrantes de cada grupo. Borrado físico: relación sin historia (plan de la spec 009).';

create index group_members_player_id_idx on public.group_members (player_id);

-- Al eliminar un grupo se quitan sus integrantes en la misma operación (FR-009).
create or replace function public.groups_remove_members()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.group_members where group_id = new.id;
  return null;
end;
$$;

revoke execute on function public.groups_remove_members() from public, anon, authenticated;

create trigger groups_remove_members
  after update of deleted_at on public.groups
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function public.groups_remove_members();

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  phone text not null check (phone ~ '^3[0-9]{9}$'),
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardians_academy_id_id_key unique (academy_id, id)
);

comment on table public.guardians is 'Acudientes: la persona, identificada en la academia por su celular (DEC-40).';

create unique index guardians_unique_phone_per_academy
  on public.guardians (academy_id, phone)
  where deleted_at is null;

create trigger guardians_set_updated_at
  before update on public.guardians
  for each row execute function public.set_updated_at();

create table public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  guardian_id uuid not null,
  player_id uuid not null,
  relationship text not null check (relationship in ('mother', 'father', 'grandparent', 'other', 'self')),
  status text not null default 'validated' check (status in ('pending', 'validated', 'rejected')),
  consent_document_id uuid not null references public.legal_documents (id),
  consent_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (academy_id, guardian_id) references public.guardians (academy_id, id),
  foreign key (academy_id, player_id) references public.players (academy_id, id)
);

comment on table public.guardian_links is 'Vínculo acudiente-jugador con su parentesco y la autorización de datos (DEC-39, DEC-40).';

create unique index guardian_links_unique_pair
  on public.guardian_links (guardian_id, player_id)
  where deleted_at is null;

create index guardian_links_player_id_idx on public.guardian_links (player_id);

create trigger guardian_links_set_updated_at
  before update on public.guardian_links
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. RLS, políticas y privilegios
-- ============================================================

alter table public.players enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.guardians enable row level security;
alter table public.guardian_links enable row level security;

revoke all on table
  public.players, public.groups, public.group_members, public.guardians, public.guardian_links
from anon, authenticated;

grant select on public.players, public.groups, public.group_members, public.guardians, public.guardian_links
  to authenticated;

grant insert (academy_id, first_names, last_names, nickname, birth_date, phone, is_active, created_by)
  on public.players to authenticated;
grant update (first_names, last_names, nickname, birth_date, phone, is_active, deleted_at)
  on public.players to authenticated;

grant insert (academy_id, name, created_by) on public.groups to authenticated;
grant update (name, deleted_at) on public.groups to authenticated;

grant insert (academy_id, group_id, player_id, created_by) on public.group_members to authenticated;
grant delete on public.group_members to authenticated;

-- Acudientes y vínculos solo se crean con add_player_guardian().
grant update (full_name, phone, deleted_at) on public.guardians to authenticated;
grant update (relationship, deleted_at) on public.guardian_links to authenticated;

create policy players_select_member on public.players for select to authenticated
  using (public.is_academy_member(academy_id));
create policy players_insert_owner on public.players for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and created_by = public.current_user_id());
create policy players_update_owner on public.players for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

create policy groups_select_member on public.groups for select to authenticated
  using (public.is_academy_member(academy_id));
create policy groups_insert_owner on public.groups for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and created_by = public.current_user_id());
create policy groups_update_owner on public.groups for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

create policy group_members_select_member on public.group_members for select to authenticated
  using (public.is_academy_member(academy_id));
create policy group_members_insert_owner on public.group_members for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and created_by = public.current_user_id());
create policy group_members_delete_owner on public.group_members for delete to authenticated
  using (public.has_academy_role(academy_id, array['owner']));

create policy guardians_select_member on public.guardians for select to authenticated
  using (public.is_academy_member(academy_id));
create policy guardians_update_owner on public.guardians for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

create policy guardian_links_select_member on public.guardian_links for select to authenticated
  using (public.is_academy_member(academy_id));
create policy guardian_links_update_owner on public.guardian_links for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

-- ============================================================
-- 4. Funciones de negocio
-- ============================================================

-- Jugador no eliminado de la academia actual con la misma identidad (DEC-42).
create or replace function public.find_player_by_identity(p_first_names text, p_last_names text, p_birth_date date)
returns setof public.players
language sql
stable
security invoker
set search_path = ''
as $$
  select p.*
  from public.players p
  where p.academy_id = public.current_academy_id()
    and p.deleted_at is null
    and p.birth_date = p_birth_date
    and public.normalize_name(p.first_names || ' ' || p.last_names)
      = public.normalize_name(p_first_names || ' ' || p_last_names);
$$;

comment on function public.find_player_by_identity(text, text, date) is 'Busca el jugador ya registrado para ofrecer actualizarlo (DEC-42).';

-- Vincula un acudiente a un jugador; reutiliza la persona por su celular (DEC-39, DEC-40).
-- security definer: es la única vía para insertar en guardians y guardian_links, y
-- comprueba explícitamente que quien llama es owner de la academia del jugador.
create or replace function public.add_player_guardian(
  p_player_id uuid,
  p_full_name text,
  p_phone text,
  p_relationship text,
  p_consent boolean
)
returns table (guardian_id uuid, link_id uuid, guardian_existed boolean, guardian_name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_academy_id uuid;
  v_guardian_id uuid;
  v_guardian_name text;
  v_existed boolean := true;
  v_link_id uuid;
begin
  if p_consent is not true then
    raise exception 'consent_required' using errcode = '22023';
  end if;

  if p_relationship is null or p_relationship not in ('mother', 'father', 'grandparent', 'other') then
    raise exception 'invalid_relationship' using errcode = '23514';
  end if;

  select pl.academy_id into v_academy_id
  from public.players pl
  where pl.id = p_player_id and pl.deleted_at is null;

  if v_academy_id is null or not public.has_academy_role(v_academy_id, array['owner']) then
    raise exception 'player_not_found' using errcode = '42501';
  end if;

  select g.id, g.full_name into v_guardian_id, v_guardian_name
  from public.guardians g
  where g.academy_id = v_academy_id and g.phone = p_phone and g.deleted_at is null;

  if v_guardian_id is null then
    v_existed := false;
    insert into public.guardians (academy_id, full_name, phone, created_by)
    values (v_academy_id, trim(p_full_name), p_phone, public.current_user_id())
    returning id, full_name into v_guardian_id, v_guardian_name;
  end if;

  insert into public.guardian_links (
    academy_id, guardian_id, player_id, relationship, status, consent_document_id, consent_at, created_by
  )
  values (
    v_academy_id, v_guardian_id, p_player_id, p_relationship, 'validated',
    (select d.id from public.legal_documents d where d.type = 'privacy_policy' and d.is_current),
    now(), public.current_user_id()
  )
  returning id into v_link_id;

  return query select v_guardian_id, v_link_id, v_existed, v_guardian_name;
end;
$$;

comment on function public.add_player_guardian(uuid, text, text, text, boolean) is 'Agrega un acudiente validado a un jugador con la autorización de datos (HU-034).';

revoke execute on function public.current_user_id() from public, anon;
revoke execute on function public.find_player_by_identity(text, text, date) from public, anon;
revoke execute on function public.add_player_guardian(uuid, text, text, text, boolean) from public, anon;

grant execute on function public.current_user_id() to authenticated;
grant execute on function public.find_player_by_identity(text, text, date) to authenticated;
grant execute on function public.add_player_guardian(uuid, text, text, text, boolean) to authenticated;
