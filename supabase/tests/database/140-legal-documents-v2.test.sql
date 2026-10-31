-- Spec 016: documentos legales en la aplicación (contracts/contracts.md, base de datos).

begin;

select plan(6);

select is(
  (select string_agg(type || ':' || version || ':' || url, ',' order by type) from public.legal_documents where is_current),
  'privacy_policy:2026-10-v2:/legal/privacy_policy/2026-10-v2.html,terms:2026-10-v2:/legal/terms/2026-10-v2.html',
  'la v2 es la vigente de los dos documentos, con la ruta de su archivo'
);
select is((select count(*)::int from public.legal_documents where version = '2026-10-v1' and not is_current), 2, 'la v1 se conserva como historial');
select ok((select bool_and(published_at = '2026-10-25T00:00:00-05:00') from public.legal_documents where version = '2026-10-v2'), 'la v2 se publicó el 25 de octubre de 2026');

-- Un registro nuevo acepta la versión vigente.
select set_config('tests.v2_user', tests.create_user('legal.v2@playertech.test', tests.valid_metadata('Academia Legal', 'Owner Legal'))::text, true);
select is(
  (select string_agg(d.type || ':' || d.version, ',' order by d.type)
   from public.legal_acceptances la join public.legal_documents d on d.id = la.legal_document_id
   where la.user_id = current_setting('tests.v2_user')::uuid),
  'privacy_policy:2026-10-v2,terms:2026-10-v2',
  'un registro nuevo acepta la v2'
);
select throws_ok(
  $$select tests.create_user('legal.v1@playertech.test', jsonb_build_object('academy_name', 'Academia Vieja', 'full_name', 'Owner Viejo', 'legal_acceptances', jsonb_build_object('terms', '2026-10-v1', 'privacy_policy', '2026-10-v1')))$$,
  '23514', null, 'ya no se registra aceptando la v1'
);

select tests.authenticate_as_anon();
select is((select count(*)::int from public.legal_documents where is_current), 2, 'anon lee las versiones vigentes');
select tests.clear_authentication();

select * from finish();
rollback;
