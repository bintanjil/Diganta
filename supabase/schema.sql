-- Diganta backend schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor.

-- Single-row-per-user snapshot of the local app data (JSONB).
create table if not exists public.snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.snapshots enable row level security;

-- Each user can only read/write their own snapshot.
drop policy if exists "snapshots_owner_all" on public.snapshots;
create policy "snapshots_owner_all"
  on public.snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: household sharing (shared wallet). Members of a household can read
-- each other's shared transactions. Kept minimal for now.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  primary key (household_id, user_id)
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;

drop policy if exists "households_member_read" on public.households;
create policy "households_member_read"
  on public.households
  for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.household_members m
      where m.household_id = id and m.user_id = auth.uid()
    )
  );

drop policy if exists "households_owner_write" on public.households;
create policy "households_owner_write"
  on public.households
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "household_members_read" on public.household_members;
create policy "household_members_read"
  on public.household_members
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_id = auth.uid()
    )
  );

drop policy if exists "household_members_owner_write" on public.household_members;
create policy "household_members_owner_write"
  on public.household_members
  for all
  using (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.households h
      where h.id = household_id and h.owner_id = auth.uid()
    )
  );
