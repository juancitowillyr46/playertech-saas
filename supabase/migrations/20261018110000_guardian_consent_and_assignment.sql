-- Autorización de datos en la persona y asignación de acudientes ya registrados
-- (spec 010; DEC-39 ajustada y DEC-43).

-- ============================================================
-- 1. La autorización pasa del vínculo al acudiente
-- ============================================================

alter table public.guardians
  add column consent_document_id uuid references public.legal_documents (id),
  add column consent_at timestamptz;

-- Cada acudiente conserva la autorización de su primer vínculo, incluidos los retirados.
update public.guardians g
set consent_document_id = first_link.consent_document_id,
    consent_at = first_link.consent_at
from (
  select distinct on (l.guardian_id) l.guardian_id, l.consent_document_id, l.consent_at
  from public.guardian_links l
  order by l.guardian_id, l.created_at, l.consent_at
) first_link
where first_link.guardian_id = g.id;

alter table public.guardians
  alter column consent_document_id set not null,
  alter column consent_at set not null,
  alter column consent_at set default now();

comment on column public.guardians.consent_document_id is 'Política de Tratamiento de Datos vigente cuando se registró la persona (DEC-39 ajustada).';

alter table public.guardian_links
  drop column consent_document_id,
  drop column consent_at;

-- ============================================================
-- 2. add_player_guardian: la autorización se guarda en la persona nueva
-- ============================================================

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

  -- La persona ya registrada conserva su autorización; la nueva la registra ahora.
  if v_guardian_id is null then
    v_existed := false;
    insert into public.guardians (academy_id, full_name, phone, consent_document_id, consent_at, created_by)
    values (
      v_academy_id, trim(p_full_name), p_phone,
      (select d.id from public.legal_documents d where d.type = 'privacy_policy' and d.is_current),
      now(), public.current_user_id()
    )
    returning id, full_name into v_guardian_id, v_guardian_name;
  end if;

  insert into public.guardian_links (academy_id, guardian_id, player_id, relationship, status, created_by)
  values (v_academy_id, v_guardian_id, p_player_id, p_relationship, 'validated', public.current_user_id())
  returning id into v_link_id;

  return query select v_guardian_id, v_link_id, v_existed, v_guardian_name;
end;
$$;

-- ============================================================
-- 3. assign_guardians: asignar acudientes ya registrados (DEC-43)
-- ============================================================

-- Asigna uno o varios acudientes de la academia a un jugador, validados, en una sola
-- operación. Omite los ya vinculados y devuelve cuántos vínculos creó. security definer:
-- guardian_links solo se inserta por funciones; comprueba explícitamente al owner.
create or replace function public.assign_guardians(p_player_id uuid, p_assignments jsonb)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academy_id uuid;
  v_created int;
begin
  select pl.academy_id into v_academy_id
  from public.players pl
  where pl.id = p_player_id and pl.deleted_at is null;

  if v_academy_id is null or not public.has_academy_role(v_academy_id, array['owner']) then
    raise exception 'player_not_found' using errcode = '42501';
  end if;

  if jsonb_typeof(p_assignments) <> 'array' or exists (
    select 1 from jsonb_array_elements(p_assignments) a
    where a ->> 'relationship' is null or a ->> 'relationship' not in ('mother', 'father', 'grandparent', 'other')
  ) then
    raise exception 'invalid_relationship' using errcode = '23514';
  end if;

  -- Todos los acudientes deben existir en la academia del jugador; si no, no se asigna ninguno.
  if exists (
    select 1 from jsonb_array_elements(p_assignments) a
    where not exists (
      select 1 from public.guardians g
      where g.id = (a ->> 'guardian_id')::uuid and g.academy_id = v_academy_id and g.deleted_at is null
    )
  ) then
    raise exception 'guardian_not_found' using errcode = '42501';
  end if;

  insert into public.guardian_links (academy_id, guardian_id, player_id, relationship, status, created_by)
  select distinct on ((a ->> 'guardian_id')::uuid)
    v_academy_id, (a ->> 'guardian_id')::uuid, p_player_id, a ->> 'relationship', 'validated', public.current_user_id()
  from jsonb_array_elements(p_assignments) a
  where not exists (
    select 1 from public.guardian_links l
    where l.guardian_id = (a ->> 'guardian_id')::uuid and l.player_id = p_player_id and l.deleted_at is null
  );

  get diagnostics v_created = row_count;

  return v_created;
end;
$$;

comment on function public.assign_guardians(uuid, jsonb) is 'Asigna acudientes ya registrados a un jugador sin duplicar vínculos (HU-035, DEC-43).';

revoke execute on function public.assign_guardians(uuid, jsonb) from public, anon;
grant execute on function public.assign_guardians(uuid, jsonb) to authenticated;
