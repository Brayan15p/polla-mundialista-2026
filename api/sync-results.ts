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

  // Build a lookup: "HomeTeam|AwayTeam" -> stable match id
  const matchLookup = new Map<string, string>();
  for (const row of dbMatches ?? []) {
    const key = `${row.home_team}|${row.away_team}`;
    matchLookup.set(key, row.id);
  }

  let updated = 0;

  for (const match of finishedMatches) {
    const homeRaw: string = match.homeTeam?.name ?? '';
    const awayRaw: string = match.awayTeam?.name ?? '';
    const homeNorm = normalizeName(homeRaw);
    const awayNorm = normalizeName(awayRaw);

    const key = `${homeNorm}|${awayNorm}`;
    const stableId = matchLookup.get(key);

    if (!stableId) {
      errors.push(`No stable ID found for match: "${homeNorm}" vs "${awayNorm}" (raw: "${homeRaw}" vs "${awayRaw}")`);
      continue;
    }

    const homeScore: number | null = match.score?.fullTime?.home ?? null;
    const awayScore: number | null = match.score?.fullTime?.away ?? null;

    const { error: upsertError } = await supabase
      .from('match_results')
      .upsert(
        {
          match_id: stableId,
          home_score: homeScore,
          away_score: awayScore,
          status: match.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' }
      );

    if (upsertError) {
      errors.push(`Upsert failed for match ${stableId}: ${upsertError.message}`);
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
