-- RLS, políticas y privilegios de la Fase 1 (research R7 y R9; matriz RLS de
-- docs/architecture/database-schema.md).
--
-- Estrategia: se retiran los privilegios que Supabase concede por defecto a
-- anon y authenticated (incluidos DELETE y TRUNCATE, que RLS no cubre) y se
-- conceden solo los necesarios, por columna cuando la tabla es editable.
-- Las políticas no filtran deleted_at (R9): lo hacen las consultas.

-- 1. RLS en todas las tablas.
alter table public.plans enable row level security;
alter table public.legal_documents enable row level security;
alter table public.profiles enable row level security;
alter table public.academies enable row level security;
alter table public.subscriptions enable row level security;
alter table public.academy_members enable row level security;
alter table public.venues enable row level security;
alter table public.files enable row level security;
alter table public.legal_acceptances enable row level security;

-- 2. Privilegios.
revoke all on table
  public.plans, public.legal_documents, public.profiles, public.academies,
  public.subscriptions, public.academy_members, public.venues, public.files,
  public.legal_acceptances
from anon, authenticated;

grant select on public.plans to authenticated;
grant select on public.legal_documents to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select on public.academies to authenticated;
grant update (name, logo_file_id, contact_email, contact_phone, address, city)
  on public.academies to authenticated;

grant select on public.subscriptions to authenticated;
grant select on public.academy_members to authenticated;
grant select on public.legal_acceptances to authenticated;

grant select on public.venues to authenticated;
grant insert (academy_id, name, type, address, city, directions, is_active, created_by)
  on public.venues to authenticated;
grant update (name, type, address, city, directions, is_active, deleted_at)
  on public.venues to authenticated;

grant select on public.files to authenticated;
grant insert (id, academy_id, bucket, storage_key, module, entity_id, original_name,
              mime_type, size_bytes, checksum_sha256, created_by)
  on public.files to authenticated;
grant update (deleted_at) on public.files to authenticated;

-- 3. Políticas.

-- Catálogos.
create policy plans_select_authenticated
  on public.plans for select to authenticated
  using (true);

create policy legal_documents_select_public
  on public.legal_documents for select to anon, authenticated
  using (true);

-- Identidad.
create policy profiles_select_own
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Tenant.
create policy academies_select_member
  on public.academies for select to authenticated
  using (public.is_academy_member(id));

create policy academies_update_owner
  on public.academies for update to authenticated
  using (public.has_academy_role(id, array['owner']))
  with check (public.has_academy_role(id, array['owner']));

create policy subscriptions_select_member
  on public.subscriptions for select to authenticated
  using (public.is_academy_member(academy_id));

-- La propia membresía es legible aunque la academia esté suspendida: permite al
-- cliente distinguir "suspendida" de "sin academia" (current_academy_id() es NULL).
create policy academy_members_select_own
  on public.academy_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy legal_acceptances_select_own
  on public.legal_acceptances for select to authenticated
  using (user_id = (select auth.uid()));

-- Sedes.
create policy venues_select_member
  on public.venues for select to authenticated
  using (public.is_academy_member(academy_id));

create policy venues_insert_owner
  on public.venues for insert to authenticated
  with check (
    public.has_academy_role(academy_id, array['owner'])
    and created_by = (select auth.uid())
  );

create policy venues_update_owner
  on public.venues for update to authenticated
  using (public.has_academy_role(academy_id, array['owner']))
  with check (public.has_academy_role(academy_id, array['owner']));

-- Archivos.
create policy files_select_member
  on public.files for select to authenticated
  using (public.is_academy_member(academy_id));

create policy files_insert_member
  on public.files for insert to authenticated
  with check (
    public.is_academy_member(academy_id)
    and created_by = (select auth.uid())
  );

create policy files_update_member
  on public.files for update to authenticated
  using (public.is_academy_member(academy_id))
  with check (public.is_academy_member(academy_id));
