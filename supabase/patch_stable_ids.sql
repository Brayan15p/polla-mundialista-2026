-- =============================================================================
-- patch_stable_ids.sql
--
-- This patch checks for and assists in fixing bets that were stored with
-- unstable "api-<N>" match IDs (written before the stable ID fix was in place).
--
-- The `matches` table uses stable IDs like "A1", "B2", etc. derived from group
-- and fixture position. The football-data.org API uses numeric IDs that are not
-- stored in the matches table, so an automated remap is not possible without
-- re-fetching the API. For a small friends pool this situation is unlikely if
-- the fix was deployed before significant betting occurred.
-- =============================================================================

-- Step 1: Check whether any bets were placed with api-* match IDs.
-- If this query returns no rows, no action is needed and you are done.

-- Check if any bets have api-* match IDs (placed before the stable ID fix)
SELECT DISTINCT match_id FROM public.bets WHERE match_id LIKE 'api-%';

-- =============================================================================
-- Step 2: If rows were returned above, those bets need to be remapped.
--
-- Because the numeric api-<N> IDs are not stored in the matches table, a fully
-- automatic migration is not possible here. The recommended approach is:
--
--   1. Fetch https://api.football-data.org/v4/competitions/WC/matches using
--      your VITE_FOOTBALL_API_KEY.
--   2. Build a mapping of api-<id> -> stable match ID by matching home/away
--      team names (using the NAME_MAP in api/sync-results.ts if needed).
--   3. Run UPDATE statements like the template below for each affected pair.
--
-- Template (replace <api-N> and <STABLE_ID> for each affected match):
--
--   UPDATE public.bets
--   SET match_id = '<STABLE_ID>'
--   WHERE match_id = 'api-<N>';
--
-- =============================================================================

-- Step 3 (optional diagnostic): Show all bets with api-* IDs alongside the
-- user who placed them so you can prioritise which ones to fix.
SELECT
  b.id          AS bet_id,
  b.user_id,
  b.match_id    AS unstable_match_id,
  b.created_at
FROM public.bets b
WHERE b.match_id LIKE 'api-%'
ORDER BY b.created_at;
