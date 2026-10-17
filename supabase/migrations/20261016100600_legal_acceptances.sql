-- Aceptaciones legales: registro auditado e inmutable (DEC-09, DEC-19).
-- DEC-29: en el MVP no se capturan la IP ni el navegador; esas columnas quedan vacías.

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  academy_id uuid not null references public.academies (id),
  legal_document_id uuid not null references public.legal_documents (id),
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text
);

comment on table public.legal_acceptances is 'Solo inserciones desde el registro; no se modifica ni se elimina (FR-026).';

create index legal_acceptances_user_id_idx on public.legal_acceptances (user_id);
create index legal_acceptances_academy_id_idx on public.legal_acceptances (academy_id);
