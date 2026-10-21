-- Spec 013: respuesta del acudiente y seguimiento (research R1 a R6, data-model.md).
-- El acudiente sin cuenta solo usa tres funciones públicas (security definer) que derivan la
-- academia del enlace; ninguna tabla se abre a anon. Sin usos nuevos de auth.uid() ni
-- referencias nuevas al esquema auth (ADR-017).

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 1. Acudientes y vínculos creados desde el enlace (R3)
-- ============================================================

alter table public.guardians
  alter column created_by drop not null,
  add column source text not null default 'owner' check (source in ('owner', 'link')),
  add constraint guardians_author_check check (source = 'link' or created_by is not null);

comment on column public.guardians.source is 'owner: lo registró el owner; link: se identificó desde el enlace de la convocatoria, sin autor (DEC-46).';

alter table public.guardian_links
  alter column created_by drop not null,
  add column source text not null default 'owner' check (source in ('owner', 'link')),
  add constraint guardian_links_author_check check (source = 'link' or created_by is not null),
  add constraint guardian_links_rejected_deleted check (status <> 'rejected' or deleted_at is not null),
  add constraint guardian_links_academy_id_id_key unique (academy_id, id);

comment on column public.guardian_links.source is 'owner: lo creó el owner (nace validado); link: nació desde el enlace (nace pendiente, DEC-40).';

-- ============================================================
-- 2. Dispositivos (R2)
-- ============================================================

create table public.guardian_devices (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  guardian_id uuid not null,
  secret_hash bytea not null,
  status text not null default 'pending' check (status in ('pending', 'trusted', 'revoked')),
  declared_name text check (declared_name is null or length(trim(declared_name)) between 1 and 120),
  declared_relationship text not null check (declared_relationship in ('mother', 'father', 'grandparent', 'other', 'self')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardian_devices_academy_id_id_key unique (academy_id, id),
  constraint guardian_devices_secret_hash_key unique (secret_hash),
  foreign key (academy_id, guardian_id) references public.guardians (academy_id, id)
);

comment on table public.guardian_devices is 'Marca secreta del navegador de un acudiente; solo se guarda la huella SHA-256 (DEC-31, DEC-40). Sin borrado lógico: revocar es su baja.';

create index guardian_devices_guardian_id_idx on public.guardian_devices (guardian_id);

create trigger guardian_devices_set_updated_at
  before update on public.guardian_devices
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. Respuestas: registro de solo inserción (R4)
-- ============================================================

create table public.call_up_responses (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  call_up_id uuid not null,
  player_id uuid not null,
  answer text not null check (answer in ('yes', 'maybe', 'no')),
  reason text,
  reason_text text,
  source text not null check (source in ('guardian', 'owner')),
  guardian_link_id uuid,
  device_id uuid,
  -- Usuario owner; sin clave hacia auth.users (ADR-017).
  created_by uuid default public.current_user_id(),
  -- clock_timestamp: hora real de cada respuesta, también dentro de una misma transacción.
  created_at timestamptz not null default clock_timestamp(),
  foreign key (academy_id, call_up_id) references public.call_ups (academy_id, id),
  foreign key (academy_id, player_id) references public.players (academy_id, id),
  foreign key (academy_id, guardian_link_id) references public.guardian_links (academy_id, id),
  foreign key (academy_id, device_id) references public.guardian_devices (academy_id, id),
  constraint call_up_responses_reason_check check (
    (answer = 'yes' and reason is null)
    or (answer = 'no' and (reason is null or reason in ('illness', 'school', 'family', 'travel', 'transport', 'other')))
    or (answer = 'maybe' and (reason is null or reason in ('schedule', 'transport', 'health', 'other')))
  ),
  constraint call_up_responses_reason_text_check check (
    (reason = 'other' and reason_text is not null and length(trim(reason_text)) between 1 and 200)
    or (reason is distinct from 'other' and reason_text is null)
  ),
  constraint call_up_responses_author_check check (
    (source = 'guardian' and guardian_link_id is not null and device_id is not null and created_by is null)
    or (source = 'owner' and created_by is not null and guardian_link_id is null and device_id is null)
  )
);

comment on table public.call_up_responses is 'Historial de respuestas (DEC-33, DEC-38). Solo inserciones: no se edita ni se borra. Vale la última que cuenta.';

create index call_up_responses_player_idx on public.call_up_responses (call_up_id, player_id, created_at desc);

-- Las respuestas de acudientes solo llegan desde public_respond; el jugador debe estar convocado.
create or replace function public.call_up_responses_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.source = 'guardian' and coalesce(current_setting('playertech.public_respond', true), '') <> 'on' then
    raise exception 'guardian_response_not_allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.call_up_players cp
    join public.call_ups c on c.id = cp.call_up_id and c.deleted_at is null
    where cp.call_up_id = new.call_up_id and cp.player_id = new.player_id
  ) then
    raise exception 'player_not_called_up' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger call_up_responses_guard
  before insert on public.call_up_responses
  for each row execute function public.call_up_responses_guard();

revoke execute on function public.call_up_responses_guard() from public, anon, authenticated;

-- ============================================================
-- 4. Vistas del seguimiento (security_invoker: heredan la RLS)
-- ============================================================

-- Una respuesta cuenta si es del owner, o de un acudiente con vínculo no rechazado y dispositivo no revocado.
create view public.call_up_current_responses with (security_invoker = true) as
select
  cp.academy_id,
  cp.call_up_id,
  cp.list_id,
  cp.player_id,
  r.answer,
  r.reason,
  r.reason_text,
  r.source,
  r.created_at,
  g.id as guardian_id,
  g.full_name as guardian_name,
  l.relationship,
  l.id as guardian_link_id,
  l.status as link_status,
  d.id as device_id,
  d.status as device_status,
  d.declared_name,
  coalesce(l.status = 'pending' or d.status = 'pending', false) as unvalidated,
  coalesce(d.status = 'pending' and g.created_at < d.created_at, false) as phone_match
from public.call_up_players cp
join public.players p on p.id = cp.player_id and p.deleted_at is null and p.is_active
left join lateral (
  select r.*
  from public.call_up_responses r
  left join public.guardian_links rl on rl.id = r.guardian_link_id
  left join public.guardian_devices rd on rd.id = r.device_id
  where r.call_up_id = cp.call_up_id
    and r.player_id = cp.player_id
    and (r.source = 'owner' or (rl.status <> 'rejected' and rd.status <> 'revoked'))
  order by r.created_at desc, r.id desc
  limit 1
) r on true
left join public.guardian_links l on l.id = r.guardian_link_id
left join public.guardians g on g.id = l.guardian_id
left join public.guardian_devices d on d.id = r.device_id;

comment on view public.call_up_current_responses is 'Última respuesta que cuenta de cada convocado activo, con quién la dio y si está sin validar (HU-011).';

create view public.call_up_summaries with (security_invoker = true) as
select
  cr.academy_id,
  c.activity_id,
  cr.call_up_id,
  cr.list_id,
  count(*)::int as total,
  (count(*) filter (where cr.answer = 'yes'))::int as yes,
  (count(*) filter (where cr.answer = 'maybe'))::int as maybe,
  (count(*) filter (where cr.answer = 'no'))::int as no,
  (count(*) filter (where cr.answer is null))::int as unanswered
from public.call_up_current_responses cr
join public.call_ups c on c.id = cr.call_up_id
group by cr.academy_id, c.activity_id, cr.call_up_id, cr.list_id;

comment on view public.call_up_summaries is 'Totales por convocatoria y lista; la lista de actividades muestra yes/total (FR-014).';

-- ============================================================
-- 5. Vía pública del enlace (R1): security definer, para anon
-- ============================================================

-- Dispositivo no revocado de la academia que coincide con alguna de las llaves.
create or replace function public.public_device(p_academy_id uuid, p_keys text[])
returns public.guardian_devices
language sql
stable
security definer
set search_path = ''
as $$
  select d.*
  from public.guardian_devices d
  where d.academy_id = p_academy_id
    and d.status <> 'revoked'
    and d.secret_hash in (
      select extensions.digest(convert_to(k, 'UTF8'), 'sha256')
      from unnest(coalesce(p_keys[1:10], '{}'::text[])) as k
      where k is not null and length(k) between 32 and 128
    )
  order by d.created_at desc
  limit 1;
$$;

revoke execute on function public.public_device(uuid, text[]) from public, anon, authenticated;

-- Respuestas de acudientes que cuentan para el límite de un jugador en una convocatoria.
create or replace function public.guardian_responses_count(p_call_up_id uuid, p_player_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.call_up_responses r
  join public.guardian_links l on l.id = r.guardian_link_id
  join public.guardian_devices d on d.id = r.device_id
  where r.call_up_id = p_call_up_id
    and r.player_id = p_player_id
    and r.source = 'guardian'
    and l.status <> 'rejected'
    and d.status <> 'revoked';
$$;

revoke execute on function public.guardian_responses_count(uuid, uuid) from public, anon, authenticated;

-- «Samuel V.»: nombre e inicial del primer apellido (como shortName en el frontend).
create or replace function public.player_short_name(p_first_names text, p_last_names text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(p_first_names) || coalesce(' ' || upper(left(trim(p_last_names), 1)) || '.', '');
$$;

revoke execute on function public.player_short_name(text, text) from public, anon, authenticated;

-- Lee lo que el enlace permite ver (FR-001, FR-008). Un enlace inválido devuelve not_found sin datos.
create or replace function public.public_call_up(p_token text, p_device_keys text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list public.call_up_lists;
  v_call_up public.call_ups;
  v_activity public.activities;
  v_device public.guardian_devices;
  v_status text;
  v_place jsonb;
  v_roster jsonb := '[]'::jsonb;
  v_mine jsonb := '[]'::jsonb;
  v_device_key text;
begin
  select * into v_list from public.call_up_lists where token = p_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_call_up from public.call_ups where id = v_list.call_up_id and deleted_at is null;
  select * into v_activity from public.activities where id = v_call_up.activity_id and deleted_at is null;
  if v_call_up.id is null or v_activity.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_status := case
    when v_activity.status = 'cancelled' then 'cancelled'
    when not coalesce(public.call_up_is_open(v_call_up.id), false) then 'closed'
    else 'open'
  end;

  select jsonb_build_object('name', x.name, 'address', x.address, 'city', x.city, 'directions', x.directions)
  into v_place
  from (
    select name, address, city, directions from public.venues where id = v_activity.venue_id
    union all
    select name, address, city, directions from public.external_fields where id = v_activity.external_field_id
  ) x
  limit 1;

  if v_status = 'open' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'playerId', p.id,
      'name', public.player_short_name(p.first_names, p.last_names),
      'nickname', p.nickname
    ) order by p.first_names, p.last_names), '[]'::jsonb)
    into v_roster
    from public.call_up_players cp
    join public.players p on p.id = cp.player_id and p.deleted_at is null and p.is_active
    where cp.list_id = v_list.id;
  end if;

  v_device := public.public_device(v_call_up.academy_id, p_device_keys);
  if v_device.id is not null then
    update public.guardian_devices set last_seen_at = now() where id = v_device.id;

    -- La llave que coincidió (ya es del propio navegador): la usa para responder.
    select k into v_device_key
    from unnest(p_device_keys) as k
    where extensions.digest(convert_to(k, 'UTF8'), 'sha256') = v_device.secret_hash
    limit 1;

    select coalesce(jsonb_agg(jsonb_build_object(
      'playerId', m.player_id,
      'name', m.name,
      'nickname', m.nickname,
      'removed', m.removed,
      'answer', cr.answer,
      'reason', cr.reason,
      'reasonText', cr.reason_text,
      'changesLeft', case
        when public.guardian_responses_count(v_call_up.id, m.player_id) = 0 then 3
        else greatest(0, 4 - public.guardian_responses_count(v_call_up.id, m.player_id))
      end
    ) order by m.name), '[]'::jsonb)
    into v_mine
    from (
      select p.id as player_id,
             public.player_short_name(p.first_names, p.last_names) as name,
             p.nickname,
             not exists (select 1 from public.call_up_players cp where cp.call_up_id = v_call_up.id and cp.player_id = p.id) as removed
      from public.guardian_links l
      join public.players p on p.id = l.player_id and p.deleted_at is null
      where l.guardian_id = v_device.guardian_id
        and l.deleted_at is null
        and l.status <> 'rejected'
        and (
          exists (select 1 from public.call_up_players cp where cp.list_id = v_list.id and cp.player_id = p.id)
          or (
            not exists (select 1 from public.call_up_players cp where cp.call_up_id = v_call_up.id and cp.player_id = p.id)
            and exists (select 1 from public.call_up_responses r where r.call_up_id = v_call_up.id and r.player_id = p.id and r.guardian_link_id = l.id)
          )
        )
    ) m
    left join lateral (
      select r.answer, r.reason, r.reason_text
      from public.call_up_responses r
      left join public.guardian_links rl on rl.id = r.guardian_link_id
      left join public.guardian_devices rd on rd.id = r.device_id
      where r.call_up_id = v_call_up.id
        and r.player_id = m.player_id
        and (r.source = 'owner' or (rl.status <> 'rejected' and rd.status <> 'revoked'))
      order by r.created_at desc, r.id desc
      limit 1
    ) cr on true;
  end if;

  return jsonb_build_object(
    'status', v_status,
    'academy', (select name from public.academies where id = v_call_up.academy_id),
    'activity', jsonb_build_object(
      'type', v_activity.type,
      'startsAt', v_activity.starts_at,
      'endsAt', v_activity.ends_at,
      'callAt', v_activity.call_at,
      'place', v_place,
      'opponent', v_activity.opponent,
      'tournament', v_activity.tournament,
      'notes', v_activity.notes
    ),
    'deadline', v_call_up.deadline,
    'roster', v_roster,
    'mine', v_mine,
    'deviceKey', v_device_key
  );
end;
$$;

comment on function public.public_call_up(text, text[]) is 'Vía pública: datos que el enlace permite ver, sin celulares ni respuestas de otros (FR-001, FR-017).';

-- Resuelve el enlace abierto y comprueba que el jugador esté en su lista.
create or replace function public.public_open_list(p_token text, p_player_id uuid)
returns public.call_up_lists
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_list public.call_up_lists;
begin
  select l.* into v_list
  from public.call_up_lists l
  join public.call_ups c on c.id = l.call_up_id and c.deleted_at is null
  join public.activities a on a.id = c.activity_id and a.deleted_at is null
  where l.token = p_token;

  if v_list.id is null then
    raise exception 'call_up_not_found' using errcode = '22023';
  end if;
  if not coalesce(public.call_up_is_open(v_list.call_up_id), false)
     or exists (select 1 from public.call_ups c join public.activities a on a.id = c.activity_id where c.id = v_list.call_up_id and a.status = 'cancelled') then
    raise exception 'call_up_closed' using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.call_up_players cp
    join public.players p on p.id = cp.player_id and p.deleted_at is null and p.is_active
    where cp.list_id = v_list.id and cp.player_id = p_player_id
  ) then
    raise exception 'player_not_in_list' using errcode = '23514';
  end if;

  return v_list;
end;
$$;

revoke execute on function public.public_open_list(text, uuid) from public, anon, authenticated;

-- Identificarse o sumar un jugador (FR-002 a FR-004). La respuesta es la misma exista o no el celular.
create or replace function public.public_identify(
  p_token text,
  p_player_id uuid,
  p_full_name text,
  p_phone text,
  p_relationship text,
  p_consent boolean,
  p_device_key text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list public.call_up_lists;
  v_device public.guardian_devices;
  v_guardian_id uuid;
  v_name text;
  v_secret text;
begin
  v_list := public.public_open_list(p_token, p_player_id);

  if p_relationship is null or p_relationship not in ('mother', 'father', 'grandparent', 'other', 'self') then
    raise exception 'invalid_relationship' using errcode = '22023';
  end if;

  v_device := public.public_device(v_list.academy_id, array[p_device_key]);

  if v_device.id is not null then
    v_guardian_id := v_device.guardian_id;
    v_secret := p_device_key;
  else
    if p_consent is not true then
      raise exception 'consent_required' using errcode = '22023';
    end if;
    if p_phone is null or p_phone !~ '^3[0-9]{9}$' then
      raise exception 'invalid_phone' using errcode = '22023';
    end if;

    if p_relationship = 'self' then
      select trim(first_names) || ' ' || trim(last_names) into v_name from public.players where id = p_player_id;
    else
      v_name := trim(coalesce(p_full_name, ''));
      if length(v_name) not between 1 and 120 then
        raise exception 'invalid_name' using errcode = '22023';
      end if;
    end if;

    select id into v_guardian_id
    from public.guardians
    where academy_id = v_list.academy_id and phone = p_phone and deleted_at is null;

    if v_guardian_id is null then
      insert into public.guardians (academy_id, full_name, phone, consent_document_id, consent_at, created_by, source)
      values (
        v_list.academy_id, v_name, p_phone,
        (select d.id from public.legal_documents d where d.type = 'privacy_policy' and d.is_current),
        now(), null, 'link'
      )
      returning id into v_guardian_id;
    end if;

    v_secret := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.guardian_devices (academy_id, guardian_id, secret_hash, declared_name, declared_relationship)
    values (
      v_list.academy_id, v_guardian_id,
      extensions.digest(convert_to(v_secret, 'UTF8'), 'sha256'),
      case when p_relationship = 'self' then null else v_name end,
      p_relationship
    );
  end if;

  if not exists (
    select 1 from public.guardian_links
    where guardian_id = v_guardian_id and player_id = p_player_id and deleted_at is null
  ) then
    insert into public.guardian_links (academy_id, guardian_id, player_id, relationship, status, created_by, source)
    values (v_list.academy_id, v_guardian_id, p_player_id, p_relationship, 'pending', null, 'link');
  end if;

  return v_secret;
end;
$$;

comment on function public.public_identify(text, uuid, text, text, text, boolean, text) is 'Vía pública: identifica al acudiente y devuelve la llave del dispositivo (DEC-31, DEC-46).';

-- Responder (FR-005 a FR-007): abierta, jugador de la lista, dispositivo y vínculo vigentes, límite de 3 cambios.
create or replace function public.public_respond(
  p_token text,
  p_device_key text,
  p_player_id uuid,
  p_answer text,
  p_reason text,
  p_reason_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list public.call_up_lists;
  v_device public.guardian_devices;
  v_link_id uuid;
  v_reason text := nullif(p_reason, '');
  v_reason_text text := nullif(trim(coalesce(p_reason_text, '')), '');
  v_current record;
  v_count integer;
begin
  v_list := public.public_open_list(p_token, p_player_id);

  v_device := public.public_device(v_list.academy_id, array[p_device_key]);
  if v_device.id is null then
    raise exception 'device_not_recognized' using errcode = '42501';
  end if;

  select id into v_link_id
  from public.guardian_links
  where guardian_id = v_device.guardian_id and player_id = p_player_id
    and deleted_at is null and status <> 'rejected';
  if v_link_id is null then
    raise exception 'device_not_recognized' using errcode = '42501';
  end if;

  if p_answer is null or p_answer not in ('yes', 'maybe', 'no')
     or (p_answer = 'yes' and v_reason is not null)
     or (p_answer = 'no' and v_reason is not null and v_reason not in ('illness', 'school', 'family', 'travel', 'transport', 'other'))
     or (p_answer = 'maybe' and v_reason is not null and v_reason not in ('schedule', 'transport', 'health', 'other')) then
    raise exception 'invalid_answer' using errcode = '22023';
  end if;
  if v_reason = 'other' and (v_reason_text is null or length(v_reason_text) > 200) then
    raise exception 'reason_text_required' using errcode = '22023';
  end if;
  if v_reason is distinct from 'other' then
    v_reason_text := null;
  end if;

  -- Serializa las respuestas del mismo jugador para que el límite no se supere en paralelo.
  perform pg_advisory_xact_lock(hashtextextended(v_list.call_up_id::text || p_player_id::text, 0));

  select r.answer, r.reason, r.reason_text into v_current
  from public.call_up_responses r
  left join public.guardian_links rl on rl.id = r.guardian_link_id
  left join public.guardian_devices rd on rd.id = r.device_id
  where r.call_up_id = v_list.call_up_id and r.player_id = p_player_id
    and (r.source = 'owner' or (rl.status <> 'rejected' and rd.status <> 'revoked'))
  order by r.created_at desc, r.id desc
  limit 1;

  v_count := public.guardian_responses_count(v_list.call_up_id, p_player_id);

  if v_current.answer = p_answer and v_current.reason is not distinct from v_reason
     and v_current.reason_text is not distinct from v_reason_text then
    return jsonb_build_object('answer', p_answer, 'changesLeft', case when v_count = 0 then 3 else greatest(0, 4 - v_count) end);
  end if;

  if v_count >= 4 then
    raise exception 'change_limit_reached' using errcode = '23514';
  end if;

  perform set_config('playertech.public_respond', 'on', true);
  insert into public.call_up_responses (academy_id, call_up_id, player_id, answer, reason, reason_text, source, guardian_link_id, device_id, created_by)
  values (v_list.academy_id, v_list.call_up_id, p_player_id, p_answer, v_reason, v_reason_text, 'guardian', v_link_id, v_device.id, null);
  perform set_config('playertech.public_respond', 'off', true);

  update public.guardian_devices set last_seen_at = now() where id = v_device.id;

  return jsonb_build_object('answer', p_answer, 'changesLeft', greatest(0, 4 - (v_count + 1)));
end;
$$;

comment on function public.public_respond(text, text, uuid, text, text, text) is 'Vía pública: registra la respuesta del acudiente con las reglas de DEC-33 y DEC-38.';

revoke execute on function public.public_call_up(text, text[]) from public;
revoke execute on function public.public_identify(text, uuid, text, text, text, boolean, text) from public;
revoke execute on function public.public_respond(text, text, uuid, text, text, text) from public;
grant execute on function public.public_call_up(text, text[]) to anon, authenticated;
grant execute on function public.public_identify(text, uuid, text, text, text, boolean, text) to anon, authenticated;
grant execute on function public.public_respond(text, text, uuid, text, text, text) to anon, authenticated;

-- ============================================================
-- 6. Validar o rechazar (R5)
-- ============================================================

-- security definer: es la única vía para cambiar estados de vínculos y dispositivos, y
-- comprueba explícitamente que quien llama es owner de la academia.
create or replace function public.review_guardian(p_link_id uuid, p_device_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.guardian_links;
  v_device public.guardian_devices;
  v_academy_id uuid;
begin
  if p_decision not in ('validate', 'reject') or (p_link_id is null and p_device_id is null) then
    raise exception 'invalid_review' using errcode = '22023';
  end if;

  if p_link_id is not null then
    select * into v_link from public.guardian_links where id = p_link_id and deleted_at is null for update;
    if v_link.id is null then
      raise exception 'review_target_not_found' using errcode = '22023';
    end if;
  end if;
  if p_device_id is not null then
    select * into v_device from public.guardian_devices where id = p_device_id for update;
    if v_device.id is null then
      raise exception 'review_target_not_found' using errcode = '22023';
    end if;
  end if;
  if v_link.id is not null and v_device.id is not null
     and (v_link.academy_id <> v_device.academy_id or v_link.guardian_id <> v_device.guardian_id) then
    raise exception 'invalid_review' using errcode = '22023';
  end if;

  v_academy_id := coalesce(v_link.academy_id, v_device.academy_id);
  if not public.has_academy_role(v_academy_id, array['owner']) then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if p_decision = 'validate' then
    update public.guardian_links set status = 'validated' where id = v_link.id and status = 'pending';
    update public.guardian_devices set status = 'trusted' where id = v_device.id and status = 'pending';
  else
    update public.guardian_devices set status = 'revoked' where id = v_device.id;
    update public.guardian_links set status = 'rejected', deleted_at = now() where id = v_link.id and status = 'pending';
  end if;
end;
$$;

comment on function public.review_guardian(uuid, uuid, text) is 'Validar (vínculo validado, dispositivo de confianza) o rechazar (dispositivo revocado; vínculo pendiente rechazado) (DEC-40, HU-040).';

revoke execute on function public.review_guardian(uuid, uuid, text) from public, anon;
grant execute on function public.review_guardian(uuid, uuid, text) to authenticated;

-- ============================================================
-- 7. RLS y privilegios
-- ============================================================

alter table public.guardian_devices enable row level security;
alter table public.call_up_responses enable row level security;

revoke all on table public.guardian_devices, public.call_up_responses from anon, authenticated;
revoke all on table public.call_up_current_responses, public.call_up_summaries from anon, authenticated;

grant select on public.guardian_devices, public.call_up_responses to authenticated;
grant select on public.call_up_current_responses, public.call_up_summaries to authenticated;
grant insert (academy_id, call_up_id, player_id, answer, reason, reason_text, source) on public.call_up_responses to authenticated;

create policy guardian_devices_select_member on public.guardian_devices for select to authenticated
  using (public.is_academy_member(academy_id));

create policy call_up_responses_select_member on public.call_up_responses for select to authenticated
  using (public.is_academy_member(academy_id));
create policy call_up_responses_insert_owner on public.call_up_responses for insert to authenticated
  with check (
    public.has_academy_role(academy_id, array['owner'])
    and source = 'owner'
    and created_by = public.current_user_id()
  );
