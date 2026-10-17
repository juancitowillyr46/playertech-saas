-- Historia 2 / CA-002 y CA-005 de T-00: aislamiento entre academias.
-- El owner de A solo ve y modifica lo suyo; nada de B le es accesible.

begin;

select plan(36);

-- Preparación (superusuario): un archivo en cada academia.
insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes, created_by)
select a.id, 'public-assets', a.id || '/academy/' || a.id || '/' || gen_random_uuid() || '.png',
       'academy', a.id, 'logo.png', 'image/png', 1024, tests.owner_of(a.slug)
from public.academies a
where a.slug in ('academia-a', 'academia-b');

-- ============================================================
-- Lectura como owner A: solo su academia (escenario 1)
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

select results_eq(
  'select slug from public.academies',
  array['academia-a'],
  'academies: A solo ve su academia'
);

select is(
  (select count(*)::int from public.subscriptions where academy_id = tests.academy_of('academia-b')),
  0, 'subscriptions: A no ve las de B'
);
select is((select count(*)::int from public.subscriptions), 1, 'subscriptions: A ve la suya');

select results_eq(
  'select user_id from public.academy_members',
  array[tests.owner_of('academia-a')],
  'academy_members: A solo ve su propia membresía'
);

select is(
  (select count(*)::int from public.venues where academy_id = tests.academy_of('academia-b')),
  0, 'venues: A no ve las de B'
);
select is((select count(*)::int from public.venues), 1, 'venues: A ve la suya');

select is(
  (select count(*)::int from public.files where academy_id = tests.academy_of('academia-b')),
  0, 'files: A no ve los de B'
);
select is((select count(*)::int from public.files), 1, 'files: A ve el suyo');

select is(
  (select count(*)::int from public.legal_acceptances where user_id <> tests.owner_of('academia-a')),
  0, 'legal_acceptances: A no ve las de otros'
);
select is((select count(*)::int from public.legal_acceptances), 2, 'legal_acceptances: A ve las suyas');

select results_eq(
  'select user_id from public.profiles',
  array[tests.owner_of('academia-a')],
  'profiles: A solo ve su perfil'
);

select is(current_academy_id(), tests.academy_of('academia-a'), 'current_academy_id() devuelve la academia de A');
select ok(not is_academy_member(tests.academy_of('academia-b')), 'is_academy_member(B) es falso para A');

-- ============================================================
-- Escritura sobre B como owner A (escenario 2)
-- ============================================================
with u as (
  update public.academies set name = 'Hackeada' where id = tests.academy_of('academia-b') returning 1
)
select is(count(*)::int, 0, 'academies: A no modifica B') from u;

with u as (
  update public.venues set name = 'Hackeada' where academy_id = tests.academy_of('academia-b') returning 1
)
select is(count(*)::int, 0, 'venues: A no modifica las de B') from u;

with u as (
  update public.files set deleted_at = now() where academy_id = tests.academy_of('academia-b') returning 1
)
select is(count(*)::int, 0, 'files: A no modifica los de B') from u;

with u as (
  update public.profiles set full_name = 'Hackeado' where user_id = tests.owner_of('academia-b') returning 1
)
select is(count(*)::int, 0, 'profiles: A no modifica el de B') from u;

select throws_ok(
  $$delete from public.venues where academy_id = tests.academy_of('academia-b')$$,
  '42501', null, 'venues: no se puede eliminar físicamente (ni de B ni propias)'
);
select throws_ok(
  $$delete from public.files where academy_id = tests.academy_of('academia-b')$$,
  '42501', null, 'files: no se puede eliminar físicamente'
);
select throws_ok(
  $$delete from public.academies where id = tests.academy_of('academia-b')$$,
  '42501', null, 'academies: no se puede eliminar'
);

-- ============================================================
-- Creación con academy_id de B (escenario 3)
-- ============================================================
select throws_ok(
  $$insert into public.venues (academy_id, name) values (tests.academy_of('academia-b'), 'Intrusa')$$,
  '42501', null, 'venues: A no crea una sede en B'
);

select throws_ok(
  $$insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes)
    values (tests.academy_of('academia-b'), 'public-assets',
            tests.academy_of('academia-b') || '/academy/x/' || gen_random_uuid() || '.png',
            'academy', gen_random_uuid(), 'x.png', 'image/png', 10)$$,
  '42501', null, 'files: A no registra un archivo en B'
);

-- Autoría no falsificable (FR-031) y clave atada a la academia (FR-006).
select throws_ok(
  $$insert into public.venues (academy_id, name, created_by)
    values (tests.academy_of('academia-a'), 'Sede falsa', tests.owner_of('academia-b'))$$,
  '42501', null, 'venues: no se puede indicar otro autor'
);

select lives_ok(
  $$insert into public.venues (academy_id, name) values (tests.academy_of('academia-a'), 'Sede Norte')$$,
  'venues: A crea una sede propia'
);

select is(
  (select created_by from public.venues where name = 'Sede Norte'),
  tests.owner_of('academia-a'),
  'venues: el autor queda con el id de A sin indicarlo'
);

select throws_ok(
  $$insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes, created_by)
    values (tests.academy_of('academia-a'), 'public-assets',
            tests.academy_of('academia-a') || '/academy/x/' || gen_random_uuid() || '.png',
            'academy', gen_random_uuid(), 'x.png', 'image/png', 10, tests.owner_of('academia-b'))$$,
  '42501', null, 'files: no se puede indicar otro autor'
);

select throws_ok(
  $$insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes)
    values (tests.academy_of('academia-a'), 'public-assets',
            tests.academy_of('academia-b') || '/academy/x/' || gen_random_uuid() || '.png',
            'academy', gen_random_uuid(), 'x.png', 'image/png', 10)$$,
  '23514', null, 'files: la clave no puede empezar por el id de otra academia'
);

-- ============================================================
-- Creación directa en tablas del registro (escenario 6)
-- ============================================================
select throws_ok(
  $$insert into public.academies (name, slug, created_by) values ('Pirata', 'pirata', auth.uid())$$,
  '42501', null, 'academies: no se crean directamente'
);
select throws_ok(
  $$insert into public.academy_members (academy_id, user_id, role)
    values (tests.academy_of('academia-b'), auth.uid(), 'owner')$$,
  '42501', null, 'academy_members: no se crean directamente'
);
select throws_ok(
  $$insert into public.subscriptions (academy_id, plan_id, status)
    select tests.academy_of('academia-a'), id, 'active' from public.plans where code = 'pro'$$,
  '42501', null, 'subscriptions: no se crean directamente'
);
select throws_ok(
  $$insert into public.legal_acceptances (user_id, academy_id, legal_document_id)
    select auth.uid(), tests.academy_of('academia-a'), id from public.legal_documents limit 1$$,
  '42501', null, 'legal_acceptances: no se crean directamente'
);

-- ============================================================
-- Usuario autenticado sin membresía (escenario 4)
-- ============================================================
select tests.clear_authentication();

create temporary table sin_membresia on commit drop as
select tests.create_user('sin.membresia@playertech.test', tests.valid_metadata('Academia Huérfana', 'Sin Membresía')) as user_id;

delete from public.academy_members where user_id = (select user_id from sin_membresia);

select tests.authenticate_as((select user_id from sin_membresia));

select is(
  (select count(*)::int from public.academies)
  + (select count(*)::int from public.venues)
  + (select count(*)::int from public.subscriptions)
  + (select count(*)::int from public.files),
  0,
  'un usuario sin membresía no ve datos de ninguna academia'
);

-- ============================================================
-- Visitante sin sesión (escenario 7)
-- ============================================================
select tests.clear_authentication();
select tests.authenticate_as_anon();

select throws_ok('select count(*) from public.academies', '42501', null, 'anon: no lee academies');
select throws_ok('select count(*) from public.venues', '42501', null, 'anon: no lee venues');
select throws_ok('select count(*) from public.plans', '42501', null, 'anon: no lee plans');
select is(
  (select count(*)::int from public.legal_documents where is_current),
  2, 'anon: sí lee los documentos legales vigentes'
);

select tests.clear_authentication();

select * from finish();

rollback;
