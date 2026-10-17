-- Núcleo del tenant: academias, suscripciones y membresías (ADR-012).

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  country_code char(2) not null default 'CO',
  timezone text not null default 'America/Bogota',
  logo_file_id uuid,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.academies is 'Tenant. Raíz del aislamiento entre academias.';
comment on column public.academies.status is 'active | suspended (DEC-18). Sin transición desde la aplicación en el MVP.';
comment on column public.academies.logo_file_id is 'FK compuesta a files (academy_id, id), añadida en la migración files.';

create trigger academies_set_updated_at
  before update on public.academies
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  plan_id uuid not null references public.plans (id),
  status text not null check (status in ('active', 'cancelled')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  provider_ref text,
  created_at timestamptz not null default now()
);

-- Como máximo una suscripción activa por academia (FR-024).
create unique index subscriptions_one_active_per_academy
  on public.subscriptions (academy_id)
  where status = 'active';

create index subscriptions_academy_id_idx on public.subscriptions (academy_id);

create table public.academy_members (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id),
  user_id uuid not null unique references auth.users (id),
  role text not null check (role in ('owner')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

comment on column public.academy_members.user_id is 'UNIQUE: una persona pertenece a una sola academia (DEC-02). También indexa las funciones de autorización.';

-- Exactamente un owner por academia (FR-024).
create unique index academy_members_one_owner_per_academy
  on public.academy_members (academy_id)
  where role = 'owner';

create index academy_members_academy_id_idx on public.academy_members (academy_id);
