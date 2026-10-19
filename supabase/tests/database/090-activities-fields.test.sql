-- Spec 011: actividades y canchas externas (research R8).

begin;

select plan(26);

-- ============================================================
-- Esquema
-- ============================================================
select is(
  (select count(*)::int from pg_class where oid in ('public.activities'::regclass, 'public.external_fields'::regclass) and relrowsecurity),
  2, 'activities y external_fields tienen RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.activities', 'delete') and not has_table_privilege('authenticated', 'public.external_fields', 'delete'),
  'sin borrado físico'
);

-- Preparación (superusuario): una sede activa en A, una inactiva en A y una en B.
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Sede Prueba 011', tests.owner_of('academia-a'));
insert into public.venues (academy_id, name, is_active, created_by)
values (tests.academy_of('academia-a'), 'Sede Inactiva 011', false, tests.owner_of('academia-a'));
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-b'), 'Sede B 011', tests.owner_of('academia-b'));

-- ============================================================
-- Owner A
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

select lives_ok(
  $$insert into public.external_fields (academy_id, name, city) values (tests.academy_of('academia-a'), 'Cancha El Salitre', 'Bogotá')$$,
  'external_fields: el owner crea una cancha'
);
select throws_ok(
  $$insert into public.external_fields (academy_id, name) values (tests.academy_of('academia-a'), ' cancha el salitre ')$$,
  '23505', null, 'external_fields: nombre repetido sin distinguir mayúsculas ni espacios'
);

select lives_ok(
  $$insert into public.activities (academy_id, type, starts_at, call_at, ends_at, venue_id, notes)
    values (tests.academy_of('academia-a'), 'training', now() + interval '2 days', now() + interval '2 days' - interval '30 minutes',
            now() + interval '2 days 90 minutes', (select id from public.venues where name = 'Sede Prueba 011'), 'Uniforme azul')$$,
  'activities: entrenamiento en una sede'
);
select lives_ok(
  $$insert into public.activities (academy_id, type, starts_at, external_field_id, opponent, tournament)
    values (tests.academy_of('academia-a'), 'competition', now() + interval '6 days',
            (select id from public.external_fields where name = 'Cancha El Salitre'), 'Club Norte', 'Torneo Liga')$$,
  'activities: competencia en una cancha, con rival y torneo'
);

select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id, external_field_id)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day',
            (select id from public.venues where name = 'Sede Prueba 011'), (select id from public.external_fields where name = 'Cancha El Salitre'))$$,
  '23514', null, 'activities: no admite dos lugares'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at) values (tests.academy_of('academia-a'), 'training', now() + interval '1 day')$$,
  '23514', null, 'activities: exige un lugar'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day', (select id from public.venues where name = 'Sede Inactiva 011'))$$,
  '23514', null, 'activities: una sede inactiva no sirve como lugar'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id)
    values (tests.academy_of('academia-a'), 'training', now() - interval '1 hour', (select id from public.venues where name = 'Sede Prueba 011'))$$,
  '23514', null, 'activities: no se crea en el pasado'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, ends_at, venue_id)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day', now() + interval '1 day' - interval '1 minute', (select id from public.venues where name = 'Sede Prueba 011'))$$,
  '23514', null, 'activities: el fin debe ser posterior al inicio'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, call_at, venue_id)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day', now() + interval '1 day 10 minutes', (select id from public.venues where name = 'Sede Prueba 011'))$$,
  '23514', null, 'activities: la citación no puede ser posterior al inicio'
);
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id, opponent)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day', (select id from public.venues where name = 'Sede Prueba 011'), 'Club Sur')$$,
  '23514', null, 'activities: rival solo en competencia'
);

select lives_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id, series_id)
    select tests.academy_of('academia-a'), 'training', now() + (d || ' days')::interval, (select id from public.venues where name = 'Sede Prueba 011'),
           '00000000-0000-0000-0000-0000000000aa'::uuid
    from generate_series(10, 13) d$$,
  'activities: la repetición se inserta en una sola sentencia'
);

with u as (
  update public.activities set status = 'cancelled' where opponent = 'Club Norte' returning 1
)
select is(count(*)::int, 1, 'activities: el owner cancela una próxima') from u;

with u as (
  update public.activities set status = 'scheduled' where opponent = 'Club Norte' returning 1
)
select is(count(*)::int, 1, 'activities: y la reactiva') from u;

update public.external_fields set deleted_at = now() where name = 'Cancha El Salitre';

select is(
  (select count(*)::int from public.activities where opponent = 'Club Norte' and external_field_id is not null and deleted_at is null),
  1, 'external_fields: retirar la cancha conserva la actividad'
);
select lives_ok(
  $$insert into public.external_fields (academy_id, name) values (tests.academy_of('academia-a'), 'Cancha El Salitre')$$,
  'external_fields: el nombre de una cancha retirada se reutiliza'
);

-- Una actividad pasada (preparada como superusuario, sin el trigger).
select tests.clear_authentication();
alter table public.activities disable trigger activities_guard;
insert into public.activities (academy_id, type, starts_at, venue_id, created_by)
values (tests.academy_of('academia-a'), 'training', now() - interval '3 days', (select id from public.venues where name = 'Sede Prueba 011'), tests.owner_of('academia-a'));
alter table public.activities enable trigger activities_guard;
select tests.authenticate_as(tests.owner_of('academia-a'));

select throws_ok(
  $$update public.activities set notes = 'Cambio' where starts_at < now() and academy_id = tests.academy_of('academia-a')$$,
  '23514', null, 'activities: una pasada no se edita'
);
select throws_ok(
  $$update public.activities set status = 'cancelled' where starts_at < now() and academy_id = tests.academy_of('academia-a')$$,
  '23514', null, 'activities: una pasada no se cancela'
);
select lives_ok(
  $$update public.activities set deleted_at = now() where starts_at < now() and academy_id = tests.academy_of('academia-a')$$,
  'activities: una pasada sí se elimina'
);

-- ============================================================
-- Aislamiento
-- ============================================================
select throws_ok(
  $$insert into public.activities (academy_id, type, starts_at, venue_id)
    values (tests.academy_of('academia-a'), 'training', now() + interval '1 day', (select id from public.venues where name = 'Sede B 011'))$$,
  '23514', null, 'activities: una sede de otra academia no sirve como lugar'
);

select tests.authenticate_as(tests.owner_of('academia-b'));

select is(
  (select count(*)::int from public.activities where academy_id = tests.academy_of('academia-a'))
  + (select count(*)::int from public.external_fields where academy_id = tests.academy_of('academia-a')),
  0, 'B no ve actividades ni canchas de A'
);

with u as (
  update public.activities set notes = 'Hackeado' where academy_id = tests.academy_of('academia-a') returning 1
)
select is(count(*)::int, 0, 'activities: B no modifica las de A') from u;

select throws_ok(
  $$insert into public.external_fields (academy_id, name) values (tests.academy_of('academia-a'), 'Intrusa')$$,
  '42501', null, 'external_fields: B no crea canchas en A'
);

select tests.authenticate_as_anon();

select throws_ok($$select count(*) from public.activities$$, '42501', null, 'activities: anon no tiene acceso');

select tests.clear_authentication();

select * from finish();

rollback;
