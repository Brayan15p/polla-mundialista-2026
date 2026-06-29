-- fix_api_bets_optionB.sql  (versión SIN tabla temporal)
-- Restaura 2 apuestas del usuario 3cc29fb8 (opción B) y migra/borra duplicados.
-- El mapeo api->estable va incrustado con WITH en cada paso, así que cada
-- sentencia es independiente: funciona corrido todo de una o pedazo por pedazo.
-- Idempotente. Córrelo en Supabase -> SQL Editor -> Run.

-- Baja el trigger de cierre para que no bloquee partidos ya empezados.
DROP TRIGGER IF EXISTS bets_deadline ON public.bets;

-- === OPCIÓN B: restaurar las 2 apuestas a su marcador real ===
UPDATE public.bets SET home=2, away=1
 WHERE user_id='3cc29fb8-9083-4ec8-b375-6129cf4e6992' AND match_id='KO-32avos-10';  -- Belgium vs Senegal
UPDATE public.bets SET home=1, away=1
 WHERE user_id='3cc29fb8-9083-4ec8-b375-6129cf4e6992' AND match_id='KO-32avos-7';   -- Mexico vs Ecuador

-- Paso 0: normaliza nombres de equipos en filas api-*
UPDATE public.matches SET home_team = 'Bosnia and Herzegovina' WHERE home_team = 'Bosnia-Herzegovina';
UPDATE public.matches SET away_team = 'Bosnia and Herzegovina' WHERE away_team = 'Bosnia-Herzegovina';
UPDATE public.matches SET home_team = 'Korea Republic'         WHERE home_team = 'South Korea';
UPDATE public.matches SET away_team = 'Korea Republic'         WHERE away_team = 'South Korea';
UPDATE public.matches SET home_team = 'IR Iran'                WHERE home_team = 'Iran';
UPDATE public.matches SET away_team = 'IR Iran'                WHERE away_team = 'Iran';
UPDATE public.matches SET home_team = 'Congo DR'               WHERE home_team IN ('Congo','DR Congo');
UPDATE public.matches SET away_team = 'Congo DR'               WHERE away_team IN ('Congo','DR Congo');
UPDATE public.matches SET home_team = 'Cabo Verde'             WHERE home_team = 'Cape Verde';
UPDATE public.matches SET away_team = 'Cabo Verde'             WHERE away_team = 'Cape Verde';
UPDATE public.matches SET home_team = 'Türkiye'                WHERE home_team = 'Turkey';
UPDATE public.matches SET away_team = 'Türkiye'                WHERE away_team = 'Turkey';
UPDATE public.matches SET home_team = 'Curaçao'                WHERE home_team = 'Curacao';
UPDATE public.matches SET away_team = 'Curaçao'                WHERE away_team = 'Curacao';
UPDATE public.matches SET home_team = E'Côte d''Ivoire'        WHERE home_team = 'Ivory Coast';
UPDATE public.matches SET away_team = E'Côte d''Ivoire'        WHERE away_team = 'Ivory Coast';

-- Paso 2: en los choques, copia la apuesta MÁS RECIENTE al slot estable
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON  m_stable.home_team = m_api.home_team
    AND m_stable.away_team = m_api.away_team
    AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
UPDATE public.bets sb
SET home=ab.home, away=ab.away, kind=ab.kind, pick=ab.pick, updated_at=ab.updated_at
FROM id_map im
JOIN public.bets ab ON ab.match_id = im.api_id
WHERE sb.user_id = ab.user_id AND sb.match_id = im.stable_id AND ab.updated_at > sb.updated_at;

-- Paso 3: borra las apuestas api-* donde ya existe una estable (DUPLICADOS)
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON  m_stable.home_team = m_api.home_team
    AND m_stable.away_team = m_api.away_team
    AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
DELETE FROM public.bets ab
USING id_map im, public.bets sb
WHERE ab.match_id = im.api_id AND sb.user_id = ab.user_id AND sb.match_id = im.stable_id;

-- Paso 4: migra las apuestas api-* restantes -> id estable
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON  m_stable.home_team = m_api.home_team
    AND m_stable.away_team = m_api.away_team
    AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
UPDATE public.bets b
SET match_id = im.stable_id
FROM id_map im
WHERE b.match_id = im.api_id;

-- Paso 5: borra las filas api-* de matches
DELETE FROM public.matches WHERE id LIKE 'api-%';

-- Recrea el trigger de cierre, igual que antes
CREATE TRIGGER bets_deadline
  BEFORE INSERT OR UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.check_bet_deadline();

-- Verificación — api-bets / api-matches deben dar 0
SELECT 'api-bets remaining'    AS check, COUNT(*) AS n FROM public.bets    WHERE match_id LIKE 'api-%'
UNION ALL
SELECT 'api-matches remaining' AS check, COUNT(*) AS n FROM public.matches WHERE id        LIKE 'api-%'
UNION ALL
SELECT 'total bets'            AS check, COUNT(*) AS n FROM public.bets
UNION ALL
SELECT 'total matches'         AS check, COUNT(*) AS n FROM public.matches;
