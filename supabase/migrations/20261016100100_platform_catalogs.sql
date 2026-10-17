-- Catálogos globales de la plataforma: planes y documentos legales
-- (docs/architecture/database-schema.md, Fase 1; DEC-07 y DEC-19).

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('free', 'pro', 'advanced')),
  name text not null,
  max_venues int,
  max_members int,
  max_players int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.plans is 'Catálogo de planes. Límites en NULL = ilimitado (DEC-07).';

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('terms', 'privacy_policy')),
  version text not null,
  url text not null,
  published_at timestamptz not null,
  is_current boolean not null default false,
  unique (type, version)
);

comment on table public.legal_documents is 'Versiones de los documentos legales (DEC-19).';

-- Una sola versión vigente por tipo de documento (FR-027).
create unique index legal_documents_one_current_per_type
  on public.legal_documents (type)
  where is_current;

-- Datos de referencia.
insert into public.plans (code, name) values
  ('free', 'Free'),
  ('pro', 'Pro'),
  ('advanced', 'Advanced');

-- Versiones de prueba con URL provisional; el texto definitivo queda fuera de la spec 001.
insert into public.legal_documents (type, version, url, published_at, is_current) values
  ('terms', '2026-10-v1', 'https://playertech.app/legal/terms/2026-10-v1', '2026-10-16T00:00:00-05:00', true),
  ('privacy_policy', '2026-10-v1', 'https://playertech.app/legal/privacy_policy/2026-10-v1', '2026-10-16T00:00:00-05:00', true);
