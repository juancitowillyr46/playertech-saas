-- Historia 5 / CA-006 de T-00: almacenamiento aislado por academia (ADR-013).
-- Los límites de tipo y tamaño los aplica la API de Storage: aquí se verifica la
-- configuración de los buckets; la subida rechazada se valida en el quickstart (§4).

begin;

select plan(16);

-- ============================================================
-- Configuración de los buckets (escenarios 3 y 4)
-- ============================================================
select is(
  (select public from storage.buckets where id = 'public-assets'),
  true, 'public-assets es público (lectura por URL pública)'
);
select is(
  (select file_size_limit from storage.buckets where id = 'public-assets'),
  1048576::bigint, 'public-assets limita el tamaño a 1 MB'
);
select set_eq(
  $$select unnest(allowed_mime_types) from storage.buckets where id = 'public-assets'$$,
  array['image/jpeg', 'image/png'],
  'public-assets solo acepta JPG y PNG'
);
select is(
  (select public from storage.buckets where id = 'private-files'),
  false, 'private-files es privado'
);

-- Preparación: un objeto privado de B.
insert into storage.objects (bucket_id, name, owner_id)
values (
  'private-files',
  tests.academy_of('academia-b') || '/documents/' || gen_random_uuid() || '/' || gen_random_uuid() || '.pdf',
  tests.owner_of('academia-b')::text
);

-- ============================================================
-- Escritura como owner A (escenarios 1 y 2)
-- ============================================================
select tests.authenticate_as(tests.owner_of('academia-a'));

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('public-assets',
            tests.academy_of('academia-a') || '/academy/' || tests.academy_of('academia-a') || '/' || gen_random_uuid() || '.png',
            auth.uid()::text)$$,
  'A sube un logo en el espacio de su academia'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('public-assets',
            tests.academy_of('academia-b') || '/academy/' || tests.academy_of('academia-b') || '/' || gen_random_uuid() || '.png',
            auth.uid()::text)$$,
  '42501', null, 'A no sube en el espacio de B'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('public-assets', 'logos/' || gen_random_uuid() || '.png', auth.uid()::text)$$,
  '42501', null, 'se rechaza una ruta cuyo primer segmento no es una academia'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('private-files',
            tests.academy_of('academia-b') || '/documents/x/' || gen_random_uuid() || '.pdf',
            auth.uid()::text)$$,
  '42501', null, 'A no sube en el espacio privado de B'
);

-- Registro del archivo en public.files (escenario 1).
select lives_ok(
  $$insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes)
    select tests.academy_of('academia-a'), 'public-assets', name, 'academy', tests.academy_of('academia-a'),
           'logo.png', 'image/png', 51200
    from storage.objects
    where bucket_id = 'public-assets'
      and name like tests.academy_of('academia-a') || '/academy/%'$$,
  'A registra su archivo con clave, tipo y tamaño'
);

select is(
  (select created_by from public.files where academy_id = tests.academy_of('academia-a')),
  tests.owner_of('academia-a'),
  'el archivo queda registrado con A como autor'
);

select throws_ok(
  $$insert into public.files (academy_id, bucket, storage_key, module, entity_id, original_name, mime_type, size_bytes)
    values (tests.academy_of('academia-b'), 'public-assets',
            tests.academy_of('academia-b') || '/academy/x/' || gen_random_uuid() || '.png',
            'academy', gen_random_uuid(), 'x.png', 'image/png', 10)$$,
  '42501', null, 'A no registra archivos de B'
);

-- ============================================================
-- Lectura (escenario 5)
-- ============================================================
select is(
  (select count(*)::int from storage.objects where bucket_id = 'private-files'),
  0, 'A no ve los archivos privados de B'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'public-assets'),
  1, 'A ve sus propios objetos'
);

select tests.authenticate_as(tests.owner_of('academia-b'));

select is(
  (select count(*)::int from storage.objects where bucket_id = 'private-files'),
  1, 'B ve su archivo privado'
);

select is(
  (select count(*)::int from storage.objects where bucket_id = 'public-assets'),
  0, 'B no ve los objetos de A'
);

-- Sin sesión no se pueden listar las claves; la lectura pública es por URL.
select tests.clear_authentication();
select tests.authenticate_as_anon();

select is(
  (select count(*)::int from storage.objects),
  0, 'anon no puede listar objetos de ninguna academia'
);

select tests.clear_authentication();

select * from finish();

rollback;
