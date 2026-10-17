-- Perfil de la persona, independiente de la academia (DEC-08).

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos personales del usuario autenticado; independiente de la academia.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
