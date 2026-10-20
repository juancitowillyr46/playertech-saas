-- Spec 012: convocatoria y mensaje (research R8).

begin;

select plan(26);

-- Preparación como superusuario, aislada de los datos del seed.
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Sede Prueba 012', tests.owner_of('academia-a'));
insert into public.venues (academy_id, name, created_by)
values (tests.academy_of('academia-b'), 'Sede B Prueba 012', tests.owner_of('academia-b'));
insert into public.groups (academy_id, name, created_by)
values (tests.academy_of('academia-a'), 'Grupo Prueba 012', tests.owner_of('academia-a')),
       (tests.academy_of('academia-b'), 'Grupo B Prueba 012', tests.owner_of('academia-b'));
insert into public.players (academy_id, first_names, last_names, birth_date, created_by)
values (tests.academy_of('academia-a'), 'Jugador', 'Uno', '2015-01-01', tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'Jugador', 'Dos', '2015-01-02', tests.owner_of('academia-a')),
       (tests.academy_of('academia-b'), 'Jugador', 'B', '2015-01-03', tests.owner_of('academia-b'));
insert into public.activities (academy_id, type, starts_at, venue_id, created_by)
values (tests.academy_of('academia-a'), 'training', now() + interval '5 days', (select id from public.venues where name='Sede Prueba 012'), tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'training', now() + interval '6 days', (select id from public.venues where name='Sede Prueba 012'), tests.owner_of('academia-a')),
       (tests.academy_of('academia-a'), 'training', now() + interval '7 days', (select id from public.venues where name='Sede Prueba 012'), tests.owner_of('academia-a'));

select tests.authenticate_as(tests.owner_of('academia-a'));

-- Esquema, permisos y creación atómica.
select is((select count(*)::int from pg_class where oid in ('public.call_ups'::regclass,'public.call_up_lists'::regclass,'public.call_up_players'::regclass) and relrowsecurity),3,'las tres tablas tienen RLS');
select ok(not has_table_privilege('authenticated','public.call_ups','delete'),'call_ups no admite borrado físico');
select lives_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '5 days')::date),now()+interval '2 days',jsonb_build_array(jsonb_build_object('group_id',(select id from public.groups where name='Grupo Prueba 012'),'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Uno')))))$$,'create_call_up crea convocatoria');
select is((select count(*)::int from public.call_up_lists),1,'crea una lista');
select is((select length(token) from public.call_up_lists),32,'el token tiene 32 caracteres');
select is((select count(*)::int from public.call_up_players),1,'crea los convocados');
select ok((select public.call_up_is_open(id) from public.call_ups limit 1),'una convocatoria nueva está abierta');
select throws_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '6 days')::date),null,'[]'::jsonb)$$,'23514',null,'sin convocados falla');
select throws_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '6 days')::date),null,jsonb_build_array(jsonb_build_object('group_id',null,'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Uno'),(select id from public.players where first_names='Jugador' and last_names='Uno')))))$$,'23505',null,'un jugador repetido falla');
select throws_ok($$select public.create_call_up((select activity_id from public.call_ups limit 1),null,jsonb_build_array(jsonb_build_object('group_id',null,'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Dos')))))$$,'23505',null,'no hay segunda convocatoria por actividad');
select throws_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '6 days')::date),now()-interval '1 hour',jsonb_build_array(jsonb_build_object('group_id',null,'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Dos')))))$$,'23514',null,'fecha límite pasada falla');
select throws_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '6 days')::date),now()+interval '8 days',jsonb_build_array(jsonb_build_object('group_id',null,'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Dos')))))$$,'23514',null,'fecha límite posterior al inicio falla');

-- Lista única sin grupo y aislamiento de claves compuestas.
select lives_ok($$select public.create_call_up((select id from public.activities where starts_at::date=(now()+interval '7 days')::date),now()+interval '3 days',jsonb_build_array(jsonb_build_object('group_id',null,'player_ids',jsonb_build_array((select id from public.players where first_names='Jugador' and last_names='Dos')))))$$,'crea una lista sin grupo');
select ok(exists(select 1 from public.call_up_lists where group_id is null),'la lista única no tiene grupo');
select tests.clear_authentication();
select set_config('tests.player_b',(select id::text from public.players where last_names='B'),true);
select set_config('tests.group_b',(select id::text from public.groups where name='Grupo B Prueba 012'),true);
select tests.authenticate_as(tests.owner_of('academia-a'));
select throws_ok($$insert into public.call_up_players(academy_id,call_up_id,list_id,player_id) values(tests.academy_of('academia-a'),(select id from public.call_ups where deadline is not null order by deadline limit 1),(select id from public.call_up_lists limit 1),current_setting('tests.player_b')::uuid)$$,'23503',null,'jugador de B no se puede convocar en A');
select throws_ok($$insert into public.call_up_lists(academy_id,call_up_id,group_id,position) values(tests.academy_of('academia-a'),(select id from public.call_ups where deadline is not null order by deadline limit 1),current_setting('tests.group_b')::uuid,9)$$,'23503',null,'grupo de B no se usa en A');

-- Cierre e inmutabilidad.
update public.call_ups set closed_at=now() where id=(select id from public.call_ups where deadline=now()+interval '2 days' limit 1);
select ok(not (select public.call_up_is_open(id) from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1),'una convocatoria cerrada no está abierta');
select throws_ok($$insert into public.call_up_players(academy_id,call_up_id,list_id,player_id) values(tests.academy_of('academia-a'),(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1),(select id from public.call_up_lists where call_up_id=(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1)),(select id from public.players where first_names='Jugador' and last_names='Dos'))$$,'23514',null,'cerrada no suma jugadores');
select throws_ok($$delete from public.call_up_players where call_up_id=(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1)$$,'23514',null,'cerrada no quita jugadores');
select throws_ok($$update public.call_up_players set list_id=(select id from public.call_up_lists where group_id is null) where call_up_id=(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1)$$,'23514',null,'cerrada no mueve jugadores');
select throws_ok($$update public.call_up_lists set intro='Cambio' where call_up_id=(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1)$$,'23514',null,'cerrada no cambia texto');
select throws_ok($$update public.call_ups set deadline=now()+interval '1 day' where id=(select id from public.call_ups where deadline < now()+interval '2 days 1 minute' limit 1)$$,'23514',null,'cerrada no cambia fecha límite');
select throws_ok($$update public.activities set starts_at=now()+interval '1 hour' where id=(select activity_id from public.call_ups where deadline > now()+interval '2 days' and closed_at is null limit 1)$$,'23514',null,'no mueve el inicio antes de una fecha límite');

-- Cancelar cierra y una hora anterior a la fecha límite se rechaza.
update public.activities set status='cancelled' where id=(select activity_id from public.call_ups where closed_at is null limit 1);
select ok(not exists(select 1 from public.call_ups where closed_at is null and activity_id in (select id from public.activities where status='cancelled')),'cancelar actividad cierra convocatoria');

-- RLS A/B y anónimo.
select tests.authenticate_as(tests.owner_of('academia-b'));
select is((select count(*)::int from public.call_ups where academy_id=tests.academy_of('academia-a')),0,'B no ve convocatorias de A');
select tests.authenticate_as_anon();
select throws_ok($$select count(*) from public.call_ups$$,'42501',null,'anon no accede a convocatorias');
select tests.clear_authentication();
select * from finish();
rollback;
