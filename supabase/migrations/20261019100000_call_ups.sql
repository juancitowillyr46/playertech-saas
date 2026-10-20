-- Convocatorias, listas y convocados (spec 012; DEC-31, DEC-34 y DEC-45).

-- ============================================================
-- 1. Tablas
-- ============================================================
create table public.call_ups (
  id uuid primary key default gen_random_uuid(), academy_id uuid not null references public.academies (id), activity_id uuid not null,
  deadline timestamptz, closed_at timestamptz, deleted_at timestamptz,
  created_by uuid not null default public.current_user_id() references auth.users (id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint call_ups_academy_id_id_key unique (academy_id, id), foreign key (academy_id, activity_id) references public.activities (academy_id, id)
);
comment on table public.call_ups is 'Convocatoria única de una actividad. Borrado lógico; no tiene borrado físico en el MVP.';
create unique index call_ups_one_per_activity on public.call_ups (activity_id) where deleted_at is null;
create trigger call_ups_set_updated_at before update on public.call_ups for each row execute function public.set_updated_at();

create table public.call_up_lists (
  id uuid primary key default gen_random_uuid(), academy_id uuid not null references public.academies (id), call_up_id uuid not null, group_id uuid,
  token text not null default replace(gen_random_uuid()::text, '-', ''), intro text check (intro is null or length(intro) <= 500), position integer not null,
  created_by uuid not null default public.current_user_id() references auth.users (id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint call_up_lists_academy_id_id_key unique (academy_id, id), constraint call_up_lists_token_key unique (token), constraint call_up_lists_group_key unique nulls not distinct (call_up_id, group_id),
  foreign key (academy_id, call_up_id) references public.call_ups (academy_id, id), foreign key (academy_id, group_id) references public.groups (academy_id, id)
);
comment on table public.call_up_lists is 'Lista por grupo o única sin grupo. Se borra físicamente al quedar vacía.';
create trigger call_up_lists_set_updated_at before update on public.call_up_lists for each row execute function public.set_updated_at();

create table public.call_up_players (
  academy_id uuid not null references public.academies (id), call_up_id uuid not null, list_id uuid not null, player_id uuid not null,
  created_by uuid not null default public.current_user_id() references auth.users (id), created_at timestamptz not null default now(), primary key (call_up_id, player_id),
  foreign key (academy_id, call_up_id) references public.call_ups (academy_id, id), foreign key (academy_id, list_id) references public.call_up_lists (academy_id, id), foreign key (academy_id, player_id) references public.players (academy_id, id)
);
comment on table public.call_up_players is 'Jugador convocado; relación sin historia y con borrado físico.';
create index call_up_players_list_id_idx on public.call_up_players (list_id);

-- ============================================================
-- 2. Funciones y triggers
-- ============================================================
create or replace function public.call_up_is_open(p_call_up_id uuid) returns boolean language sql stable security invoker set search_path = '' as $$
  select c.closed_at is null and now() < coalesce(c.deadline, a.starts_at) from public.call_ups c join public.activities a on a.id=c.activity_id and a.academy_id=c.academy_id where c.id=p_call_up_id and c.deleted_at is null;
$$;
comment on function public.call_up_is_open(uuid) is 'Indica si la convocatoria sigue abierta sin una tarea programada.';

create or replace function public.call_ups_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_starts_at timestamptz; v_status text;
begin
  select starts_at,status into v_starts_at,v_status from public.activities where id=new.activity_id and academy_id=new.academy_id;
  if tg_op='INSERT' and (v_starts_at is null or v_starts_at<=now() or v_status<>'scheduled') then raise exception 'activity_not_callable' using errcode='23514'; end if;
  if new.deadline is not null and (new.deadline<=now() or new.deadline>=v_starts_at) then raise exception 'invalid_call_up_deadline' using errcode='23514'; end if;
  if tg_op='UPDATE' and old.closed_at is not null and (new.deadline,new.closed_at,new.deleted_at) is distinct from (old.deadline,old.closed_at,old.deleted_at) then raise exception 'call_up_closed' using errcode='23514'; end if;
  if tg_op='UPDATE' and old.closed_at is not null and new.closed_at is null then raise exception 'call_up_closed' using errcode='23514'; end if;
  return new;
end;
$$;
create trigger call_ups_guard before insert or update on public.call_ups for each row execute function public.call_ups_guard();

create or replace function public.call_up_members_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_call_up_id uuid:=coalesce(new.call_up_id,old.call_up_id);
begin if not public.call_up_is_open(v_call_up_id) then raise exception 'call_up_closed' using errcode='23514'; end if; if tg_op='DELETE' then return old; end if; return new; end;
$$;
create trigger call_up_lists_guard before insert or update or delete on public.call_up_lists for each row execute function public.call_up_members_guard();
create trigger call_up_players_guard before insert or update or delete on public.call_up_players for each row execute function public.call_up_members_guard();

create or replace function public.activities_call_up_sync() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.starts_at is distinct from old.starts_at and exists(select 1 from public.call_ups c where c.activity_id=new.id and c.academy_id=new.academy_id and c.closed_at is null and c.deadline>=new.starts_at) then raise exception 'call_up_deadline_after_start' using errcode='23514'; end if;
  if new.status='cancelled' and old.status is distinct from 'cancelled' then update public.call_ups set closed_at=now() where activity_id=new.id and academy_id=new.academy_id and closed_at is null; end if;
  return new;
end;
$$;
create trigger activities_call_up_sync before update of starts_at,status on public.activities for each row execute function public.activities_call_up_sync();

create or replace function public.create_call_up(p_activity_id uuid,p_deadline timestamptz,p_lists jsonb) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_academy_id uuid:=public.current_academy_id();v_call_up_id uuid;v_list jsonb;v_list_id uuid;v_position integer:=0;
begin
 if not public.has_academy_role(v_academy_id,array['owner']) then raise exception 'not_owner' using errcode='42501'; end if;
 insert into public.call_ups(academy_id,activity_id,deadline) values(v_academy_id,p_activity_id,p_deadline) returning id into v_call_up_id;
 for v_list in select value from jsonb_array_elements(p_lists) loop
  insert into public.call_up_lists(academy_id,call_up_id,group_id,position) values(v_academy_id,v_call_up_id,nullif(v_list->>'group_id','')::uuid,v_position) returning id into v_list_id;
  insert into public.call_up_players(academy_id,call_up_id,list_id,player_id) select v_academy_id,v_call_up_id,v_list_id,value::text::uuid from jsonb_array_elements_text(coalesce(v_list->'player_ids','[]'::jsonb)); v_position:=v_position+1;
 end loop;
 if not exists(select 1 from public.call_up_players where call_up_id=v_call_up_id) then raise exception 'call_up_requires_players' using errcode='23514'; end if;
 return v_call_up_id;
end;
$$;
comment on function public.create_call_up(uuid,timestamptz,jsonb) is 'Crea atómicamente una convocatoria con sus listas y convocados.';

-- ============================================================
-- 3. RLS, políticas y privilegios por columna
-- ============================================================
alter table public.call_ups enable row level security; alter table public.call_up_lists enable row level security; alter table public.call_up_players enable row level security;
revoke all on table public.call_ups,public.call_up_lists,public.call_up_players from anon,authenticated;
grant select on public.call_ups,public.call_up_lists,public.call_up_players to authenticated;
grant insert(academy_id,activity_id,deadline,created_by) on public.call_ups to authenticated; grant update(deadline,closed_at) on public.call_ups to authenticated;
grant insert(academy_id,call_up_id,group_id,position,created_by) on public.call_up_lists to authenticated; grant update(intro) on public.call_up_lists to authenticated; grant delete on public.call_up_lists to authenticated;
grant insert(academy_id,call_up_id,list_id,player_id,created_by) on public.call_up_players to authenticated; grant update(list_id) on public.call_up_players to authenticated; grant delete on public.call_up_players to authenticated;
create policy call_ups_select_member on public.call_ups for select to authenticated using(public.is_academy_member(academy_id));
create policy call_ups_insert_owner on public.call_ups for insert to authenticated with check(public.has_academy_role(academy_id,array['owner']) and created_by=public.current_user_id());
create policy call_ups_update_owner on public.call_ups for update to authenticated using(public.has_academy_role(academy_id,array['owner'])) with check(public.has_academy_role(academy_id,array['owner']));
create policy call_up_lists_select_member on public.call_up_lists for select to authenticated using(public.is_academy_member(academy_id));
create policy call_up_lists_insert_owner on public.call_up_lists for insert to authenticated with check(public.has_academy_role(academy_id,array['owner']) and created_by=public.current_user_id());
create policy call_up_lists_update_owner on public.call_up_lists for update to authenticated using(public.has_academy_role(academy_id,array['owner'])) with check(public.has_academy_role(academy_id,array['owner']));
create policy call_up_lists_delete_owner on public.call_up_lists for delete to authenticated using(public.has_academy_role(academy_id,array['owner']));
create policy call_up_players_select_member on public.call_up_players for select to authenticated using(public.is_academy_member(academy_id));
create policy call_up_players_insert_owner on public.call_up_players for insert to authenticated with check(public.has_academy_role(academy_id,array['owner']) and created_by=public.current_user_id());
create policy call_up_players_update_owner on public.call_up_players for update to authenticated using(public.has_academy_role(academy_id,array['owner'])) with check(public.has_academy_role(academy_id,array['owner']));
create policy call_up_players_delete_owner on public.call_up_players for delete to authenticated using(public.has_academy_role(academy_id,array['owner']));
revoke execute on function public.call_up_is_open(uuid),public.create_call_up(uuid,timestamptz,jsonb) from public,anon; grant execute on function public.call_up_is_open(uuid),public.create_call_up(uuid,timestamptz,jsonb) to authenticated;
