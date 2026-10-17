-- Historia 1 / CA-001 de T-00: el esquema de la Fase 1 existe completo, con RLS
-- en todas las tablas, y los datos de referencia están cargados.

begin;

select plan(25);

-- Tablas de la Fase 1.
select has_table('public', 'plans', 'existe plans');
select has_table('public', 'legal_documents', 'existe legal_documents');
select has_table('public', 'profiles', 'existe profiles');
select has_table('public', 'academies', 'existe academies');
select has_table('public', 'subscriptions', 'existe subscriptions');
select has_table('public', 'academy_members', 'existe academy_members');
select has_table('public', 'venues', 'existe venues');
select has_table('public', 'files', 'existe files');
select has_table('public', 'legal_acceptances', 'existe legal_acceptances');

-- RLS habilitado en todas.
select is(
  (select count(*)::int
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('plans', 'legal_documents', 'profiles', 'academies', 'subscriptions',
                       'academy_members', 'venues', 'files', 'legal_acceptances')
     and c.relrowsecurity),
  9,
  'las 9 tablas de la Fase 1 tienen RLS habilitado'
);

select is(
  (select count(*)::int
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'ninguna tabla de public queda sin RLS'
);

-- Funciones.
select has_function('public', 'is_academy_member', array['uuid'], 'existe is_academy_member');
select has_function('public', 'current_academy_id', 'existe current_academy_id');
select has_function('public', 'has_academy_role', array['uuid', 'text[]'], 'existe has_academy_role');
select has_function('public', 'set_primary_venue', array['uuid'], 'existe set_primary_venue');
select has_function('public', 'handle_new_user', 'existe handle_new_user');

-- Privilegios de las funciones de autorización.
select ok(
  not has_function_privilege('anon', 'public.is_academy_member(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.current_academy_id()', 'execute')
  and not has_function_privilege('anon', 'public.has_academy_role(uuid, text[])', 'execute'),
  'anon no puede ejecutar las funciones de autorización'
);

select ok(
  has_function_privilege('authenticated', 'public.is_academy_member(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.current_academy_id()', 'execute')
  and has_function_privilege('authenticated', 'public.has_academy_role(uuid, text[])', 'execute'),
  'authenticated puede ejecutar las funciones de autorización'
);

select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'los clientes no pueden ejecutar handle_new_user directamente'
);

-- El trigger de registro está instalado.
select has_trigger('auth', 'users', 'on_auth_user_created', 'el trigger de registro existe en auth.users');

-- Datos de referencia.
select is((select count(*)::int from public.plans), 3, 'existen 3 planes');

select set_eq(
  'select code from public.plans',
  array['free', 'pro', 'advanced'],
  'los planes son free, pro y advanced'
);

select ok(
  (select max_venues is null and max_members is null and max_players is null
   from public.plans where code = 'free'),
  'el plan free no tiene límites'
);

select is(
  (select count(*)::int from public.legal_documents where type = 'terms' and is_current),
  1,
  'hay exactamente un documento vigente de terms'
);

select is(
  (select count(*)::int from public.legal_documents where type = 'privacy_policy' and is_current),
  1,
  'hay exactamente un documento vigente de privacy_policy'
);

select * from finish();

rollback;
