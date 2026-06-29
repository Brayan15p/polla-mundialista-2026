-- diagnose_choques.sql
-- SOLO LECTURA. Muestra los "choques": un mismo usuario con apuesta en un
-- match_id viejo (api-*) Y en su slot estable equivalente (KO-32avos-N, etc.).
-- Sirve para decidir cuál apuesta se queda ANTES de correr fix_api_bets.sql.
-- No modifica nada. Córrelo en Supabase → SQL Editor → Run y pásame el resultado.

with id_map as (
  select m_api.id as api_id, m_stable.id as stable_id,
         m_api.home_team, m_api.away_team
  from public.matches m_api
  join public.matches m_stable
    on  m_stable.home_team = m_api.home_team
    and m_stable.away_team = m_api.away_team
    and m_stable.id not like 'api-%'
  where m_api.id like 'api-%'
)
select
  im.home_team || ' vs ' || im.away_team               as partido,
  ab.user_id,
  im.api_id,
  ab.kind  as api_kind,  ab.home as api_h, ab.away as api_a, ab.pick as api_pick,
  ab.updated_at                                        as api_actualizada,
  im.stable_id,
  sb.kind  as est_kind,  sb.home as est_h, sb.away as est_a, sb.pick as est_pick,
  sb.updated_at                                        as est_actualizada,
  case when ab.updated_at > sb.updated_at
       then 'fix dejaría la de API (más nueva)'
       else 'fix dejaría la ESTABLE (más nueva)'
  end                                                  as que_haria_el_fix
from id_map im
join public.bets ab on ab.match_id = im.api_id
join public.bets sb on sb.match_id = im.stable_id and sb.user_id = ab.user_id
order by im.stable_id, ab.user_id;
