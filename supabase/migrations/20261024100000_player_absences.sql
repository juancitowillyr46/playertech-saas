-- Spec 015: aviso de inasistencia (research R1 y R2, data-model.md, DEC-48).
-- Solo se registran las ausencias; sin usos nuevos de auth.uid() ni referencias nuevas al
-- esquema auth (ADR-017).

-- ============================================================
-- 1. Ausencias
-- ============================================================

create table public.player_absences (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  activity_id uuid not null,
  player_id uuid not null,
  -- Usuario que marcó; sin clave hacia auth.users (ADR-017).
  marked_by uuid not null default public.current_user_id(),
  marked_at timestamptz not null default clock_timestamp(),
  notified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_absences_activity_player_key unique (activity_id, player_id),
  foreign key (academy_id, activity_id) references public.activities (academy_id, id),
  foreign key (academy_id, player_id) references public.players (academy_id, id)
);

comment on table public.player_absences is 'Jugadores que no llegaron a una actividad, marcados por excepción (DEC-48). Desmarcar es borrado lógico y conserva el último aviso.';
comment on column public.player_absences.notified_at is 'Hora del servidor del último «Avisar» (abrir WhatsApp o copiar); el mensaje no se guarda.';

create trigger player_absences_set_updated_at
  before update on public.player_absences
  for each row execute function public.set_updated_at();

-- Plazo y estado de la actividad, también fuera de la pantalla (FR-009): actividad programada y
-- no eliminada, y desde su inicio hasta el final de ese día en Colombia. Aplica a marcar,
-- desmarcar y avisar: desde el día siguiente todo queda en lectura.
create or replace function public.player_absences_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_starts_at timestamptz;
  v_status text;
begin
  select a.starts_at, a.status into v_starts_at, v_status
  from public.activities a
  where a.id = new.activity_id and a.academy_id = new.academy_id and a.deleted_at is null;

  if v_starts_at is null or v_status <> 'scheduled' then
    raise exception 'activity_not_scheduled' using errcode = '23514';
  end if;
  if now() < v_starts_at
     or now() >= (date_trunc('day', v_starts_at at time zone 'America/Bogota') + interval '1 day') at time zone 'America/Bogota' then
    raise exception 'absence_window_closed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.player_absences_guard() from public, anon, authenticated;

create trigger player_absences_guard
  before insert or update on public.player_absences
  for each row execute function public.player_absences_guard();

alter table public.player_absences enable row level security;

create policy player_absences_select_member on public.player_absences for select to authenticated
  using (public.is_academy_member(academy_id));
create policy player_absences_insert_owner on public.player_absences for insert to authenticated
  with check (public.has_academy_role(academy_id, array['owner']) and marked_by = public.current_user_id());
create policy player_absences_update_owner on public.player_absences for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

revoke all on table public.player_absences from anon, authenticated;
grant select on public.player_absences to authenticated;
grant insert (academy_id, activity_id, player_id) on public.player_absences to authenticated;
grant update (marked_by, marked_at, notified_at, deleted_at) on public.player_absences to authenticated;

-- ============================================================
-- 2. Marcar, desmarcar y avisar (security invoker: la RLS exige al owner)
-- ============================================================

-- Marca o desmarca. La academia sale de la actividad; volver a marcar conserva notified_at.
create or replace function public.set_absence(p_activity_id uuid, p_player_id uuid, p_absent boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_academy_id uuid;
begin
  select a.academy_id into v_academy_id from public.activities a where a.id = p_activity_id;
  if v_academy_id is null or not public.has_academy_role(v_academy_id, array['owner']) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_absent then
    insert into public.player_absences (academy_id, activity_id, player_id)
    values (v_academy_id, p_activity_id, p_player_id)
    on conflict (activity_id, player_id) do update
      set deleted_at = null, marked_at = clock_timestamp(), marked_by = public.current_user_id();
  else
    update public.player_absences
    set deleted_at = clock_timestamp()
    where activity_id = p_activity_id and player_id = p_player_id and deleted_at is null;
  end if;
end;
$$;

comment on function public.set_absence(uuid, uuid, boolean) is 'Marca o desmarca «No llegó» (CA-003 de HU-042).';

-- Registra el aviso en la ausencia vigente y devuelve su hora.
create or replace function public.mark_absence_notified(p_activity_id uuid, p_player_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_notified_at timestamptz;
begin
  update public.player_absences
  set notified_at = clock_timestamp()
  where activity_id = p_activity_id and player_id = p_player_id and deleted_at is null
  returning notified_at into v_notified_at;

  if v_notified_at is null then
    raise exception 'absence_not_found' using errcode = 'P0002';
  end if;
  return v_notified_at;
end;
$$;

comment on function public.mark_absence_notified(uuid, uuid) is '«Avisado» con la hora del servidor (CA-004 de HU-042).';

revoke execute on function public.set_absence(uuid, uuid, boolean), public.mark_absence_notified(uuid, uuid) from public, anon;
grant execute on function public.set_absence(uuid, uuid, boolean), public.mark_absence_notified(uuid, uuid) to authenticated;
