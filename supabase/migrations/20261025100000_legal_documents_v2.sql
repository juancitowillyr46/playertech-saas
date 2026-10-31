-- Spec 016: documentos legales en la aplicación (DEC-49, data-model.md).
-- La v1 apuntaba a una URL provisional que nunca existió: queda como historial de las cuentas
-- de prueba. La v2 apunta a su archivo estático, publicado con el frontend; un archivo
-- publicado no se modifica y un texto nuevo es una versión nueva.

-- Primero se desactiva la v1: solo puede haber una versión vigente por tipo.
update public.legal_documents
set is_current = false
where version = '2026-10-v1';

insert into public.legal_documents (type, version, url, published_at, is_current) values
  ('terms', '2026-10-v2', '/legal/terms/2026-10-v2.html', '2026-10-25T00:00:00-05:00', true),
  ('privacy_policy', '2026-10-v2', '/legal/privacy_policy/2026-10-v2.html', '2026-10-25T00:00:00-05:00', true);
