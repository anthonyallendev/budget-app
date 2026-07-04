-- Household-shared premium (2026-07-04)
-- One Premium subscription covers every member of a household.
-- Run in the Supabase SQL Editor AFTER migration_2026-07-04_premium_features.sql.

create or replace function public.household_has_premium()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from household_members m
    join profiles p on p.id = m.user_id
    where m.household_id = public.my_household_id()
      and p.subscription_status = 'premium'
  );
$$;

grant execute on function public.household_has_premium() to authenticated;
