-- ============================================================================
-- FIX ALL — un solo script que deja la base de datos lista. Córrelo UNA vez
-- en Supabase → SQL Editor → Run. Es idempotente (seguro re-correrlo).
-- No borra nada: conserva usuarios y apuestas existentes.
-- ============================================================================

-- 1) Columnas de tipo de apuesta (marcador exacto vs. solo ganador).
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

-- 2) ANTI-FRAUDE PERMISIVO: si el partido no está sincronizado, la apuesta
--    PASA (ya no exige sincronizar). Cuando el admin sincronice, el candado
--    de 5 minutos se activa solo. (Si la tabla matches no existe, no pasa nada.)
create table if not exists public.matches (
  id      text primary key,
  kickoff timestamptz not null
);
create or replace function public.check_bet_deadline()
returns trigger language plpgsql security definer set search_path = public as $$
declare ko timestamptz;
begin
  select kickoff into ko from public.matches where id = new.match_id;
  if ko is null then
    return new;  -- sin hora sincronizada → permitir apostar
  end if;
  if now() >= ko - interval '5 minutes' then
    raise exception 'Apuestas cerradas: faltan menos de 5 minutos para el partido.';
  end if;
  return new;
end; $$;

-- 3) EMAIL EN PROFILES — para que el rol de super usuario funcione siempre,
--    aunque la sesión venga de otro dispositivo. Se copia desde Auth.
alter table public.profiles add column if not exists email text;
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and (p.email is null or p.email = '');

-- El trigger de auto-perfil ahora también copia el email al registrarse.
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

-- 4) PERMISOS DE ADMIN POR CORREO — las políticas originales usaban un uuid
--    de relleno (0000…), así que NADIE podía escribir resultados ni sincronizar
--    horarios. Ahora el super usuario se identifica por su correo de sesión.
drop policy if exists "results admin" on public.match_results;
create policy "results admin" on public.match_results for all
  using      ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com');

drop policy if exists "matches read"  on public.matches;
drop policy if exists "matches admin" on public.matches;
alter table public.matches enable row level security;
create policy "matches read"  on public.matches for select using (true);
create policy "matches admin" on public.matches for all
  using      ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'apedrazacespedes@gmail.com');

-- 5) Verificación final: muestra el estado para confirmar que todo quedó bien.
select
  (select count(*) from public.profiles)                         as usuarios,
  (select count(*) from public.bets)                             as apuestas_guardadas,
  (select count(*) from public.match_results)                    as resultados,
  (select count(*) from public.matches)                          as partidos_sincronizados,
  exists (select 1 from information_schema.columns
          where table_name = 'bets' and column_name = 'kind')    as columnas_ok,
  exists (select 1 from information_schema.columns
          where table_name = 'profiles' and column_name = 'email') as email_ok;
