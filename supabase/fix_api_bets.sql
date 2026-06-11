-- fix_api_bets.sql
-- Migrates bets from api-* match IDs to stable IDs (A1, B2, KO-R16-1, etc.)
-- and removes duplicate api-* rows from the matches table.

-- Drop the deadline trigger so it doesn't block migration of already-started matches.
-- It is recreated at the end, identical to before.
DROP TRIGGER IF EXISTS bets_deadline ON public.bets;

-- Step 0: Normalize team names in api-* match rows
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

-- Step 1: Build mapping: api-* id → stable id
DROP TABLE IF EXISTS _id_map;
CREATE TEMP TABLE _id_map AS
SELECT
  m_api.id    AS api_id,
  m_stable.id AS stable_id
FROM public.matches m_api
JOIN public.matches m_stable
  ON  m_stable.home_team = m_api.home_team
  AND m_stable.away_team = m_api.away_team
  AND m_stable.id NOT LIKE 'api-%'
WHERE m_api.id LIKE 'api-%';

-- Step 2: For users with BOTH bets: copy values from the more recent one to the stable row
UPDATE public.bets sb
SET
  home       = ab.home,
  away       = ab.away,
  kind       = ab.kind,
  pick       = ab.pick,
  updated_at = ab.updated_at
FROM _id_map im
JOIN public.bets ab ON ab.match_id = im.api_id
WHERE sb.user_id   = ab.user_id
  AND sb.match_id  = im.stable_id
  AND ab.updated_at > sb.updated_at;

-- Step 3: Delete api-* bets where a stable bet already exists
DELETE FROM public.bets ab
USING _id_map im,
      public.bets sb
WHERE ab.match_id  = im.api_id
  AND sb.user_id   = ab.user_id
  AND sb.match_id  = im.stable_id;

-- Step 4: Migrate remaining api-* bets → stable ID
UPDATE public.bets b
SET match_id = im.stable_id
FROM _id_map im
WHERE b.match_id = im.api_id;

-- Step 5: Delete api-* rows from matches
DELETE FROM public.matches WHERE id LIKE 'api-%';

-- Recreate the deadline trigger exactly as before
CREATE TRIGGER bets_deadline
  BEFORE INSERT OR UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.check_bet_deadline();

-- Verification — must show 0, 0
SELECT 'api-bets remaining'    AS check, COUNT(*) AS n FROM public.bets    WHERE match_id LIKE 'api-%'
UNION ALL
SELECT 'api-matches remaining' AS check, COUNT(*) AS n FROM public.matches WHERE id        LIKE 'api-%'
UNION ALL
SELECT 'total bets'            AS check, COUNT(*) AS n FROM public.bets
UNION ALL
SELECT 'total matches'         AS check, COUNT(*) AS n FROM public.matches;
