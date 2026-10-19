-- Spec 010: autorización en la persona y asignación de acudientes ya registrados (research R5).

begin;

select plan(14);

-- ============================================================
-- Esquema
-- ============================================================
select col_not_null('public', 'guardians', 'consent_document_id', 'guardians: la autorización es obligatoria en la persona');
select col_not_null('public', 'guardians', 'consent_at', 'guardians: con su hora');
select hasnt_column('public', 'guardian_links', 'consent_document_id', 'guardian_links: ya no guarda la autorización');

-- Preparación (superusuario): un acudiente en la academia B.
insert into public.guardians (academy_id, full_name, phone, consent_document_id, created_by)
values (tests.academy_of('academia-b'), 'Acudiente B', '3009998877',
        (select id from public.legal_documents where type = 'privacy_policy' and is_current), tests.owner_of('academia-b'));

-- ============================================================
-- Owner A
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

insert into public.players (academy_id, first_names, last_names, birth_date)
values (tests.academy_of('academia-a'), 'Hermano', 'Uno', date '2014-01-01'),
       (tests.academy_of('academia-a'), 'Hermana', 'Dos', date '2016-01-01');

select lives_ok(
  $$select * from public.add_player_guardian((select id from public.players where first_names = 'Hermano'), 'Mamá Prueba', '3001110000', 'mother', true)$$,
  'add_player_guardian: registra a la persona nueva'
);
select lives_ok(
  $$select * from public.add_player_guardian((select id from public.players where first_names = 'Hermano'), 'Papá Prueba', '3001110001', 'father', true)$$,
  'add_player_guardian: registra al segundo acudiente'
);

select is(
  (select consent_document_id from public.guardians where phone = '3001110000'),
  (select id from public.legal_documents where type = 'privacy_policy' and is_current),
  'add_player_guardian: guarda la Política vigente en la persona'
);

select is(
  public.assign_guardians(
    (select id from public.players where first_names = 'Hermana'),
    jsonb_build_array(jsonb_build_object('guardian_id', (select id from public.guardians where phone = '3001110000'), 'relationship', 'mother'))
  ),
  1, 'assign_guardians: asigna un acudiente ya registrado'
);

select is(
  public.assign_guardians(
    (select id from public.players where first_names = 'Hermana'),
    (select jsonb_agg(jsonb_build_object('guardian_id', g.id, 'relationship', 'other')) from public.guardians g where g.phone in ('3001110000', '3001110001'))
  ),
  1, 'assign_guardians: asigna varios y omite el ya vinculado'
);

select is(
  (select count(*)::int from public.guardian_links l join public.players p on p.id = l.player_id
   where p.first_names = 'Hermana' and l.status = 'validated' and l.deleted_at is null),
  2, 'assign_guardians: vínculos validados y sin duplicados'
);

select throws_ok(
  format($$select public.assign_guardians(%L, %L::jsonb)$$,
    (select id from public.players where first_names = 'Hermana'),
    jsonb_build_array(jsonb_build_object('guardian_id', (select id from public.guardians where phone = '3001110000'), 'relationship', 'self'))),
  '23514', null, 'assign_guardians: «Soy el jugador» no se admite'
);

select throws_ok(
  format($$select public.assign_guardians(%L, %L::jsonb)$$,
    (select id from public.players where first_names = 'Hermana'),
    jsonb_build_array(jsonb_build_object('guardian_id', (select id from public.guardians where phone = '3001110001'), 'relationship', 'father'),
                      jsonb_build_object('guardian_id', gen_random_uuid(), 'relationship', 'father'))),
  '42501', null, 'assign_guardians: con un acudiente ajeno o inexistente no asigna ninguno'
);

-- ============================================================
-- Aislamiento
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-b'));

select throws_ok(
  format($$select public.assign_guardians(%L, %L::jsonb)$$,
    (select id from public.players where first_names = 'Hermana'),
    jsonb_build_array(jsonb_build_object('guardian_id', (select id from public.guardians where phone = '3009998877'), 'relationship', 'other'))),
  '42501', null, 'assign_guardians: B no asigna a un jugador de A'
);

select is(
  (select count(*)::int from public.guardians where academy_id = tests.academy_of('academia-a')),
  0, 'guardians: B no ve los de A'
);

select tests.authenticate_as_anon();

select throws_ok(
  $$select public.assign_guardians(gen_random_uuid(), '[]'::jsonb)$$,
  '42501', null, 'assign_guardians: anon no puede ejecutarla'
);

select tests.clear_authentication();

select * from finish();

rollback;
