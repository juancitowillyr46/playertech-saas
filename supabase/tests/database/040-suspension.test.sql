-- Historia 2, escenario 5 / CA-003 de T-00: una academia suspendida o una
-- membresía desactivada pierden el acceso, y los datos se conservan.

begin;

select plan(14);

-- ============================================================
-- Academia suspendida
-- ============================================================
update public.academies set status = 'suspended' where slug = 'academia-a';

select tests.authenticate_as(tests.owner_of('academia-a'));

select is((select count(*)::int from public.academies), 0, 'suspendida: no lee su academia');
select is((select count(*)::int from public.venues), 0, 'suspendida: no lee sus sedes');
select is((select count(*)::int from public.subscriptions), 0, 'suspendida: no lee su suscripción');
select is(current_academy_id(), null::uuid, 'suspendida: current_academy_id() es NULL');

with u as (
  update public.venues set name = 'Cambio' where academy_id = tests.academy_of('academia-a') returning 1
)
select is(count(*)::int, 0, 'suspendida: no modifica sus sedes') from u;

with u as (
  update public.academies set name = 'Cambio' where id = tests.academy_of('academia-a') returning 1
)
select is(count(*)::int, 0, 'suspendida: no modifica su academia') from u;

select is(
  (select count(*)::int from public.academy_members),
  1,
  'suspendida: sigue viendo su propia membresía (para mostrar el estado)'
);

select tests.clear_authentication();

select is(
  (select count(*)::int from public.venues where academy_id = tests.academy_of('academia-a')),
  1, 'suspendida: sus datos se conservan'
);

select is(
  (select name from public.academies where slug = 'academia-a'),
  'Academia A', 'suspendida: la academia no cambió'
);

-- ============================================================
-- Membresía desactivada (academia activa)
-- ============================================================
update public.academies set status = 'active' where slug = 'academia-a';
update public.academy_members set status = 'disabled' where user_id = tests.owner_of('academia-a');

select tests.authenticate_as(tests.owner_of('academia-a'));

select is((select count(*)::int from public.academies), 0, 'membresía desactivada: no lee la academia');
select is((select count(*)::int from public.venues), 0, 'membresía desactivada: no lee las sedes');
select is(current_academy_id(), null::uuid, 'membresía desactivada: current_academy_id() es NULL');

select tests.clear_authentication();

select is(
  (select count(*)::int from public.venues where academy_id = tests.academy_of('academia-a')),
  1, 'membresía desactivada: los datos se conservan'
);

-- La otra academia no se ve afectada.
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.academies), 1, 'B sigue accediendo con normalidad');
select tests.clear_authentication();

select * from finish();

rollback;
