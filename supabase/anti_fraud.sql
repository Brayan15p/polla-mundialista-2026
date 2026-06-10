-- ============================================================================
-- ANTI-FRAUDE — enforce the betting deadline in the DATABASE.
--
-- Row Level Security (schema.sql) already stops a user from editing other
-- people's bets or writing results. This file closes the last hole: it makes
-- the "5 minutes before kickoff" lock impossible to bypass, even by calling
-- the Supabase API directly (the client-side lock alone is not enough).
--
-- Run this AFTER schema.sql, then sign in as admin and press
-- "Sincronizar partidos" in the admin panel so the kickoff times are loaded.
-- ============================================================================

-- Kickoff time of every match (read by everyone, written only by the admin).
create table if not exists public.matches (
  id      text primary key,
  kickoff timestamptz not null
);

alter table public.matches enable row level security;
drop policy if exists "matches read"  on public.matches;
drop policy if exists "matches admin" on public.matches;
create policy "matches read"  on public.matches for select using (true);
create policy "matches admin" on public.matches for all
  using      (auth.uid() = '00000000-0000-0000-0000-000000000000')   -- ← your admin uid
  with check (auth.uid() = '00000000-0000-0000-0000-000000000000');

-- Reject any bet placed within 5 minutes of (or after) kickoff.
create or replace function public.check_bet_deadline()
returns trigger language plpgsql security definer set search_path = public as $$
declare ko timestamptz;
begin
  select kickoff into ko from public.matches where id = new.match_id;
  if ko is null then
    raise exception 'Partido no sincronizado (%). El admin debe sincronizar los partidos.', new.match_id;
  end if;
  if now() >= ko - interval '5 minutes' then
    raise exception 'Apuestas cerradas: faltan menos de 5 minutos para el partido.';
  end if;
  return new;
end; $$;

drop trigger if exists bets_deadline on public.bets;
create trigger bets_deadline
  before insert or update on public.bets
  for each row execute function public.check_bet_deadline();
