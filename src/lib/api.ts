// api.ts — Real football data with graceful fallback to bundled mock data.
//
// Set VITE_FOOTBALL_API_KEY in app/.env to enable live data from football-data.org.
// The free tier of football-data.org does not send CORS headers for browser
// requests, so a same-origin proxy is expected at /football (see README). When
// no key/proxy is configured — or any request fails — we fall back to the
// bundled MATCHES so the app always works offline.

import { MATCHES, FLAGS, TBD, type Match, type MatchStatus } from './data';

// Map API team names → names used in our fixture/FLAGS table
const NAME_MAP: Record<string, string> = {
  'South Korea': 'Korea Republic',
  'Korea Republic': 'Korea Republic',
  'Iran': 'IR Iran',
  "Ivory Coast": "Côte d'Ivoire",
  "Côte d'Ivoire": "Côte d'Ivoire",
  'Congo': 'Congo DR',
  'DR Congo': 'Congo DR',
  'Cape Verde': 'Cabo Verde',
  'Cape Verde Islands': 'Cabo Verde',
  'Turkey': 'Türkiye',
  'Curacao': 'Curaçao',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'United States': 'USA',
};

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
// Same-origin proxy path → forward to https://api.football-data.org/v4
const API_BASE = '/football/v4';
// World Cup competition code on football-data.org
const COMPETITION = 'WC';

interface RawTeam { name?: string; shortName?: string; tla?: string }
export interface RawMatch {
  id: number;
  stage?: string;
  group?: string | null;
  utcDate: string;
  status: string;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score?: {
    fullTime?: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
  minute?: number;
}

// Map football-data.org status → our MatchStatus
export function mapStatus(s: string): MatchStatus {
  if (s === 'IN_PLAY' || s === 'PAUSED') return 'live';
  if (s === 'FINISHED' || s === 'AWARDED') return 'finished';
  return 'upcoming';
}

// Normalize team names so they match our FLAGS / GROUPS keys.
function teamName(t: RawTeam): string {
  const raw = t.name || t.shortName || t.tla || '';
  return NAME_MAP[raw] ?? (Object.prototype.hasOwnProperty.call(FLAGS, raw) ? raw : raw);
}

export function mapMatch(m: RawMatch, idx: number): Match {
  const ft = m.score?.fullTime;
  const pk = m.score?.penalties;
  const group = (m.group || '').replace(/^GROUP_/i, '').trim() || '?';
  const home = teamName(m.homeTeam);
  const away = teamName(m.awayTeam);
  // IMPORTANT: keep the full UTC timestamp (with its trailing `Z`). The kickoff
  // is shown in Colombia time downstream via fmtTime → America/Bogota. Stripping
  // the zone here used to make toInstant treat the UTC hour AS Colombia time,
  // shifting every API kickoff 5 hours. Preserve the zone and let the formatter
  // convert it correctly.
  const date = m.utcDate || `2026-06-12T${String(12 + (idx % 8)).padStart(2, '0')}:00-05:00`;
  // Use the fixture match for stable ID, venue, group and stage — API returns
  // numeric ids ('api-123') that change across requests and would orphan saved bets.
  const fixtureMatch = MATCHES.find(f => f.home === home && f.away === away);
  return {
    id: fixtureMatch?.id ?? ('api-' + m.id),
    group: fixtureMatch?.group ?? group,
    stage: fixtureMatch?.stage,
    home,
    away,
    date,
    venue: fixtureMatch?.venue || 'TBD',
    status: mapStatus(m.status),
    homeScore: ft?.home ?? undefined,
    awayScore: ft?.away ?? undefined,
    // Knockout ties level after 90'/extra time are decided on penalties; keep
    // them so the bracket can advance the right side.
    homePens: pk?.home ?? undefined,
    awayPens: pk?.away ?? undefined,
    minute: m.minute,
  };
}

// Overlay live API data onto the bundled 104-match fixture. The curated fixture
// (stable ids, venues, groups and the knockout SLOTS the bracket engine fills)
// is always the backbone, so live mode never loses the knockout structure. Group
// games are matched to their fixture slot by stable id; finished/live knockout
// games — whose fixture slots are still "Por definir" — are appended as loose
// entries for resolveKnockout to attach to the right slot by team pair.
export function mergeLiveOntoFixture(raw: RawMatch[]): Match[] {
  const live = raw.map(mapMatch);
  const liveById = new Map(live.map(lm => [lm.id, lm]));
  const merged = MATCHES.map(f => {
    const lm = liveById.get(f.id); // only group games map to a fixture id
    if (!lm) return f;
    return {
      ...f,
      date: lm.date,
      status: lm.status,
      homeScore: lm.homeScore,
      awayScore: lm.awayScore,
      homePens: lm.homePens,
      awayPens: lm.awayPens,
      minute: lm.minute,
    };
  });
  const fixtureIds = new Set(MATCHES.map(m => m.id));
  const loose = live.filter(lm =>
    !fixtureIds.has(lm.id) &&
    lm.home !== TBD && lm.away !== TBD && !!lm.home && !!lm.away &&
    // finished/live from any stage, plus UPCOMING knockout ties (group === '?')
    // so resolveKnockout can show the real matchups before they're played.
    (lm.status === 'finished' || lm.status === 'live' ||
     (lm.status === 'upcoming' && lm.group === '?')),
  );
  return [...merged, ...loose];
}

export interface MatchesResult {
  matches: Match[];
  source: 'live' | 'mock';
  error?: string;
}

export async function fetchMatches(signal?: AbortSignal): Promise<MatchesResult> {
  if (!API_KEY) {
    return { matches: MATCHES, source: 'mock' };
  }
  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches`, {
      headers: { 'X-Auth-Token': API_KEY },
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { matches?: RawMatch[] };
    const raw = data.matches || [];
    if (raw.length === 0) throw new Error('empty response');
    // Overlay live data onto the full fixture so the knockout slots the bracket
    // engine relies on are always present (and auto-track as results come in).
    return { matches: mergeLiveOntoFixture(raw), source: 'live' };
  } catch (err) {
    return {
      matches: MATCHES,
      source: 'mock',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
