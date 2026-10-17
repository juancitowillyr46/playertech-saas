-- Registro atómico de academia (DEC-01, DEC-20; research R3) y cambio de sede
-- principal (DEC-25; research R8).

-- Se ejecuta en la misma transacción que la creación del usuario en auth.users.
-- Cualquier excepción revierte todo, incluida la cuenta (FR-015, FR-016).
-- Contrato de entrada: specs/001-database-foundation/contracts/registration-metadata.md
--
-- Limitación conocida: se ejecuta en TODA alta de auth.users. Las altas sin
-- metadatos de registro (invitaciones, usuarios creados desde Studio, futuros
-- roles) fallarán hasta que se rediseñe para otros roles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_academy_name text := nullif(btrim(v_meta ->> 'academy_name'), '');
  v_full_name text := nullif(btrim(v_meta ->> 'full_name'), '');
  v_terms_version text := v_meta -> 'legal_acceptances' ->> 'terms';
  v_privacy_version text := v_meta -> 'legal_acceptances' ->> 'privacy_policy';
  v_terms_id uuid;
  v_privacy_id uuid;
  v_plan_id uuid;
  v_academy_id uuid;
  v_base_slug text;
  v_slug text;
  v_suffix int := 1;
begin
  -- 1. Validaciones.
  if v_academy_name is null then
    raise exception 'registration: academy_name is required' using errcode = 'check_violation';
  end if;

  if v_full_name is null then
    raise exception 'registration: full_name is required' using errcode = 'check_violation';
  end if;

  -- La versión aceptada debe ser la vigente: evita registrar la aceptación de un
  -- texto que el usuario no vio. Si no hay versión vigente, también falla.
  select id into v_terms_id
  from public.legal_documents
  where type = 'terms' and is_current and version = v_terms_version;

  if v_terms_id is null then
    raise exception 'registration: terms must match the current version' using errcode = 'check_violation';
  end if;

  select id into v_privacy_id
  from public.legal_documents
  where type = 'privacy_policy' and is_current and version = v_privacy_version;

  if v_privacy_id is null then
    raise exception 'registration: privacy_policy must match the current version' using errcode = 'check_violation';
  end if;

  select id into v_plan_id
  from public.plans
  where code = 'free' and is_active;

  if v_plan_id is null then
    raise exception 'registration: active free plan not found' using errcode = 'no_data_found';
  end if;

  -- 2. Perfil.
  insert into public.profiles (user_id, full_name)
  values (new.id, v_full_name);

  -- 3. Academia con slug único. Se busca el primer sufijo libre y se reintenta
  -- ante una violación de unicidad, lo que cubre registros simultáneos.
  v_base_slug := public.slugify(v_academy_name);
  v_slug := v_base_slug;

  loop
    if not exists (select 1 from public.academies where slug = v_slug) then
      begin
        insert into public.academies (name, slug, contact_email, created_by)
        values (v_academy_name, v_slug, lower(btrim(new.email)), new.id)
        returning id into v_academy_id;
        exit;
      exception when unique_violation then
        null; -- otro registro tomó el slug; se prueba el siguiente
      end;
    end if;

    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix;

    if v_suffix > 10000 then
      raise exception 'registration: could not generate a unique slug';
    end if;
  end loop;

  -- 4. Membresía, suscripción y sede principal. Dentro del trigger auth.uid()
  -- es NULL, así que created_by se asigna explícitamente.
  insert into public.academy_members (academy_id, user_id, role)
  values (v_academy_id, new.id, 'owner');

  insert into public.subscriptions (academy_id, plan_id, status)
  values (v_academy_id, v_plan_id, 'active');

  insert into public.venues (academy_id, name, type, is_primary, created_by)
  values (v_academy_id, 'Sede principal', 'training_ground', true, new.id);

  -- 5. Aceptaciones legales con la hora del servidor (DEC-09, DEC-29).
  insert into public.legal_acceptances (user_id, academy_id, legal_document_id)
  values
    (new.id, v_academy_id, v_terms_id),
    (new.id, v_academy_id, v_privacy_id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cambia la sede principal de la academia en una sola transacción, de modo que
-- nunca existan cero ni dos principales (FR-022). is_primary no es editable
-- directamente (privilegios por columna).
create or replace function public.set_primary_venue(p_venue_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academy_id uuid;
  v_is_active boolean;
  v_deleted_at timestamptz;
begin
  select academy_id, is_active, deleted_at
  into v_academy_id, v_is_active, v_deleted_at
  from public.venues
  where id = p_venue_id;

  -- Mismo error si la sede no existe o es de otra academia: no revela sedes ajenas.
  if v_academy_id is null or not public.has_academy_role(v_academy_id, array['owner']) then
    raise exception 'set_primary_venue: venue not found' using errcode = 'insufficient_privilege';
  end if;

  if not v_is_active or v_deleted_at is not null then
    raise exception 'set_primary_venue: venue must be active and not deleted' using errcode = 'check_violation';
  end if;

  -- Bloquea las sedes de la academia para serializar cambios simultáneos.
  perform 1 from public.venues where academy_id = v_academy_id for update;

  update public.venues
  set is_primary = false
  where academy_id = v_academy_id and is_primary and id <> p_venue_id;

  update public.venues
  set is_primary = true
  where id = p_venue_id;
end;
$$;

revoke execute on function public.set_primary_venue(uuid) from public, anon;
grant execute on function public.set_primary_venue(uuid) to authenticated;
