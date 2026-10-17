-- Helpers compartidos por las pruebas pgTAP (research R2).
--
-- Este archivo se ejecuta primero (orden alfabético) y NO usa ROLLBACK: el esquema
-- `tests` debe persistir para los demás archivos. Por eso es idempotente y puede
-- ejecutarse varias veces sin `db:reset`.
--
-- pgTAP vive solo aquí, nunca en una migración (research R13).

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;

-- Crea un usuario confirmado en auth.users (y su identidad de correo).
-- Inserta las mismas columnas que el seed para que Supabase Auth lo trate como
-- un usuario válido. El trigger handle_new_user se ejecuta con p_metadata.
create or replace function tests.create_user(p_email text, p_metadata jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt('PlayerTech-Test-2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, p_metadata, now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_user_id::text, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return v_user_id;
end;
$$;

-- Metadatos de registro válidos según contracts/registration-metadata.md.
create or replace function tests.valid_metadata(p_academy_name text, p_full_name text)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'academy_name', p_academy_name,
    'full_name', p_full_name,
    'legal_acceptances', jsonb_build_object(
      'terms', (select version from public.legal_documents where type = 'terms' and is_current),
      'privacy_policy', (select version from public.legal_documents where type = 'privacy_policy' and is_current)
    )
  );
$$;

-- Actúa como el usuario indicado: rol `authenticated` y claims con su `sub`,
-- que es lo que leen auth.uid() y las políticas RLS.
create or replace function tests.authenticate_as(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_user_id::text, 'role', 'authenticated')::text,
    true
  );
end;
$$;

-- Actúa como visitante sin sesión.
create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'anon')::text, true);
end;
$$;

-- Vuelve al rol de la sesión (superusuario de pruebas).
create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Id del owner de una academia del seed, por slug.
create or replace function tests.owner_of(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id
  from public.academy_members m
  join public.academies a on a.id = m.academy_id
  where a.slug = p_slug and m.role = 'owner';
$$;

-- Id de una academia del seed, por slug.
create or replace function tests.academy_of(p_slug text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.academies where slug = p_slug;
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;
revoke execute on function tests.create_user(text, jsonb) from anon, authenticated;

select plan(1);
select has_schema('tests', 'el esquema de helpers de prueba existe');
select * from finish();
