-- Spec 013: respuesta del acudiente y seguimiento (contracts/database.md, «Pruebas pgTAP»).

begin;

select plan(51);

-- Preparación como superusuario, aislada de los datos del seed.
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Sede Prueba 013', tests.owner_of('academia-a'));
insert into public.groups (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Grupo 013 A', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Grupo 013 B', tests.owner_of('academia-a'));
insert into public.players (academy_id, first_names, last_names, nickname, birth_date, created_by)
values (tests.academy_of('academia-a'), 'Jugador', 'Uno', 'Uni', '2015-01-01', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Jugador', 'Dos', null, '2015-01-02', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Jugador', 'Tres', null, '2015-01-03', tests.owner_of('academia-a'));
insert into public.activities (academy_id, type, starts_at, venue_id, created_by)
values (tests.academy_of('academia-a'), 'training', now() + interval '5 days', (select id from public.venues where name = 'Sede Prueba 013'), tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'training', now() + interval '6 days', (select id from public.venues where name = 'Sede Prueba 013'), tests.owner_of('academia-a'));

-- Acudiente registrado por el owner (celular 3009990001), validado con Jugador Tres.
insert into public.guardians (academy_id, full_name, phone, consent_document_id, created_by)
values (tests.academy_of('academia-a'), 'Claudia Registrada', '3009990001',
        (select id from public.legal_documents where type = 'privacy_policy' and is_current), tests.owner_of('academia-a'));
insert into public.guardian_links (academy_id, guardian_id, player_id, relationship, created_by)
values (tests.academy_of('academia-a'), (select id from public.guardians where phone = '3009990001'),
        (select id from public.players where last_names = 'Tres'), 'mother', tests.owner_of('academia-a'));

select set_config('tests.uno', (select id::text from public.players where last_names = 'Uno'), true);
select set_config('tests.dos', (select id::text from public.players where last_names = 'Dos'), true);
select set_config('tests.tres', (select id::text from public.players where last_names = 'Tres'), true);

-- Convocatoria con dos listas: A (Uno y Tres) y B (Dos); otra para la actividad que se cancelará.
select tests.authenticate_as(tests.owner_of('academia-a'));
select public.create_call_up(
  (select id from public.activities where starts_at::date = (now() + interval '5 days')::date and venue_id = (select id from public.venues where name = 'Sede Prueba 013')),
  now() + interval '2 days',
  jsonb_build_array(
    jsonb_build_object('group_id', (select id from public.groups where name = 'Grupo 013 A'), 'player_ids', jsonb_build_array(current_setting('tests.uno'), current_setting('tests.tres'))),
    jsonb_build_object('group_id', (select id from public.groups where name = 'Grupo 013 B'), 'player_ids', jsonb_build_array(current_setting('tests.dos')))
  )
);
select public.create_call_up(
  (select id from public.activities where starts_at::date = (now() + interval '6 days')::date and venue_id = (select id from public.venues where name = 'Sede Prueba 013')),
  null,
  jsonb_build_array(jsonb_build_object('group_id', null, 'player_ids', jsonb_build_array(current_setting('tests.dos'))))
);
select tests.clear_authentication();

select set_config('tests.token_a', (select token from public.call_up_lists where group_id = (select id from public.groups where name = 'Grupo 013 A')), true);
select set_config('tests.token_b', (select token from public.call_up_lists where group_id = (select id from public.groups where name = 'Grupo 013 B')), true);
select set_config('tests.token_c', (select l.token from public.call_up_lists l join public.call_ups c on c.id = l.call_up_id where l.group_id is null and c.academy_id = tests.academy_of('academia-a') and c.activity_id = (select id from public.activities where starts_at::date = (now() + interval '6 days')::date and venue_id = (select id from public.venues where name = 'Sede Prueba 013'))), true);
select set_config('tests.call_up', (select call_up_id::text from public.call_up_lists where token = current_setting('tests.token_a')), true);

-- Privilegios: anon solo ejecuta las tres funciones públicas.
select ok(not has_table_privilege('anon', 'public.guardian_devices', 'select'), 'anon no lee dispositivos');
select ok(not has_table_privilege('anon', 'public.call_up_responses', 'select'), 'anon no lee respuestas');
select ok(not has_table_privilege('anon', 'public.call_up_current_responses', 'select'), 'anon no lee el seguimiento');
select ok(has_function_privilege('anon', 'public.public_call_up(text, text[])', 'execute'), 'anon ejecuta public_call_up');
select ok(not has_function_privilege('anon', 'public.review_guardian(uuid, uuid, text)', 'execute'), 'anon no revisa acudientes');

-- Lectura pública.
select tests.authenticate_as_anon();
select is(public.public_call_up('no-existe-este-enlace-0000000000', null), '{"status": "not_found"}'::jsonb, 'un enlace inventado no revela nada');
select is(jsonb_array_length(public.public_call_up(current_setting('tests.token_a'), null) -> 'roster'), 2, 'el roster trae solo la lista del enlace');
select is((select array_agg(k order by k) from jsonb_object_keys(public.public_call_up(current_setting('tests.token_a'), null) -> 'roster' -> 0) k), array['name', 'nickname', 'playerId'], 'el roster no trae celulares ni apellidos');
select ok(public.public_call_up(current_setting('tests.token_a'), null) -> 'roster' @> '[{"name": "Jugador U.", "nickname": "Uni"}]', 'nombre e inicial del apellido con el apodo');

-- Identificarse.
select throws_ok(format($$select public.public_identify(%L, %L::uuid, 'Carlos', '3001110001', 'father', false, null)$$, current_setting('tests.token_a'), current_setting('tests.uno')), '22023', 'consent_required', 'sin autorización no se identifica');
select throws_ok(format($$select public.public_identify(%L, %L::uuid, 'Carlos', '3001110001', 'father', true, null)$$, current_setting('tests.token_a'), current_setting('tests.dos')), '23514', 'player_not_in_list', 'un jugador de otra lista no se elige');
select set_config('tests.key1', public.public_identify(current_setting('tests.token_a'), current_setting('tests.uno')::uuid, 'Carlos', '3001110001', 'father', true, null), true);
select set_config('tests.key_luis', public.public_identify(current_setting('tests.token_a'), current_setting('tests.tres')::uuid, 'Luis', '3009990001', 'father', true, null), true);
select is(length(current_setting('tests.key1')) + length(current_setting('tests.key_luis')), 128, 'devuelve una llave igual exista o no el celular');
select tests.clear_authentication();

select ok(exists(select 1 from public.guardians where phone = '3001110001' and source = 'link' and created_by is null and full_name = 'Carlos'), 'crea el acudiente desde el enlace, sin autor');
select is((select status from public.guardian_links where guardian_id = (select id from public.guardians where phone = '3001110001')), 'pending', 'el vínculo nace pendiente');
select is((select status || ':' || declared_name from public.guardian_devices where guardian_id = (select id from public.guardians where phone = '3001110001')), 'pending:Carlos', 'el dispositivo nace pendiente con el nombre declarado');
select is((select count(*)::int from public.guardians where phone = '3009990001'), 1, 'un celular existente no crea otra persona');
select is((select full_name from public.guardians where phone = '3009990001'), 'Claudia Registrada', 'el nombre registrado no cambia');
select is((select declared_name from public.guardian_devices where guardian_id = (select id from public.guardians where phone = '3009990001')), 'Luis', 'guarda el nombre declarado para compararlo');

select tests.authenticate_as_anon();
select set_config('tests.key_self', public.public_identify(current_setting('tests.token_a'), current_setting('tests.tres')::uuid, null, '3001110003', 'self', true, null), true);
select tests.clear_authentication();
select is((select full_name from public.guardians where phone = '3001110003'), 'Jugador Tres', '«Soy el jugador» toma el nombre de la ficha');

-- Dispositivo reconocido y respuestas.
select tests.authenticate_as_anon();
select is(public.public_call_up(current_setting('tests.token_a'), array[current_setting('tests.key1')]) -> 'mine' -> 0 ->> 'changesLeft', '3', 'el dispositivo ve a su jugador con 3 cambios');
select is(public.public_call_up(current_setting('tests.token_a'), array['otra-llave-que-no-coincide-000000', current_setting('tests.key1')]) ->> 'deviceKey', current_setting('tests.key1'), 'devuelve cuál de las llaves del navegador coincidió');
select is(public.public_respond(current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'yes', null, null) ->> 'changesLeft', '3', 'la primera respuesta no es un cambio');
select is(public.public_respond(current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'yes', null, null) ->> 'changesLeft', '3', 'repetir la misma respuesta no cuenta');
select is(public.public_respond(current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'no', 'illness', null) ->> 'changesLeft', '2', 'cambiar descuenta un cambio');
select throws_ok(format($$select public.public_respond(%L, %L, %L::uuid, 'no', 'other', null)$$, current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')), '22023', 'reason_text_required', '«Otro» exige el texto');
select throws_ok(format($$select public.public_respond(%L, %L, %L::uuid, 'yes', 'illness', null)$$, current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')), '22023', 'invalid_answer', 'un motivo de otra respuesta falla');
select set_config('tests.key2', public.public_identify(current_setting('tests.token_a'), current_setting('tests.uno')::uuid, 'Marta', '3001110002', 'mother', true, null), true);
select is(public.public_respond(current_setting('tests.token_a'), current_setting('tests.key2'), current_setting('tests.uno')::uuid, 'maybe', 'schedule', null) ->> 'changesLeft', '1', 'el segundo acudiente suma al mismo límite');
select is(public.public_respond(current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')::uuid, 'no', 'other', 'Cumpleaños') ->> 'changesLeft', '0', 'llega al último cambio');
select throws_ok(format($$select public.public_respond(%L, %L, %L::uuid, 'yes', null, null)$$, current_setting('tests.token_a'), current_setting('tests.key1'), current_setting('tests.uno')), '23514', 'change_limit_reached', 'tras 3 cambios la respuesta queda fija');
select tests.clear_authentication();

-- Seguimiento y respuesta del owner.
select tests.authenticate_as(tests.owner_of('academia-a'));
select is((select answer || ':' || unvalidated::text from public.call_up_current_responses where player_id = current_setting('tests.uno')::uuid), 'no:true', 'el seguimiento muestra la última respuesta sin validar');
select is((select total || '/' || no || '/' || unanswered from public.call_up_summaries where list_id = (select id from public.call_up_lists where token = current_setting('tests.token_a'))), '2/1/1', 'los totales por lista');
select lives_ok(format($$insert into public.call_up_responses (academy_id, call_up_id, player_id, answer, source) values (tests.academy_of('academia-a'), %L, %L, 'yes', 'owner')$$, current_setting('tests.call_up'), current_setting('tests.uno')), 'el owner registra una respuesta');
select is((select answer || ':' || source from public.call_up_current_responses where player_id = current_setting('tests.uno')::uuid), 'yes:owner', 'la respuesta del owner pasa a ser la vigente');
select throws_ok(format($$insert into public.call_up_responses (academy_id, call_up_id, player_id, answer, source) values (tests.academy_of('academia-a'), %L, %L, 'yes', 'guardian')$$, current_setting('tests.call_up'), current_setting('tests.uno')), '42501', null, 'el owner no inserta respuestas de acudientes');
select ok(not has_table_privilege('authenticated', 'public.call_up_responses', 'update') and not has_table_privilege('authenticated', 'public.call_up_responses', 'delete'), 'el historial no se edita ni se borra');
select tests.clear_authentication();
select is(public.guardian_responses_count(current_setting('tests.call_up')::uuid, current_setting('tests.uno')::uuid), 4, 'la respuesta del owner no consume los cambios');

-- Validar y rechazar.
select set_config('tests.link1', (select id::text from public.guardian_links where guardian_id = (select id from public.guardians where phone = '3001110001')), true);
select set_config('tests.device1', (select id::text from public.guardian_devices where guardian_id = (select id from public.guardians where phone = '3001110001')), true);
select set_config('tests.link2', (select id::text from public.guardian_links where guardian_id = (select id from public.guardians where phone = '3001110002')), true);
select set_config('tests.device2', (select id::text from public.guardian_devices where guardian_id = (select id from public.guardians where phone = '3001110002')), true);
select set_config('tests.device_luis', (select id::text from public.guardian_devices where declared_name = 'Luis'), true);
select tests.authenticate_as(tests.owner_of('academia-a'));
select public.review_guardian(current_setting('tests.link1')::uuid, current_setting('tests.device1')::uuid, 'validate');
select public.review_guardian(current_setting('tests.link2')::uuid, current_setting('tests.device2')::uuid, 'reject');
select public.review_guardian(null, current_setting('tests.device_luis')::uuid, 'reject');
select tests.clear_authentication();
select is((select l.status || ':' || d.status from public.guardian_links l, public.guardian_devices d where l.id = current_setting('tests.link1')::uuid and d.id = current_setting('tests.device1')::uuid), 'validated:trusted', 'validar confirma vínculo y dispositivo');
select ok((select status = 'rejected' and deleted_at is not null from public.guardian_links where id = current_setting('tests.link2')::uuid), 'rechazar descarta el vínculo pendiente');
select is((select status from public.guardian_devices where id = current_setting('tests.device2')::uuid), 'revoked', 'rechazar revoca el dispositivo');
select is((select l.status || ':' || d.status from public.guardian_links l join public.guardian_devices d on d.guardian_id = l.guardian_id where l.player_id = current_setting('tests.tres')::uuid and l.guardian_id = (select id from public.guardians where phone = '3009990001')), 'validated:revoked', 'rechazar un dispositivo nuevo no toca el vínculo validado');
select is(public.guardian_responses_count(current_setting('tests.call_up')::uuid, current_setting('tests.uno')::uuid), 3, 'la respuesta rechazada deja de contar');

select tests.authenticate_as_anon();
select is(jsonb_array_length(public.public_call_up(current_setting('tests.token_a'), array[current_setting('tests.key2')]) -> 'mine'), 0, 'a quien fue rechazado se le trata como desconocido');
select throws_ok(format($$select public.public_respond(%L, %L, %L::uuid, 'yes', null, null)$$, current_setting('tests.token_a'), current_setting('tests.key2'), current_setting('tests.uno')), '42501', 'device_not_recognized', 'un dispositivo revocado no responde');
select tests.clear_authentication();

-- Jugador quitado y vuelto a sumar.
select tests.authenticate_as(tests.owner_of('academia-a'));
delete from public.call_up_players where call_up_id = current_setting('tests.call_up')::uuid and player_id = current_setting('tests.uno')::uuid;
select tests.authenticate_as_anon();
select is(public.public_call_up(current_setting('tests.token_a'), array[current_setting('tests.key1')]) -> 'mine' -> 0 ->> 'removed', 'true', 'el acudiente ve que su jugador ya no está convocado');
select tests.authenticate_as(tests.owner_of('academia-a'));
insert into public.call_up_players (academy_id, call_up_id, list_id, player_id)
values (tests.academy_of('academia-a'), current_setting('tests.call_up')::uuid, (select id from public.call_up_lists where token = current_setting('tests.token_a')), current_setting('tests.uno')::uuid);
select is((select answer from public.call_up_current_responses where player_id = current_setting('tests.uno')::uuid), 'yes', 'al volver a sumarlo recupera su respuesta vigente');

-- Cierre y cancelación.
update public.call_ups set closed_at = now() where id = current_setting('tests.call_up')::uuid;
select lives_ok(format($$insert into public.call_up_responses (academy_id, call_up_id, player_id, answer, source) values (tests.academy_of('academia-a'), %L, %L, 'no', 'owner')$$, current_setting('tests.call_up'), current_setting('tests.tres')), 'el owner responde con la convocatoria cerrada');
update public.activities set status = 'cancelled' where id = (select activity_id from public.call_ups c join public.call_up_lists l on l.call_up_id = c.id where l.token = current_setting('tests.token_c'));
select tests.authenticate_as_anon();
select is(public.public_call_up(current_setting('tests.token_a'), null) ->> 'status' || ':' || jsonb_array_length(public.public_call_up(current_setting('tests.token_a'), null) -> 'roster'), 'closed:0', 'cerrada: sin roster');
select throws_ok(format($$select public.public_respond(%L, %L, %L::uuid, 'no', null, null)$$, current_setting('tests.token_a'), current_setting('tests.key_self'), current_setting('tests.tres')), '23514', 'call_up_closed', 'cerrada no admite respuestas');
select is(public.public_call_up(current_setting('tests.token_c'), null) ->> 'status', 'cancelled', 'la actividad cancelada se informa');

-- Aislamiento.
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.call_up_responses where academy_id = tests.academy_of('academia-a')) + (select count(*)::int from public.guardian_devices where academy_id = tests.academy_of('academia-a')), 0, 'B no ve respuestas ni dispositivos de A');
select throws_ok(format($$select public.review_guardian(null, %L::uuid, 'validate')$$, current_setting('tests.device1')), '42501', 'not_owner', 'B no revisa acudientes de A');

select tests.clear_authentication();
select * from finish();
rollback;
