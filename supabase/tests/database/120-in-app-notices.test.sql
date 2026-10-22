-- Spec 014: avisos en la aplicación (contracts/contracts.md, base de datos).
-- DEC-02: una persona pertenece a una sola academia, así que «academia actual» se prueba con el
-- aislamiento entre A y B.

begin;

select plan(18);

-- Preparación como superusuario, aislada de los datos del seed.
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Sede Prueba 014', tests.owner_of('academia-a'));
insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
values (tests.academy_of('academia-a'), 'Aviso', 'Uno', '2015-01-01', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Aviso', 'Dos', '2015-01-02', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Aviso', 'Tres', '2000-01-03', tests.owner_of('academia-a'));
insert into public.activities (academy_id, type, starts_at, venue_id, created_by)
values (tests.academy_of('academia-a'), 'training', now() + interval '5 days', (select id from public.venues where name = 'Sede Prueba 014'), tests.owner_of('academia-a'));
insert into public.guardians (academy_id, full_name, phone, consent_document_id, created_by, created_at)
values (tests.academy_of('academia-a'), 'Claudia Registrada', '3008880001', (select id from public.legal_documents where type = 'privacy_policy' and is_current), tests.owner_of('academia-a'), now() - interval '1 day');
insert into public.guardian_links (academy_id, guardian_id, player_id, relationship, created_by)
values (tests.academy_of('academia-a'), (select id from public.guardians where phone = '3008880001'), (select id from public.players where last_names = 'Dos' and first_names = 'Aviso'), 'mother', tests.owner_of('academia-a'));

select set_config('tests.uno', (select id::text from public.players where first_names = 'Aviso' and last_names = 'Uno'), true);
select set_config('tests.dos', (select id::text from public.players where first_names = 'Aviso' and last_names = 'Dos'), true);
select set_config('tests.tres', (select id::text from public.players where first_names = 'Aviso' and last_names = 'Tres'), true);

select tests.authenticate_as(tests.owner_of('academia-a'));
select public.create_call_up(
  (select id from public.activities where venue_id = (select id from public.venues where name = 'Sede Prueba 014')),
  null,
  jsonb_build_array(jsonb_build_object('group_id', null, 'player_ids', jsonb_build_array(current_setting('tests.uno'), current_setting('tests.dos'), current_setting('tests.tres'))))
);
select tests.clear_authentication();
select set_config('tests.call_up', (select c.id::text from public.call_ups c join public.activities a on a.id = c.activity_id where a.venue_id = (select id from public.venues where name = 'Sede Prueba 014')), true);
select set_config('tests.token', (select token from public.call_up_lists where call_up_id = current_setting('tests.call_up')::uuid), true);

-- Identificarse desde el enlace: papá nuevo de Uno, la mamá registrada de Dos desde un celular nuevo y Tres por sí mismo.
select tests.authenticate_as_anon();
select set_config('tests.key1', public.public_identify(current_setting('tests.token'), current_setting('tests.uno')::uuid, 'Pedro', '3008880002', 'father', true, null), true);
select set_config('tests.key2', public.public_identify(current_setting('tests.token'), current_setting('tests.dos')::uuid, 'Claudia', '3008880001', 'mother', true, null), true);
select set_config('tests.key3', public.public_identify(current_setting('tests.token'), current_setting('tests.tres')::uuid, null, '3008880003', 'self', true, null), true);
select ok(not has_table_privilege('anon', 'public.guardian_pending_reviews', 'select') and not has_table_privilege('anon', 'public.call_up_new_responses', 'select') and not has_table_privilege('anon', 'public.call_up_visits', 'select'), 'anon no accede a los avisos');
select public.public_respond(current_setting('tests.token'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'yes', null, null);
select public.public_respond(current_setting('tests.token'), current_setting('tests.key2'), current_setting('tests.dos')::uuid, 'no', null, null);
select tests.clear_authentication();

-- Pendientes de la academia.
select tests.authenticate_as(tests.owner_of('academia-a'));
select is((select count(*)::int from public.guardian_pending_reviews), 3, 'tres pendientes: un vínculo nuevo, un celular nuevo y «Soy el jugador»');
select ok((select link_id is null and device_id is not null and phone_match from public.guardian_pending_reviews where player_id = current_setting('tests.dos')::uuid), 'el celular nuevo de un vínculo validado no lleva vínculo y coincide con la registrada');
select ok((select link_id is not null and device_id is not null and not phone_match from public.guardian_pending_reviews where player_id = current_setting('tests.uno')::uuid), 'el vínculo nuevo va con su dispositivo');
select public.review_guardian((select link_id from public.guardian_pending_reviews where player_id = current_setting('tests.tres')::uuid), (select device_id from public.guardian_pending_reviews where player_id = current_setting('tests.tres')::uuid), 'validate');
select is((select count(*)::int from public.guardian_pending_reviews where player_id = current_setting('tests.tres')::uuid), 0, '«el jugador» validado ya no es un pendiente');

-- Respuestas nuevas.
insert into public.call_up_responses (academy_id, call_up_id, player_id, answer, source)
values (tests.academy_of('academia-a'), current_setting('tests.call_up')::uuid, current_setting('tests.tres')::uuid, 'yes', 'owner');
select is((select new_count from public.call_up_new_responses where call_up_id = current_setting('tests.call_up')::uuid), 2, 'sin visita cuenta las respuestas de acudientes, no la del owner');
select public.mark_call_up_seen(current_setting('tests.call_up')::uuid);
select is((select count(*)::int from public.call_up_new_responses), 0, 'al abrir la actividad quedan vistas');
select set_config('tests.seen1', (select seen_at::text from public.call_up_visits where call_up_id = current_setting('tests.call_up')::uuid), true);
select public.mark_call_up_seen(current_setting('tests.call_up')::uuid);
select ok((select count(*) = 1 and max(seen_at) > current_setting('tests.seen1')::timestamptz from public.call_up_visits where call_up_id = current_setting('tests.call_up')::uuid), 'una visita por usuario y convocatoria, que se actualiza');
select tests.clear_authentication();

select tests.authenticate_as_anon();
select public.public_respond(current_setting('tests.token'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'no', null, null);
select public.public_respond(current_setting('tests.token'), current_setting('tests.key2'), current_setting('tests.dos')::uuid, 'maybe', null, null);
select tests.clear_authentication();

select tests.authenticate_as(tests.owner_of('academia-a'));
select is((select new_count from public.call_up_new_responses), 2, 'solo cuentan las posteriores a la visita');
select public.review_guardian(null, (select device_id from public.guardian_pending_reviews where player_id = current_setting('tests.dos')::uuid), 'reject');
select is((select new_count from public.call_up_new_responses), 1, 'una respuesta rechazada deja de ser nueva');
select is((select count(*)::int from public.guardian_pending_reviews), 1, 'el rechazado ya no es un pendiente');
delete from public.call_up_players where call_up_id = current_setting('tests.call_up')::uuid and player_id = current_setting('tests.uno')::uuid;
select is((select count(*)::int from public.call_up_new_responses), 0, 'las respuestas de un jugador quitado no son nuevas');
insert into public.call_up_players (academy_id, call_up_id, list_id, player_id)
values (tests.academy_of('academia-a'), current_setting('tests.call_up')::uuid, (select id from public.call_up_lists where token = current_setting('tests.token')), current_setting('tests.uno')::uuid);

-- Cerrada y cancelada siguen avisando hasta abrir la actividad.
update public.call_ups set closed_at = now() where id = current_setting('tests.call_up')::uuid;
select is((select new_count from public.call_up_new_responses), 1, 'una convocatoria cerrada sigue avisando');
update public.activities set status = 'cancelled' where id = (select activity_id from public.call_ups where id = current_setting('tests.call_up')::uuid);
select is((select activity_status from public.call_up_new_responses), 'cancelled', 'una actividad cancelada sigue avisando, con su estado');
update public.activities set deleted_at = now() where id = (select activity_id from public.call_ups where id = current_setting('tests.call_up')::uuid);
select is((select count(*)::int from public.call_up_new_responses), 0, 'una actividad eliminada no avisa');

-- Aislamiento.
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.guardian_pending_reviews) + (select count(*)::int from public.call_up_visits), 0, 'B no ve pendientes ni visitas de A');
select public.mark_call_up_seen(current_setting('tests.call_up')::uuid);
select tests.clear_authentication();
select is((select count(*)::int from public.call_up_visits where call_up_id = current_setting('tests.call_up')::uuid), 1, 'B no marca como vista una convocatoria de A');
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.call_up_new_responses), 0, 'B no ve respuestas nuevas de A');

select tests.clear_authentication();
select * from finish();
rollback;
