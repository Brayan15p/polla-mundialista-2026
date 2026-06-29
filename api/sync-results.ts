import { createClient } from '@supabase/supabase-js';

const NAME_MAP: Record<string, string> = {
  'South Korea': 'Korea Republic',
  'Iran': 'IR Iran',
  "Ivory Coast": "Côte d'Ivoire",
  'Congo': 'Congo DR',
  'DR Congo': 'Congo DR',
  'Cape Verde': 'Cabo Verde',
  'Turkey': 'Türkiye',
  'Curacao': 'Curaçao',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
};

function normalizeName(name: string): string {
  return NAME_MAP[name] ?? name;
}

// Order-independent team-pair key, so a match is found even when the API lists
// home/away the other way around than our fixture (common in knockout games).
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export default async function handler(req: any, res: any) {
  const footballApiKey = process.env.VITE_FOOTBALL_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!footballApiKey || !supabaseUrl || !supabaseServiceKey) {
    const missing = [
      !footballApiKey && 'VITE_FOOTBALL_API_KEY',
      !supabaseUrl && 'VITE_SUPABASE_URL',
      !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean);
    return res.status(500).json({
      error: 'Missing required environment variables',
      missing,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const errors: string[] = [];

  // Fetch finished matches from football-data.org
  let apiMatches: any[] = [];
  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      {
        headers: { 'X-Auth-Token': footballApiKey },
      }
    );
    if (!response.ok) {
      throw new Error(`football-data.org responded with status ${response.status}`);
    }
    const data = await response.json();
    apiMatches = data.matches ?? [];
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to fetch matches from football-data.org',
      detail: err?.message,
    });
  }

  const finishedMatches = apiMatches.filter(
    (m: any) => m.status === 'FINISHED' || m.status === 'AWARDED'
  );

  // Load matches table from Supabase to build a stable ID lookup
  const { data: dbMatches, error: dbError } = await supabase
    .from('matches')
    .select('id, home_team, away_team');

  if (dbError) {
    return res.status(500).json({
      error: 'Failed to load matches from Supabase',
      detail: dbError.message,
    });
  }

  // Build an order-independent lookup → { id, home, away } so we can both find
  // the match (whatever order the API uses) and re-orient the score to our
  // canonical home/away.
  const matchLookup = new Map<string, { id: string; home: string; away: string }>();
  for (const row of dbMatches ?? []) {
    // Skip loose duplicates: only ever record a result onto a STABLE slot id.
    // Otherwise a duplicate "api-*" row could win the lookup and the result would
    // land on an id nobody bet on.
    if (typeof row.id === 'string' && row.id.startsWith('api-')) continue;
    matchLookup.set(pairKey(row.home_team, row.away_team), {
      id: row.id, home: row.home_team, away: row.away_team,
    });
  }

  let updated = 0;

  for (const match of finishedMatches) {
    const homeRaw: string = match.homeTeam?.name ?? '';
    const awayRaw: string = match.awayTeam?.name ?? '';
    const homeNorm = normalizeName(homeRaw);
    const awayNorm = normalizeName(awayRaw);

    const slot = matchLookup.get(pairKey(homeNorm, awayNorm));

    if (!slot) {
      errors.push(`No stable ID found for match: "${homeNorm}" vs "${awayNorm}" (raw: "${homeRaw}" vs "${awayRaw}")`);
      continue;
    }

    const apiHome: number | null = match.score?.fullTime?.home ?? null;
    const apiAway: number | null = match.score?.fullTime?.away ?? null;
    const apiHomePens: number | null = match.score?.penalties?.home ?? null;
    const apiAwayPens: number | null = match.score?.penalties?.away ?? null;
    // If the API lists our away team as its home, swap the score so it matches
    // our fixture's orientation (otherwise a reversed knockout tie would record
    // the result backwards).
    const reversed = slot.home !== homeNorm;
    const homeScore = reversed ? apiAway : apiHome;
    const awayScore = reversed ? apiHome : apiAway;
    const homePens = reversed ? apiAwayPens : apiHomePens;
    const awayPens = reversed ? apiHomePens : apiAwayPens;

    // The match_results table is keyed by match_id and uses home/away (+ pens) —
    // the SAME columns the app reads. (It previously wrote home_score/away_score/
    // status, columns that don't exist, so this endpoint never persisted anything.)
    const { error: upsertError } = await supabase
      .from('match_results')
      .upsert(
        {
          match_id: slot.id,
          home: homeScore,
          away: awayScore,
          home_pens: homePens,
          away_pens: awayPens,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' }
      );

    if (upsertError) {
      errors.push(`Upsert failed for match ${slot.id}: ${upsertError.message}`);
    } else {
      updated++;
    }
  }

  return res.status(200).json({
    updated,
    total_finished: finishedMatches.length,
    ...(errors.length > 0 && { errors }),
    timestamp: new Date().toISOString(),
  });
}
