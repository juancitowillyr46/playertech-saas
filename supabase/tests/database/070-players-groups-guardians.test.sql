-- Spec 009: jugadores, grupos, integrantes, acudientes y vínculos (research R8).

begin;

select plan(36);

-- ============================================================
-- Esquema
-- ============================================================
select is(
  (select count(*)::int from pg_class
   where oid in ('public.players'::regclass, 'public.groups'::regclass, 'public.group_members'::regclass,
                 'public.guardians'::regclass, 'public.guardian_links'::regclass)
     and relrowsecurity),
  5, 'las cinco tablas tienen RLS'
);

select is(
  (select count(*)::int from unnest(array['public.players', 'public.groups', 'public.guardians', 'public.guardian_links']) t
   where has_table_privilege('authenticated', t, 'delete')),
  0, 'sin borrado físico en las tablas de negocio'
);

select ok(has_table_privilege('authenticated', 'public.group_members', 'delete'), 'group_members admite borrado físico');

select is(public.normalize_name('  Sámuel   VARGAS '), 'samuel vargas', 'normalize_name: sin tildes, mayúsculas ni espacios sobrantes');

-- Preparación (superusuario): un jugador en la academia B.
insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
values (tests.academy_of('academia-b'), 'Jugador', 'De B', date '2013-01-01', tests.owner_of('academia-b'));

-- ============================================================
-- Jugadores (owner A)
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

select is(public.current_user_id(), tests.owner_of('academia-a'), 'current_user_id devuelve el usuario autenticado');

select lives_ok(
  $$insert into public.players (academy_id, first_names, last_names, nickname, birth_date, phone)
    values (tests.academy_of('academia-a'), 'Samuel', 'Vargas', 'Samu', date '2014-05-10', '3001234567')$$,
  'players: el owner registra un jugador'
);

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'sámuel ', ' VARGAS', date '2014-05-10')$$,
  '23505', null, 'players: el mismo jugador con tildes, mayúsculas y espacios es duplicado'
);

select is(
  (select count(*)::int from public.find_player_by_identity('SAMUEL', 'vargas', date '2014-05-10')),
  1, 'find_player_by_identity encuentra al jugador normalizado'
);

select lives_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Samuel', 'Vargas', date '2015-02-02')$$,
  'players: un homónimo con otra fecha se registra'
);

update public.players set deleted_at = now()
where academy_id = tests.academy_of('academia-a') and birth_date = date '2015-02-02';

select lives_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Samuel', 'Vargas', date '2015-02-02')$$,
  'players: un jugador eliminado no bloquea registrarlo de nuevo'
);

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date, phone)
    values (tests.academy_of('academia-a'), 'Mateo', 'Ruiz', date '2014-01-01', '2001234567')$$,
  '23514', null, 'players: celular que no empieza por 3'
);

select lives_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Mateo', 'Ruiz', date '2014-01-01')$$,
  'players: el celular es opcional'
);

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Futuro', 'Jugador', current_date + 2)$$,
  '23514', null, 'players: fecha de nacimiento futura'
);

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Muy', 'Antiguo', current_date - interval '101 years')$$,
  '23514', null, 'players: fecha de nacimiento de hace más de 100 años'
);

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
    values (tests.academy_of('academia-a'), 'Autor', 'Falso', date '2014-01-01', tests.owner_of('academia-b'))$$,
  '42501', null, 'players: no se puede indicar otro autor'
);

-- ============================================================
-- Grupos e integrantes (owner A)
-- ============================================================
select lives_ok(
  $$insert into public.groups (academy_id, name) values (tests.academy_of('academia-a'), 'Sub-12')$$,
  'groups: el owner crea un grupo'
);

select throws_ok(
  $$insert into public.groups (academy_id, name) values (tests.academy_of('academia-a'), ' sub-12 ')$$,
  '23505', null, 'groups: nombre repetido sin distinguir mayúsculas ni espacios'
);

select lives_ok(
  $$insert into public.group_members (academy_id, group_id, player_id)
    select tests.academy_of('academia-a'), g.id, p.id
    from public.groups g, public.players p
    where g.name = 'Sub-12' and p.deleted_at is null and p.academy_id = tests.academy_of('academia-a')$$,
  'group_members: el owner agrega jugadores al grupo'
);

update public.groups set deleted_at = now() where name = 'Sub-12';

select is(
  (select count(*)::int from public.group_members where academy_id = tests.academy_of('academia-a')),
  0, 'groups: eliminar un grupo quita sus integrantes'
);

select is(
  (select count(*)::int from public.players where academy_id = tests.academy_of('academia-a') and deleted_at is null),
  3, 'groups: eliminar un grupo no elimina a sus jugadores'
);

select lives_ok(
  $$insert into public.groups (academy_id, name) values (tests.academy_of('academia-a'), 'Sub-12')$$,
  'groups: el nombre de un grupo eliminado se reutiliza'
);

-- ============================================================
-- Acudientes (owner A)
-- ============================================================
select throws_ok(
  $$select * from public.add_player_guardian(
      (select id from public.players where first_names = 'Samuel' and birth_date = date '2014-05-10'),
      'Carlos Vargas', '3157779876', 'father', false)$$,
  '22023', null, 'add_player_guardian: exige la autorización de datos'
);

select throws_ok(
  $$select * from public.add_player_guardian(
      (select id from public.players where first_names = 'Samuel' and birth_date = date '2014-05-10'),
      'Carlos Vargas', '3157779876', 'self', true)$$,
  '23514', null, 'add_player_guardian: «Soy el jugador» no se admite por esta vía'
);

select is(
  (select guardian_existed from public.add_player_guardian(
      (select id from public.players where first_names = 'Samuel' and birth_date = date '2014-05-10'),
      'Carlos Vargas', '3157779876', 'father', true)),
  false, 'add_player_guardian: crea la persona nueva'
);

select is(
  (select guardian_name from public.add_player_guardian(
      (select id from public.players where first_names = 'Mateo'),
      'Otro nombre', '3157779876', 'father', true)),
  'Carlos Vargas', 'add_player_guardian: reutiliza la persona por su celular (hermanos)'
);

select is(
  (select count(*)::int from public.guardians where phone = '3157779876'),
  1, 'guardians: una sola persona para los dos jugadores'
);

select is(
  (select count(*)::int from public.guardian_links l
   where l.status = 'validated'
     and l.consent_document_id = (select id from public.legal_documents where type = 'privacy_policy' and is_current)),
  2, 'guardian_links: validados y con la versión vigente de la Política'
);

select throws_ok(
  $$select * from public.add_player_guardian(
      (select id from public.players where first_names = 'Mateo'),
      'Carlos Vargas', '3157779876', 'father', true)$$,
  '23505', null, 'add_player_guardian: vínculo repetido'
);

select throws_ok(
  $$select * from public.add_player_guardian(
      (select id from public.players where academy_id = tests.academy_of('academia-b')),
      'Intruso', '3001112233', 'other', true)$$,
  '42501', null, 'add_player_guardian: no vincula a un jugador de otra academia'
);

-- ============================================================
-- Aislamiento (owner B)
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-b'));

select is(
  (select count(*)::int from public.players where academy_id = tests.academy_of('academia-a'))
  + (select count(*)::int from public.groups where academy_id = tests.academy_of('academia-a'))
  + (select count(*)::int from public.guardians where academy_id = tests.academy_of('academia-a'))
  + (select count(*)::int from public.guardian_links where academy_id = tests.academy_of('academia-a')),
  0, 'B no ve jugadores, grupos, acudientes ni vínculos de A'
);

select is(
  (select count(*)::int from public.find_player_by_identity('Samuel', 'Vargas', date '2014-05-10')),
  0, 'find_player_by_identity: B no encuentra jugadores de A'
);

with u as (
  update public.players set first_names = 'Hackeado' where academy_id = tests.academy_of('academia-a') returning 1
)
select is(count(*)::int, 0, 'players: B no modifica los de A') from u;

with u as (
  update public.guardians set full_name = 'Hackeado' where academy_id = tests.academy_of('academia-a') returning 1
)
select is(count(*)::int, 0, 'guardians: B no modifica los de A') from u;

select throws_ok(
  $$insert into public.players (academy_id, first_names, last_names, birth_date)
    values (tests.academy_of('academia-a'), 'Intruso', 'B', date '2014-01-01')$$,
  '42501', null, 'players: B no registra jugadores en A'
);

select tests.clear_authentication();

-- Un jugador de B no entra en un grupo de A (clave compuesta).
select throws_ok(
  $$insert into public.group_members (academy_id, group_id, player_id, created_by)
    values (tests.academy_of('academia-a'),
            (select id from public.groups where name = 'Sub-12' and deleted_at is null),
            (select id from public.players where academy_id = tests.academy_of('academia-b')),
            tests.owner_of('academia-a'))$$,
  '23503', null, 'group_members: no mezcla academias'
);

-- Anónimo: sin acceso.
select tests.authenticate_as_anon();

select throws_ok(
  $$select count(*) from public.players$$,
  '42501', null, 'players: anon no tiene acceso'
);

select tests.clear_authentication();

select * from finish();

rollback;
