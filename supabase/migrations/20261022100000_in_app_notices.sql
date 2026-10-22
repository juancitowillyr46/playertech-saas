-- Spec 014: avisos en la aplicación (research R1 y R2, data-model.md).
-- Las vistas filtran por la academia actual (current_academy_id) y heredan la RLS; sin usos
-- nuevos de auth.uid() ni referencias nuevas al esquema auth (ADR-017).

-- ============================================================
-- 1. Visitas a una convocatoria (respuestas vistas, DEC-47)
-- ============================================================

create table public.call_up_visits (
  academy_id uuid not null references public.academies (id),
  call_up_id uuid not null,
  -- Usuario que vio la convocatoria; sin clave hacia auth.users (ADR-017).
  user_id uuid not null default public.current_user_id(),
  -- clock_timestamp: la hora real de la visita, también dentro de una misma transacción.
  seen_at timestamptz not null default clock_timestamp(),
  primary key (call_up_id, user_id),
  foreign key (academy_id, call_up_id) references public.call_ups (academy_id, id)
);

comment on table public.call_up_visits is 'Última vez que cada usuario abrió la actividad de una convocatoria; las respuestas posteriores son nuevas (DEC-47). Se sobrescribe: sin borrado lógico.';

-- Marca como vista la convocatoria para el usuario actual. La academia sale de la convocatoria;
-- si el usuario no la ve (otra academia), no hace nada.
create or replace function public.mark_call_up_seen(p_call_up_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.call_up_visits (academy_id, call_up_id)
  select c.academy_id, c.id
  from public.call_ups c
  where c.id = p_call_up_id and c.deleted_at is null
  on conflict (call_up_id, user_id) do update set seen_at = clock_timestamp();
$$;

comment on function public.mark_call_up_seen(uuid) is 'Respuestas vistas al abrir la actividad (CA-003 de HU-041).';

revoke execute on function public.mark_call_up_seen(uuid) from public, anon;
grant execute on function public.mark_call_up_seen(uuid) to authenticated;

-- ============================================================
-- 2. Vistas de los avisos (security_invoker: heredan la RLS)
-- ============================================================

-- Pendientes de validar de la academia actual (la regla de la spec 013, en un solo sitio):
-- un vínculo pendiente con el último dispositivo pendiente del acudiente, o un dispositivo
-- pendiente de un acudiente con vínculo validado (una fila por jugador).
create view public.guardian_pending_reviews with (security_invoker = true) as
select
  l.academy_id,
  l.player_id,
  p.first_names as player_first_names,
  p.last_names as player_last_names,
  p.nickname as player_nickname,
  l.id as link_id,
  d.id as device_id,
  g.full_name as guardian_name,
  d.declared_name,
  coalesce(d.declared_relationship, l.relationship) as relationship,
  g.phone,
  coalesce(d.created_at, l.created_at) as created_at,
  coalesce(g.created_at < d.created_at, false) as phone_match
from public.guardian_links l
join public.players p on p.id = l.player_id and p.deleted_at is null and p.is_active
join public.guardians g on g.id = l.guardian_id and g.deleted_at is null
left join lateral (
  select dv.*
  from public.guardian_devices dv
  where dv.guardian_id = g.id and dv.status = 'pending'
  order by dv.created_at desc
  limit 1
) d on true
where l.status = 'pending' and l.deleted_at is null and l.academy_id = public.current_academy_id()
union all
select
  l.academy_id,
  l.player_id,
  p.first_names,
  p.last_names,
  p.nickname,
  null::uuid,
  d.id,
  g.full_name,
  d.declared_name,
  d.declared_relationship,
  g.phone,
  d.created_at,
  g.created_at < d.created_at
from public.guardian_links l
join public.players p on p.id = l.player_id and p.deleted_at is null and p.is_active
join public.guardians g on g.id = l.guardian_id and g.deleted_at is null
join public.guardian_devices d on d.guardian_id = g.id and d.status = 'pending'
where l.status = 'validated' and l.deleted_at is null and l.academy_id = public.current_academy_id();

comment on view public.guardian_pending_reviews is 'Acudientes y dispositivos por validar de la academia actual (HU-040, HU-041).';

-- Respuestas nuevas por convocatoria para el usuario actual: de acudientes, que cuentan, de
-- jugadores convocados activos y posteriores a su última visita (o todas, sin visita).
create view public.call_up_new_responses with (security_invoker = true) as
select
  c.academy_id,
  c.id as call_up_id,
  a.id as activity_id,
  a.type as activity_type,
  a.opponent as activity_opponent,
  a.starts_at as activity_starts_at,
  a.status as activity_status,
  count(*)::int as new_count
from public.call_ups c
join public.activities a on a.id = c.activity_id and a.deleted_at is null
join public.call_up_responses r on r.call_up_id = c.id and r.source = 'guardian'
join public.guardian_links l on l.id = r.guardian_link_id and l.status <> 'rejected'
join public.guardian_devices d on d.id = r.device_id and d.status <> 'revoked'
join public.call_up_players cp on cp.call_up_id = c.id and cp.player_id = r.player_id
join public.players p on p.id = r.player_id and p.deleted_at is null and p.is_active
left join public.call_up_visits v on v.call_up_id = c.id and v.user_id = public.current_user_id()
where c.deleted_at is null
  and c.academy_id = public.current_academy_id()
  and (v.seen_at is null or r.created_at > v.seen_at)
group by c.academy_id, c.id, a.id, a.type, a.opponent, a.starts_at, a.status;

comment on view public.call_up_new_responses is 'Respuestas que el usuario aún no vio, por convocatoria (CA-002 de HU-041).';

-- ============================================================
-- 3. RLS y privilegios
-- ============================================================

alter table public.call_up_visits enable row level security;

revoke all on table public.call_up_visits from anon, authenticated;
revoke all on table public.guardian_pending_reviews, public.call_up_new_responses from anon, authenticated;

grant select, insert (academy_id, call_up_id) on public.call_up_visits to authenticated;
grant update (seen_at) on public.call_up_visits to authenticated;
grant select on public.guardian_pending_reviews, public.call_up_new_responses to authenticated;

create policy call_up_visits_select_own on public.call_up_visits for select to authenticated
  using (user_id = public.current_user_id() and public.is_academy_member(academy_id));
create policy call_up_visits_insert_own on public.call_up_visits for insert to authenticated
  with check (user_id = public.current_user_id() and public.is_academy_member(academy_id));
create policy call_up_visits_update_own on public.call_up_visits for update to authenticated
  using (user_id = public.current_user_id() and public.is_academy_member(academy_id))
  with check (user_id = public.current_user_id() and public.is_academy_member(academy_id));
