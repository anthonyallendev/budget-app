-- Retirely premium features migration (2026-07-04)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Adds: user_feature_data (scenario planner + age pension inputs), ai_reports,
-- households + household_members (partner mode) with RPC helpers and shared
-- transaction visibility for household members.

-- ── Generic per-user feature data (jsonb) ───────────────────────────────────
create table if not exists public.user_feature_data (
  user_id    uuid not null references auth.users(id) on delete cascade,
  feature    text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature)
);
alter table public.user_feature_data enable row level security;
drop policy if exists "own feature data" on public.user_feature_data;
create policy "own feature data" on public.user_feature_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── AI monthly money reports (written by the server, read by the owner) ─────
create table if not exists public.ai_reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  month      text not null,               -- 'YYYY-MM'
  content    text not null,
  model      text,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);
alter table public.ai_reports enable row level security;
drop policy if exists "own ai reports" on public.ai_reports;
create policy "own ai reports" on public.ai_reports
  for select using (auth.uid() = user_id);
-- Inserts/updates happen via the service-role key (bypasses RLS).

-- ── Households (partner mode) ────────────────────────────────────────────────
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our household',
  owner_id    uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);
alter table public.households enable row level security;
alter table public.household_members enable row level security;

-- Helper: the caller's household id (security definer avoids recursive RLS)
create or replace function public.my_household_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select household_id from household_members where user_id = auth.uid()
$$;

drop policy if exists "members read household" on public.households;
create policy "members read household" on public.households
  for select using (id = public.my_household_id());

drop policy if exists "members read members" on public.household_members;
create policy "members read members" on public.household_members
  for select using (household_id = public.my_household_id());

-- Household members can read (not write) each other's transactions
drop policy if exists "household read transactions" on public.transactions;
create policy "household read transactions" on public.transactions
  for select using (
    public.my_household_id() is not null
    and user_id in (
      select user_id from public.household_members
      where household_id = public.my_household_id()
    )
  );

-- ── Household RPCs (called from the app via supabase.rpc) ───────────────────
create or replace function public.create_household(p_name text default 'Our household')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.my_household_id() is not null then raise exception 'You are already in a household'; end if;
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
  insert into households (name, owner_id, invite_code)
    values (coalesce(nullif(trim(p_name), ''), 'Our household'), auth.uid(), v_code)
    returning id into v_id;
  insert into household_members (household_id, user_id) values (v_id, auth.uid());
  return v_id;
end $$;

create or replace function public.join_household(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.my_household_id() is not null then raise exception 'You are already in a household'; end if;
  select id into v_id from households where invite_code = upper(trim(p_code));
  if v_id is null then raise exception 'Invalid invite code'; end if;
  insert into household_members (household_id, user_id) values (v_id, auth.uid());
  return v_id;
end $$;

create or replace function public.leave_household()
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from household_members where user_id = auth.uid();
  -- remove empty households
  delete from households h
    where not exists (select 1 from household_members m where m.household_id = h.id);
end $$;

create or replace function public.get_household()
returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'household', (
      select json_build_object(
        'id', h.id, 'name', h.name, 'invite_code', h.invite_code,
        'owner_id', h.owner_id, 'created_at', h.created_at)
      from households h where h.id = public.my_household_id()
    ),
    'members', (
      select coalesce(json_agg(json_build_object(
        'user_id', m.user_id,
        'joined_at', m.joined_at,
        'name', coalesce(nullif(p.full_name, ''), p.username, 'Member'),
        'username', p.username)), '[]'::json)
      from household_members m
      left join profiles p on p.id = m.user_id
      where m.household_id = public.my_household_id()
    )
  );
$$;

grant execute on function public.my_household_id() to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
grant execute on function public.leave_household() to authenticated;
grant execute on function public.get_household() to authenticated;
