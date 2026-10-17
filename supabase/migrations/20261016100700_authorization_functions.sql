-- Funciones de autorización (research R5; contracts/database-api.md).
-- SECURITY DEFINER evita la recursión de políticas sobre academy_members; el
-- search_path vacío evita la suplantación de objetos. Todas exigen membresía
-- activa Y academia activa, de modo que la suspensión (DEC-18) se aplica aquí.
-- El índice UNIQUE de academy_members.user_id cubre sus consultas.

create or replace function public.is_academy_member(p_academy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.academy_members m
    join public.academies a on a.id = m.academy_id
    where m.academy_id = p_academy_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and a.status = 'active'
  );
$$;

create or replace function public.current_academy_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.academy_id
  from public.academy_members m
  join public.academies a on a.id = m.academy_id
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and a.status = 'active';
$$;

create or replace function public.has_academy_role(p_academy_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.academy_members m
    join public.academies a on a.id = m.academy_id
    where m.academy_id = p_academy_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and a.status = 'active'
      and m.role = any (p_roles)
  );
$$;

revoke execute on function public.is_academy_member(uuid) from public, anon;
revoke execute on function public.current_academy_id() from public, anon;
revoke execute on function public.has_academy_role(uuid, text[]) from public, anon;

grant execute on function public.is_academy_member(uuid) to authenticated;
grant execute on function public.current_academy_id() to authenticated;
grant execute on function public.has_academy_role(uuid, text[]) to authenticated;
