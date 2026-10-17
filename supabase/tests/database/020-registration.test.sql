-- Historia 3 / CA-004 de T-00: el registro crea todo o nada.

begin;

select plan(27);

-- ============================================================
-- Registro exitoso (escenarios 1 a 4)
-- ============================================================
create temporary table reg on commit drop as
select tests.create_user(
  '  New.Owner@Example.COM ',
  tests.valid_metadata('Academia Fútbol Club', 'Nuevo Owner')
) as user_id;

select is(
  (select full_name from public.profiles where user_id = (select user_id from reg)),
  'Nuevo Owner', 'se crea el perfil con el nombre del owner'
);

create temporary table reg_academy on commit drop as
select a.*
from public.academies a
join public.academy_members m on m.academy_id = a.id
where m.user_id = (select user_id from reg);

select is((select count(*)::int from reg_academy), 1, 'se crea una academia vinculada al owner');
select is((select name from reg_academy), 'Academia Fútbol Club', 'la academia tiene el nombre del registro');
select is((select slug from reg_academy), 'academia-futbol-club', 'el slug se genera sin tildes ni espacios');
select is((select country_code from reg_academy), 'CO'::char(2), 'país Colombia');
select is((select timezone from reg_academy), 'America/Bogota', 'zona horaria America/Bogota');
select is((select status from reg_academy), 'active', 'estado activo');
select is((select contact_email from reg_academy), 'new.owner@example.com', 'correo de contacto normalizado');
select is((select created_by from reg_academy), (select user_id from reg), 'la academia registra a su creador');

select is(
  (select role || '/' || status from public.academy_members where user_id = (select user_id from reg)),
  'owner/active', 'membresía owner activa'
);

select is(
  (select p.code || '/' || s.status
   from public.subscriptions s join public.plans p on p.id = s.plan_id
   where s.academy_id = (select id from reg_academy)),
  'free/active', 'suscripción free activa'
);

select is(
  (select name || '/' || type || '/' || is_primary || '/' || is_active
   from public.venues where academy_id = (select id from reg_academy)),
  'Sede principal/training_ground/true/true', 'sede principal creada como lugar de entrenamiento, activa'
);

select set_eq(
  $$select d.type || ':' || d.version
    from public.legal_acceptances la join public.legal_documents d on d.id = la.legal_document_id
    where la.user_id = (select user_id from reg)$$,
  $$select type || ':' || version from public.legal_documents where is_current$$,
  'dos aceptaciones, una por documento vigente'
);

select ok(
  (select bool_and(accepted_at is not null and ip_address is null and user_agent is null)
   from public.legal_acceptances where user_id = (select user_id from reg)),
  'aceptaciones con hora del servidor y sin IP ni navegador (DEC-29)'
);

-- ============================================================
-- Fallos: no queda nada creado (escenario 5, FR-016, SC-004)
-- ============================================================
create temporary table before_counts on commit drop as
select (select count(*) from auth.users) as users,
       (select count(*) from public.academies) as academies,
       (select count(*) from public.profiles) as profiles,
       (select count(*) from public.venues) as venues;

select throws_ok(
  $$select tests.create_user('falla1@playertech.test',
      tests.valid_metadata('Academia', 'Owner') - 'academy_name')$$,
  '23514', null, 'falla sin academy_name'
);

select throws_ok(
  $$select tests.create_user('falla2@playertech.test', tests.valid_metadata('Academia', '   '))$$,
  '23514', null, 'falla con full_name vacío'
);

select throws_ok(
  $$select tests.create_user('falla3@playertech.test',
      tests.valid_metadata('Academia', 'Owner') #- '{legal_acceptances,terms}')$$,
  '23514', null, 'falla sin aceptar los términos'
);

select throws_ok(
  $$select tests.create_user('falla4@playertech.test',
      jsonb_set(tests.valid_metadata('Academia', 'Owner'), '{legal_acceptances,privacy_policy}', '"2020-01-v1"'))$$,
  '23514', null, 'falla con una versión legal no vigente'
);

-- Fallo provocado a mitad del registro: sin plan free activo.
update public.plans set is_active = false where code = 'free';
select throws_ok(
  $$select tests.create_user('falla5@playertech.test', tests.valid_metadata('Academia', 'Owner'))$$,
  'P0002', null, 'falla si no hay plan free activo'
);
update public.plans set is_active = true where code = 'free';

select is(
  (select count(*)::int from auth.users where email like 'falla%@playertech.test'),
  0, 'ningún registro fallido deja la cuenta creada'
);

select ok(
  (select users = (select count(*) from auth.users)
      and academies = (select count(*) from public.academies)
      and profiles = (select count(*) from public.profiles)
      and venues = (select count(*) from public.venues)
   from before_counts),
  'ningún registro fallido deja datos parciales'
);

-- ============================================================
-- Nombres repetidos (escenario 6) y correo repetido (escenario 7)
-- ============================================================
select lives_ok(
  $$select tests.create_user('repetida1@playertech.test', tests.valid_metadata('Academia Repetida', 'Owner Uno'))$$,
  'primer registro con un nombre'
);
select lives_ok(
  $$select tests.create_user('repetida2@playertech.test', tests.valid_metadata('Academia Repetida', 'Owner Dos'))$$,
  'segundo registro con el mismo nombre'
);

select set_eq(
  $$select slug from public.academies where name = 'Academia Repetida'$$,
  array['academia-repetida', 'academia-repetida-2'],
  'los nombres repetidos reciben slugs distintos'
);

select is(
  (select count(*)::int from public.academies where name = 'Academia Repetida'),
  2, 'se crean dos academias distintas'
);

create temporary table before_dup on commit drop as
select count(*) as academies from public.academies;

select throws_ok(
  $$select tests.create_user('owner.a@playertech.test', tests.valid_metadata('Otra Academia', 'Otro'))$$,
  '23505', null, 'un correo ya registrado no crea otra cuenta'
);

select is(
  (select count(*) from public.academies),
  (select academies from before_dup),
  'un correo ya registrado no crea una segunda academia'
);

select * from finish();

rollback;
