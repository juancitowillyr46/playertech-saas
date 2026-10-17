-- Historia 4: la base de datos impide dejar los datos en un estado inválido.

begin;

select plan(25);

-- ============================================================
-- Sedes como owner A (escenarios 1 a 4)
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

select lives_ok(
  $$insert into public.venues (academy_id, name, type) values (tests.academy_of('academia-a'), 'Sede Norte', 'office')$$,
  'A crea una segunda sede'
);

select throws_ok(
  $$update public.venues set is_active = false where is_primary$$,
  '23514', null, 'la sede principal no puede desactivarse'
);

select throws_ok(
  $$update public.venues set deleted_at = now() where is_primary$$,
  '23514', null, 'la sede principal no puede eliminarse'
);

select throws_ok(
  $$update public.venues set is_primary = true where name = 'Sede Norte'$$,
  '42501', null, 'is_primary no es editable directamente'
);

-- set_primary_venue con una sede inactiva.
update public.venues set is_active = false where name = 'Sede Norte';

select throws_ok(
  $$select set_primary_venue((select id from public.venues where name = 'Sede Norte'))$$,
  '23514', null, 'una sede inactiva no puede ser la principal'
);

update public.venues set is_active = true where name = 'Sede Norte';

-- Owner B no puede cambiar la principal de A. El id se toma antes de cambiar de
-- usuario, porque B no puede ver las sedes de A.
select tests.clear_authentication();
create temporary table sede_norte on commit drop as
select id from public.venues where name = 'Sede Norte';
grant select on sede_norte to authenticated;

select tests.authenticate_as(tests.owner_of('academia-b'));
select throws_ok(
  $$select set_primary_venue((select id from sede_norte))$$,
  '42501', null, 'B no puede cambiar la sede principal de A'
);

select tests.authenticate_as(tests.owner_of('academia-a'));

select lives_ok(
  $$select set_primary_venue((select id from public.venues where name = 'Sede Norte'))$$,
  'A cambia la sede principal a una sede activa'
);

select results_eq(
  $$select name from public.venues where is_primary and deleted_at is null$$,
  array['Sede Norte'],
  'queda exactamente una sede principal: la nueva'
);

-- Nombres únicos sin distinguir mayúsculas, salvo sedes eliminadas.
select throws_ok(
  $$insert into public.venues (academy_id, name) values (tests.academy_of('academia-a'), 'SEDE NORTE')$$,
  '23505', null, 'no se repite el nombre de una sede (sin distinguir mayúsculas)'
);

insert into public.venues (academy_id, name) values (tests.academy_of('academia-a'), 'Sede Sur');
update public.venues set deleted_at = now() where name = 'Sede Sur';

select lives_ok(
  $$insert into public.venues (academy_id, name) values (tests.academy_of('academia-a'), 'sede sur')$$,
  'el nombre de una sede eliminada se puede reutilizar'
);

-- updated_at se mantiene solo (FR-008).
update public.venues set city = 'Medellín' where name = 'Sede principal';
select ok(
  (select updated_at > created_at from public.venues where name = 'Sede principal'),
  'updated_at cambia al modificar una sede'
);

-- ============================================================
-- Academia (escenario 8)
-- ============================================================
select throws_ok(
  $$update public.academies set status = 'suspended'$$, '42501', null, 'el owner no cambia el estado'
);
select throws_ok(
  $$update public.academies set slug = 'otro-slug'$$, '42501', null, 'el owner no cambia el slug'
);
select throws_ok(
  $$update public.academies set country_code = 'MX'$$, '42501', null, 'el owner no cambia el país'
);
select throws_ok(
  $$update public.academies set timezone = 'UTC'$$, '42501', null, 'el owner no cambia la zona horaria'
);

select lives_ok(
  $$update public.academies set name = 'Academia A Renovada', contact_phone = '3001234567'$$,
  'el owner modifica el nombre y el teléfono'
);
select is(
  (select name || '/' || contact_phone from public.academies),
  'Academia A Renovada/3001234567',
  'los cambios permitidos quedan guardados'
);

-- ============================================================
-- Aceptaciones legales inmutables (escenario 7)
-- ============================================================
select throws_ok(
  $$update public.legal_acceptances set accepted_at = now()$$, '42501', null, 'las aceptaciones no se modifican'
);
select throws_ok(
  $$delete from public.legal_acceptances$$, '42501', null, 'las aceptaciones no se eliminan'
);

select tests.clear_authentication();

-- ============================================================
-- Restricciones únicas (escenarios 5 y 6, FR-027), como superusuario
-- ============================================================
select throws_ok(
  format(
    $$insert into public.academy_members (academy_id, user_id, role) values (%L, %L, 'owner')$$,
    tests.academy_of('academia-b'), tests.owner_of('academia-a')
  ),
  '23505', null, 'una persona no pertenece a dos academias'
);

create temporary table libre on commit drop as
select tests.create_user('libre@playertech.test', tests.valid_metadata('Academia Libre', 'Persona Libre')) as user_id;
delete from public.academy_members where user_id = (select user_id from libre);

select throws_ok(
  format(
    $$insert into public.academy_members (academy_id, user_id, role) values (%L, %L, 'owner')$$,
    tests.academy_of('academia-a'), (select user_id from libre)
  ),
  '23505', null, 'una academia no tiene dos owners'
);

select throws_ok(
  format(
    $$insert into public.subscriptions (academy_id, plan_id, status)
      select %L, id, 'active' from public.plans where code = 'pro'$$,
    tests.academy_of('academia-a')
  ),
  '23505', null, 'una academia no tiene dos suscripciones activas'
);

select throws_ok(
  $$insert into public.legal_documents (type, version, url, published_at, is_current)
    values ('terms', '2026-11-v2', 'https://playertech.app/legal/terms/2026-11-v2', now(), true)$$,
  '23505', null, 'no hay dos versiones vigentes del mismo documento'
);

-- ============================================================
-- Relaciones entre academias (FR-006): el logo debe ser de la propia academia
-- ============================================================
insert into public.files (id, academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes, created_by)
values (
  'cccccccc-0000-4000-8000-00000000000c', tests.academy_of('academia-b'), 'public-assets',
  tests.academy_of('academia-b') || '/academy/' || tests.academy_of('academia-b') || '/cccccccc-0000-4000-8000-00000000000c.png',
  'academy', tests.academy_of('academia-b'), 'logo-b.png', 'image/png', 2048, tests.owner_of('academia-b')
);

select throws_ok(
  format(
    $$update public.academies set logo_file_id = 'cccccccc-0000-4000-8000-00000000000c' where id = %L$$,
    tests.academy_of('academia-a')
  ),
  '23503', null, 'una academia no puede usar como logo un archivo de otra'
);

select lives_ok(
  format(
    $$update public.academies set logo_file_id = 'cccccccc-0000-4000-8000-00000000000c' where id = %L$$,
    tests.academy_of('academia-b')
  ),
  'una academia sí puede usar su propio archivo como logo'
);

select * from finish();

rollback;
