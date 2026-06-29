-- relink_api_bets_safe.sql
-- Limpia los duplicados 'api-*' de la tabla `matches` (los que en la web salen
-- como "GRUPO ?" repitiendo un cruce de eliminatorias) SIN que ningun jugador
-- pierda su apuesta. Regla dura: una apuesta NUNCA se borra; se RE-VINCULA al
-- slot estable antes de tocar nada.
--
-- Diferencias vs fix_api_bets_optionB.sql:
--   * El emparejado api->estable es ORDER-INDEPENDENT (LEAST/GREATEST), asi
--     tambien casa cuando el API mando el cruce invertido (ej. Brazil-Japan).
--   * El borrado de filas api-* es CONDICIONAL: solo borra un api-* que ya NO
--     tenga ninguna apuesta apuntando a el -> imposible orfanar una apuesta.
--
-- Idempotente. Supabase -> SQL Editor -> Run (todo de una).

-- =====================================================================
-- DIAGNOSTICO (lectura) — corre esto primero si quieres ver el panorama
-- =====================================================================
-- SELECT m.id, m.home_team, m.away_team,
--        (SELECT count(*) FROM public.bets b WHERE b.match_id = m.id) AS apuestas
-- FROM public.matches m
-- WHERE m.id LIKE 'api-%'
-- ORDER BY apuestas DESC, m.id;

-- =====================================================================
-- LIMPIEZA SEGURA
-- =====================================================================

-- 0) Baja el trigger de cierre para que re-vincular no choque con el deadline.
DROP TRIGGER IF EXISTS bets_deadline ON public.bets;

-- 0b) Normaliza nombres en filas api-* (el API usa otras grafias que el fixture).
UPDATE public.matches SET home_team='Bosnia and Herzegovina' WHERE home_team='Bosnia-Herzegovina';
UPDATE public.matches SET away_team='Bosnia and Herzegovina' WHERE away_team='Bosnia-Herzegovina';
UPDATE public.matches SET home_team='Korea Republic'         WHERE home_team='South Korea';
UPDATE public.matches SET away_team='Korea Republic'         WHERE away_team='South Korea';
UPDATE public.matches SET home_team='IR Iran'                WHERE home_team='Iran';
UPDATE public.matches SET away_team='IR Iran'                WHERE away_team='Iran';
UPDATE public.matches SET home_team='Congo DR'               WHERE home_team IN ('Congo','DR Congo');
UPDATE public.matches SET away_team='Congo DR'               WHERE away_team IN ('Congo','DR Congo');
UPDATE public.matches SET home_team='Cabo Verde'             WHERE home_team IN ('Cape Verde','Cape Verde Islands');
UPDATE public.matches SET away_team='Cabo Verde'             WHERE away_team IN ('Cape Verde','Cape Verde Islands');
UPDATE public.matches SET home_team='Türkiye'                WHERE home_team='Turkey';
UPDATE public.matches SET away_team='Türkiye'                WHERE away_team='Turkey';
UPDATE public.matches SET home_team='Curaçao'                WHERE home_team='Curacao';
UPDATE public.matches SET away_team='Curaçao'                WHERE away_team='Curacao';
UPDATE public.matches SET home_team=E'Côte d''Ivoire'        WHERE home_team='Ivory Coast';
UPDATE public.matches SET away_team=E'Côte d''Ivoire'        WHERE away_team='Ivory Coast';

-- Mapa api-id -> slot estable, emparejado por par de equipos SIN orientacion.
-- (Se repite en cada paso para que cada sentencia sea independiente.)

-- 1) Choque (mismo user con apuesta en api-* Y en el slot estable): conserva la
--    MAS RECIENTE copiandola al slot estable.
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON LEAST(m_stable.home_team, m_stable.away_team)    = LEAST(m_api.home_team, m_api.away_team)
   AND GREATEST(m_stable.home_team, m_stable.away_team) = GREATEST(m_api.home_team, m_api.away_team)
   AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
UPDATE public.bets sb
SET home=ab.home, away=ab.away, kind=ab.kind, pick=ab.pick, updated_at=ab.updated_at
FROM id_map im
JOIN public.bets ab ON ab.match_id = im.api_id
WHERE sb.user_id = ab.user_id AND sb.match_id = im.stable_id AND ab.updated_at > sb.updated_at;

-- 2) Borra la apuesta api-* duplicada donde ya hay una estable del mismo user.
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON LEAST(m_stable.home_team, m_stable.away_team)    = LEAST(m_api.home_team, m_api.away_team)
   AND GREATEST(m_stable.home_team, m_stable.away_team) = GREATEST(m_api.home_team, m_api.away_team)
   AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
DELETE FROM public.bets ab
USING id_map im, public.bets sb
WHERE ab.match_id = im.api_id AND sb.user_id = ab.user_id AND sb.match_id = im.stable_id;

-- 3) Migra las apuestas api-* restantes (sin choque) -> id estable.
--    Aqui es donde se salva tu "1/14 apostando": pasa al slot real.
WITH id_map AS (
  SELECT m_api.id AS api_id, m_stable.id AS stable_id
  FROM public.matches m_api
  JOIN public.matches m_stable
    ON LEAST(m_stable.home_team, m_stable.away_team)    = LEAST(m_api.home_team, m_api.away_team)
   AND GREATEST(m_stable.home_team, m_stable.away_team) = GREATEST(m_api.home_team, m_api.away_team)
   AND m_stable.id NOT LIKE 'api-%'
  WHERE m_api.id LIKE 'api-%'
)
UPDATE public.bets b
SET match_id = im.stable_id
FROM id_map im
WHERE b.match_id = im.api_id;

-- 4) Borra SOLO las filas api-* que ya NO tengan ninguna apuesta apuntando.
--    Si alguna quedo sin mapear (nombre raro), se conserva -> nadie pierde nada,
--    y el paso 6 te la lista para arreglarla a mano.
DELETE FROM public.matches
WHERE id LIKE 'api-%'
  AND id NOT IN (SELECT match_id FROM public.bets);

-- 5) Recrea el trigger de cierre.
CREATE TRIGGER bets_deadline
  BEFORE INSERT OR UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.check_bet_deadline();

-- 6) VERIFICACION.
--    api-bets remaining = 0  -> todas las apuestas re-vinculadas.
--    api-matches remaining   -> filas api-* que NO se pudieron borrar (si >0,
--                               quedan listadas abajo: arreglar a mano).
SELECT 'api-bets remaining'    AS check, COUNT(*) AS n FROM public.bets    WHERE match_id LIKE 'api-%'
UNION ALL
SELECT 'api-matches remaining' AS check, COUNT(*) AS n FROM public.matches WHERE id        LIKE 'api-%'
UNION ALL
SELECT 'total bets'            AS check, COUNT(*) AS n FROM public.bets
UNION ALL
SELECT 'total matches'         AS check, COUNT(*) AS n FROM public.matches;

-- Si api-matches remaining > 0, esto te dice cuales y con cuantas apuestas:
SELECT m.id, m.home_team, m.away_team,
       (SELECT count(*) FROM public.bets b WHERE b.match_id = m.id) AS apuestas_sin_mapear
FROM public.matches m
WHERE m.id LIKE 'api-%'
ORDER BY apuestas_sin_mapear DESC, m.id;
