-- Spec 015: aviso de inasistencia (contracts/contracts.md, base de datos).
-- Las actividades se crean respecto al día de hoy en Colombia para que el plazo no dependa de
-- la hora en que corre la prueba.

begin;

select plan(19);

-- Preparación como superusuario, aislada de los datos del seed.
select set_config('tests.today', ((date_trunc('day', now() at time zone 'America/Bogota')) at time zone 'America/Bogota')::text, true);
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Sede Prueba 015', tests.owner_of('academia-a'));
insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
values (tests.academy_of('academia-a'), 'Falta', 'Uno', '2015-01-01', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Falta', 'Dos', '2015-01-02', tests.owner_of('academia-a'));
insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
values (tests.academy_of('academia-b'), 'Falta', 'Ajeno', '2015-01-03', tests.owner_of('academia-b'));
-- Hoy (empezada a las 00:00 de Colombia), por empezar, de ayer a las 11:00 p. m. y cancelada. Las pasadas
-- se crean sin la guarda de actividades, que solo deja crear actividades futuras.
alter table public.activities disable trigger activities_guard;
insert into public.activities (academy_id, type, starts_at, venue_id, notes, created_by)
values
  (tests.academy_of('academia-a'), 'training', current_setting('tests.today')::timestamptz, (select id from public.venues where name = 'Sede Prueba 015'), 'hoy', tests.owner_of('academia-a')),
  (tests.academy_of('academia-a'), 'training', now() + interval '1 hour', (select id from public.venues where name = 'Sede Prueba 015'), 'luego', tests.owner_of('academia-a')),
  (tests.academy_of('academia-a'), 'training', current_setting('tests.today')::timestamptz - interval '1 hour', (select id from public.venues where name = 'Sede Prueba 015'), 'ayer', tests.owner_of('academia-a'));
insert into public.activities (academy_id, type, starts_at, venue_id, notes, status, created_by)
values (tests.academy_of('academia-a'), 'training', current_setting('tests.today')::timestamptz, (select id from public.venues where name = 'Sede Prueba 015'), 'cancelada', 'cancelled', tests.owner_of('academia-a'));
alter table public.activities enable trigger activities_guard;

select set_config('tests.hoy', (select id::text from public.activities where notes = 'hoy' and venue_id = (select id from public.venues where name = 'Sede Prueba 015')), true);
select set_config('tests.luego', (select id::text from public.activities where notes = 'luego' and venue_id = (select id from public.venues where name = 'Sede Prueba 015')), true);
select set_config('tests.ayer', (select id::text from public.activities where notes = 'ayer' and venue_id = (select id from public.venues where name = 'Sede Prueba 015')), true);
select set_config('tests.cancelada', (select id::text from public.activities where notes = 'cancelada' and venue_id = (select id from public.venues where name = 'Sede Prueba 015')), true);
select set_config('tests.uno', (select id::text from public.players where first_names = 'Falta' and last_names = 'Uno'), true);
select set_config('tests.dos', (select id::text from public.players where first_names = 'Falta' and last_names = 'Dos'), true);
select set_config('tests.ajeno', (select id::text from public.players where first_names = 'Falta' and last_names = 'Ajeno'), true);

-- anon
select tests.authenticate_as_anon();
select ok(not has_table_privilege('anon', 'public.player_absences', 'select')
  and not has_function_privilege('anon', 'public.set_absence(uuid, uuid, boolean)', 'execute')
  and not has_function_privilege('anon', 'public.mark_absence_notified(uuid, uuid)', 'execute'), 'anon no accede a las ausencias');
select tests.clear_authentication();

-- Marcar y desmarcar en el plazo.
select tests.authenticate_as(tests.owner_of('academia-a'));
select lives_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.hoy'), current_setting('tests.uno')), 'marca a quien no llegó');
select ok((select marked_by = tests.owner_of('academia-a') and deleted_at is null and notified_at is null from public.player_absences where activity_id = current_setting('tests.hoy')::uuid and player_id = current_setting('tests.uno')::uuid), 'la ausencia guarda quién la marcó');
select ok((select public.mark_absence_notified(current_setting('tests.hoy')::uuid, current_setting('tests.uno')::uuid)) is not null, '«Avisar» devuelve la hora');
select ok((select notified_at is not null from public.player_absences where player_id = current_setting('tests.uno')::uuid), 'queda «Avisado»');
select public.set_absence(current_setting('tests.hoy')::uuid, current_setting('tests.uno')::uuid, false);
select ok((select deleted_at is not null from public.player_absences where player_id = current_setting('tests.uno')::uuid), 'desmarcar es borrado lógico');
select throws_ok(format('select public.mark_absence_notified(%L, %L)', current_setting('tests.hoy'), current_setting('tests.uno')), 'P0002', 'absence_not_found', 'sin marca vigente no se avisa');
select public.set_absence(current_setting('tests.hoy')::uuid, current_setting('tests.uno')::uuid, true);
select ok((select deleted_at is null and notified_at is not null from public.player_absences where player_id = current_setting('tests.uno')::uuid), 'volver a marcar conserva «Avisado»');
select is((select count(*)::int from public.player_absences where activity_id = current_setting('tests.hoy')::uuid and player_id = current_setting('tests.uno')::uuid), 1, 'una sola fila por actividad y jugador');

-- Plazo y estado.
select throws_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.luego'), current_setting('tests.uno')), '23514', 'absence_window_closed', 'antes del inicio no se marca');
select throws_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.ayer'), current_setting('tests.uno')), '23514', 'absence_window_closed', 'una actividad de ayer a las 11:00 p. m. ya cerró');
select throws_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.cancelada'), current_setting('tests.uno')), '23514', 'activity_not_scheduled', 'una actividad cancelada no se marca');
select throws_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.hoy'), current_setting('tests.ajeno')), '23503', null, 'un jugador de otra academia no se marca');
select tests.clear_authentication();

-- Al día siguiente: una ausencia de ayer queda en lectura.
alter table public.player_absences disable trigger player_absences_guard;
insert into public.player_absences (academy_id, activity_id, player_id, marked_by)
values (tests.academy_of('academia-a'), current_setting('tests.ayer')::uuid, current_setting('tests.dos')::uuid, tests.owner_of('academia-a'));
alter table public.player_absences enable trigger player_absences_guard;
select tests.authenticate_as(tests.owner_of('academia-a'));
select throws_ok(format('select public.set_absence(%L, %L, false)', current_setting('tests.ayer'), current_setting('tests.dos')), '23514', 'absence_window_closed', 'al día siguiente no se desmarca');
select throws_ok(format('select public.mark_absence_notified(%L, %L)', current_setting('tests.ayer'), current_setting('tests.dos')), '23514', 'absence_window_closed', 'al día siguiente no se registra «Avisado»');
select tests.clear_authentication();

-- Convocatoria: marcar no cambia sus respuestas.
select tests.authenticate_as(tests.owner_of('academia-a'));
select is((select count(*)::int from public.call_up_current_responses where player_id = current_setting('tests.uno')::uuid), 0, 'la ausencia no crea respuestas de convocatoria');
select tests.clear_authentication();

-- Aislamiento.
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.player_absences where activity_id = current_setting('tests.hoy')::uuid), 0, 'el owner B no ve ausencias de A');
select throws_ok(format('select public.set_absence(%L, %L, true)', current_setting('tests.hoy'), current_setting('tests.dos')), '42501', 'not_allowed', 'el owner B no marca en A');
select throws_ok(format('select public.mark_absence_notified(%L, %L)', current_setting('tests.hoy'), current_setting('tests.uno')), 'P0002', 'absence_not_found', 'el owner B no registra avisos en A');
select tests.clear_authentication();

select * from finish();
rollback;
