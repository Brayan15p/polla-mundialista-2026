-- ============================================================================
-- Polla Mundialista 2026 — Supabase schema
-- Run this in Supabase → SQL Editor → New query → Run.
-- It is safe to re-run (uses "if not exists" / "or replace").
-- ============================================================================

-- 1) PROFILES — one row per registered player, linked to Supabase Auth.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  player_id   text,                       -- chosen FUT-style card (messi, mbappe, …)
  pool_joined boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 2) BETS — one row per (user, match). A user can only have one bet per match.
create table if not exists public.bets (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  match_id   text not null,
  home       smallint not null check (home between 0 and 30),
  away       smallint not null check (away between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- Two bet types (exact score vs. winner-only). Kept here too — and idempotent —
-- so simply re-running schema.sql is enough to make betting work; you don't have
-- to also remember migration_bet_kind.sql. Without these columns the bet write
-- fails and nothing saves to the cloud.
alter table public.bets
  add column if not exists kind text not null default 'score',
  add column if not exists pick text;
alter table public.bets drop constraint if exists bets_kind_chk;
alter table public.bets add constraint bets_kind_chk check (kind in ('score', 'winner'));
alter table public.bets drop constraint if exists bets_pick_chk;
alter table public.bets add constraint bets_pick_chk check (
  (kind = 'winner' and pick in ('H', 'D', 'A')) or
  (kind = 'score'  and pick is null)
);

-- 3) MATCH_RESULTS — real final scores, written only by an admin.
create table if not exists public.match_results (
  match_id   text primary key,
  home       smallint not null,
  away       smallint not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY — the publishable/anon key is safe in the browser ONLY
-- because these policies restrict what it can do.
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.bets          enable row level security;
alter table public.match_results enable row level security;

-- PROFILES: everyone can read (to show usernames/avatars), you edit only yours.
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles upsert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- BETS: everyone can read (so finished matches reveal who bet what),
-- but you can only insert/update/delete your OWN bets.
drop policy if exists "bets read"   on public.bets;
drop policy if exists "bets insert" on public.bets;
drop policy if exists "bets update" on public.bets;
drop policy if exists "bets delete" on public.bets;
create policy "bets read"   on public.bets for select using (true);
create policy "bets insert" on public.bets for insert with check (auth.uid() = user_id);
create policy "bets update" on public.bets for update using (auth.uid() = user_id);
create policy "bets delete" on public.bets for delete using (auth.uid() = user_id);

-- MATCH_RESULTS: everyone can read; only the admin (set your own uid below)
-- may write. Replace the uuid with your admin user id from auth.users.
drop policy if exists "results read"  on public.match_results;
drop policy if exists "results admin" on public.match_results;
create policy "results read"  on public.match_results for select using (true);
create policy "results admin" on public.match_results for all
  using  (auth.uid() = '00000000-0000-0000-0000-000000000000')
  with check (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- AUTO-PROFILE — create a profile row automatically when a user signs up.
-- The client passes username + pool_joined as auth metadata; this trigger
-- (running as the table owner) copies them in, so no client-side insert is
-- needed and signup works even with email confirmation enabled.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, pool_joined)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Jugador'),
    coalesce((new.raw_user_meta_data->>'pool_joined')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- REALTIME — so every device updates live when a bet or result changes.
-- Safe to re-run: only adds the table if it isn't already in the publication.
-- ============================================================================
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bets'
  ) then
    alter publication supabase_realtime add table public.bets;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_results'
  ) then
    alter publication supabase_realtime add table public.match_results;
  end if;
end $$;

-- Keep updated_at fresh on bet changes.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists bets_touch on public.bets;
create trigger bets_touch before update on public.bets
  for each row execute function public.touch_updated_at();
