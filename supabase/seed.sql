-- Datos de prueba reproducibles: academias A y B (FR-004; research R12).
--
-- Solo se insertan los usuarios. El trigger handle_new_user crea, por el camino
-- real del registro, su perfil, academia, membresía owner, suscripción Free,
-- sede principal y aceptaciones legales. Las academias quedan con los slugs
-- academia-a y academia-b.
--
-- Contraseña de ambos: PlayerTech-Local-2026. Solo para desarrollo local
-- (documentada en supabase/README.md); no es un secreto.
--
-- Las columnas instance_id, aud, role, raw_app_meta_data y los tokens como
-- cadena vacía (no NULL) son necesarias para que Supabase Auth permita iniciar
-- sesión con estos usuarios.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-0000-4000-8000-00000000000a',
    'authenticated', 'authenticated',
    'owner.a@playertech.test',
    extensions.crypt('PlayerTech-Local-2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"academy_name":"Academia A","full_name":"Owner A","legal_acceptances":{"terms":"2026-10-v1","privacy_policy":"2026-10-v1"}}',
    now(), now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-0000-4000-8000-00000000000b',
    'authenticated', 'authenticated',
    'owner.b@playertech.test',
    extensions.crypt('PlayerTech-Local-2026', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"academy_name":"Academia B","full_name":"Owner B","legal_acceptances":{"terms":"2026-10-v1","privacy_policy":"2026-10-v1"}}',
    now(), now(),
    '', '', '', ''
  );

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (
    'aaaaaaaa-0000-4000-8000-00000000000a',
    'aaaaaaaa-0000-4000-8000-00000000000a',
    '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","email":"owner.a@playertech.test","email_verified":true}',
    'email', now(), now(), now()
  ),
  (
    'bbbbbbbb-0000-4000-8000-00000000000b',
    'bbbbbbbb-0000-4000-8000-00000000000b',
    '{"sub":"bbbbbbbb-0000-4000-8000-00000000000b","email":"owner.b@playertech.test","email_verified":true}',
    'email', now(), now(), now()
  );
