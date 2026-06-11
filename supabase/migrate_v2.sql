-- ============================================================================
-- Polla Mundialista 2026 — migrate_v2.sql
-- MIGRACION COMPLETA v2: un solo script que deja la base de datos lista.
-- Incluye todo lo de schema.sql, fix_all.sql, anti_fraud.sql y
-- migration_bet_kind.sql, mas las nuevas vistas y funciones.
--
-- Es IDEMPOTENTE: seguro de correr multiples veces sin romper nada.
-- No borra datos existentes.
-- ============================================================================

-- ========================================
-- 1. TABLAS BASE
-- ========================================

-- 1a) Perfiles de usuario
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  player_id   text,
  pool_joined boolean not null default false,
  email       text,
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;

-- 1b) Apuestas — una fila por (usuario, partido)
create table if not exists public.bets (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  match_id   text not null,
  home       smallint not null check (home between 0 and 30),
  away       smallint not null check (away between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- Columnas de tipo de apuesta (marcador exacto vs. solo ganador)
alter table public.bets
  add column if not exists kind text not null default 'score',
  add column if not exists pick text;
alter table public.bets drop constraint if exists bets_kind_chk;
alter table public.bets add constraint bets_kind_chk
  check (kind in ('score', 'winner'));
alter table public.bets drop constraint if exists bets_pick_chk;
alter table public.bets add constraint bets_pick_chk check (
  (kind = 'winner' and pick in ('H', 'D', 'A')) or
  (kind = 'score'  and pick is null)
);

-- 1c) Resultados reales — solo el admin escribe aqui
create table if not exists public.match_results (
  match_id   text primary key,
  home       smallint not null,
  away       smallint not null,
  updated_at timestamptz not null default now()
);

-- 1d) Partidos — tabla expandida, fuente de verdad para todo dato de partido
create table if not exists public.matches (
  id      text primary key,
  kickoff timestamptz not null
);

-- ========================================
-- 2. EXPANSION DE LA TABLA matches
-- ========================================

alter table public.matches
  add column if not exists home_team   text,
  add column if not exists away_team   text,
  add column if not exists group_key   text,
  add column if not exists stage       text,
  add column if not exists venue       text,
  add column if not exists home_score  smallint,
  add column if not exists away_score  smallint;

-- status y updated_at necesitan default, hay que manejar el caso de que ya existan
alter table public.matches
  add column if not exists status     text not null default 'upcoming',
  add column if not exists updated_at timestamptz not null default now();

-- ========================================
-- 3. FUNCION AUXILIAR: outcome_of
-- Calcula el resultado ('H', 'D', 'A') a partir de goles
-- ========================================

create or replace function public.outcome_of(h smallint, a smallint)
returns text language sql immutable as $$
  select case when h > a then 'H' when h < a then 'A' else 'D' end;
$$;

-- ========================================
-- 4. VISTA: leaderboard (tabla de posiciones)
-- Reglas de puntaje:
--   - Sin apuesta = se asume 0-0
--   - kind='winner': acierto de ganador = 1 pto
--   - kind='score' (o sin kind): exacto = 3 pts, ganador correcto = 1 pto
-- ========================================

create or replace view public.leaderboard as
with finished as (
  select match_id, home, away from public.match_results
),
scored as (
  select
    p.id as user_id,
    f.match_id,
    case
      when coalesce(b.kind, 'score') = 'winner' then
        case when b.pick = outcome_of(f.home, f.away) then 1 else 0 end
      when coalesce(b.home, 0) = f.home
       and coalesce(b.away, 0) = f.away then 3
      else 0
    end as points
  from public.profiles p
  cross join finished f
  left join public.bets b on b.user_id = p.id and b.match_id = f.match_id
)
select user_id, coalesce(sum(points), 0) as total_points, count(*) as match_count
from scored
group by user_id;

-- ========================================
-- 5. VISTA: match_bets (apuestas por partido con puntaje)
-- Muestra quien aposto que en cada partido, con puntos si ya termino
-- ========================================

create or replace view public.match_bets as
select
  b.match_id,
  b.user_id,
  p.username,
  b.home   as bet_home,
  b.away   as bet_away,
  b.kind   as bet_kind,
  b.pick   as bet_pick,
  mr.home  as result_home,
  mr.away  as result_away,
  case
    when mr.home is null then null
    when coalesce(b.kind, 'score') = 'winner' then
      case when b.pick = outcome_of(mr.home, mr.away) then 1 else 0 end
    when b.home = mr.home and b.away = mr.away then 3
    else 0
  end as points
from public.bets b
join public.profiles p on p.id = b.user_id
left join public.match_results mr on mr.match_id = b.match_id;

-- ========================================
-- 6. TRIGGER: sincronizar resultados hacia la tabla matches
-- Cuando se inserta/actualiza un resultado en match_results,
-- se copian los goles y se marca el partido como 'finished'
-- ========================================

create or replace function public.sync_result_to_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.matches
  set home_score = NEW.home,
      away_score = NEW.away,
      status     = 'finished',
      updated_at = now()
  where id = NEW.match_id;
  return NEW;
end; $$;

drop trigger if exists result_to_match on public.match_results;
create trigger result_to_match
  after insert or update on public.match_results
  for each row execute function public.sync_result_to_match();

-- ========================================
-- 7. ANTI-FRAUDE: candado de 5 minutos antes del kickoff
-- Si el partido no esta sincronizado, la apuesta pasa (permisivo).
-- Una vez que el admin sincroniza, el candado se activa.
-- ========================================

create or replace function public.check_bet_deadline()
returns trigger language plpgsql security definer set search_path = public as $$
declare ko timestamptz;
begin
  select kickoff into ko from public.matches where id = new.match_id;
  if ko is null then
    return new;  -- sin hora sincronizada: permitir apostar
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

-- ========================================
-- 8. AUTO-PERFIL: crear perfil al registrarse (copia email desde Auth)
-- ========================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, pool_joined, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Jugador'),
    coalesce((new.raw_user_meta_data->>'pool_joined')::boolean, false),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rellenar email en perfiles existentes que no lo tengan
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and (p.email is null or p.email = '');

-- ========================================
-- 9. UPDATED_AT automatico en bets
-- ========================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists bets_touch on public.bets;
create trigger bets_touch before update on public.bets
  for each row execute function public.touch_updated_at();

-- ========================================
-- 10. ROW LEVEL SECURITY — politicas de acceso
-- ========================================

-- Profiles: todos leen, solo editas el tuyo
alter table public.profiles enable row level security;
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles upsert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- Bets: todos leen (para ver apuestas de partidos terminados),
-- solo insertas/actualizas/borras las tuyas
alter table public.bets enable row level security;
drop policy if exists "bets read"   on public.bets;
drop policy if exists "bets insert" on public.bets;
drop policy if exists "bets update" on public.bets;
drop policy if exists "bets delete" on public.bets;
create policy "bets read"   on public.bets for select using (true);
create policy "bets insert" on public.bets for insert with check (auth.uid() = user_id);
create policy "bets update" on public.bets for update using (auth.uid() = user_id);
create policy "bets delete" on public.bets for delete using (auth.uid() = user_id);

-- Match results: todos leen, solo el admin escribe (por correo)
alter table public.match_results enable row level security;
drop policy if exists "results read"  on public.match_results;
drop policy if exists "results admin" on public.match_results;
create policy "results read"  on public.match_results for select using (true);
create policy "results admin" on public.match_results for all
  using      ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com');

-- Matches: todos leen, solo el admin escribe (por correo)
alter table public.matches enable row level security;
drop policy if exists "matches read"  on public.matches;
drop policy if exists "matches admin" on public.matches;
create policy "matches read"  on public.matches for select using (true);
create policy "matches admin" on public.matches for all
  using      ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com');

-- ========================================
-- 11. REALTIME — publicacion para actualizaciones en vivo
-- ========================================

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

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

-- ========================================
-- 12. VERIFICACION FINAL
-- ========================================

select
  (select count(*) from public.profiles)                            as usuarios,
  (select count(*) from public.bets)                                as apuestas_guardadas,
  (select count(*) from public.match_results)                       as resultados,
  (select count(*) from public.matches)                             as partidos_sincronizados,
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'matches')       as columnas_matches,
  exists (select 1 from information_schema.columns
    where table_name = 'matches' and column_name = 'home_team')     as home_team_ok,
  exists (select 1 from information_schema.columns
    where table_name = 'matches' and column_name = 'status')        as status_ok,
  exists (select 1 from information_schema.columns
    where table_name = 'bets' and column_name = 'kind')             as kind_ok,
  exists (select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'email')        as email_ok,
  exists (select 1 from pg_views
    where viewname = 'leaderboard')                                 as leaderboard_ok,
  exists (select 1 from pg_views
    where viewname = 'match_bets')                                  as match_bets_ok,
  exists (select 1 from pg_trigger
    where tgname = 'result_to_match')                               as sync_trigger_ok;
