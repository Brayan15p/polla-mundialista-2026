// data.ts — FIFA World Cup 2026 data module (ported from wc-data.js)

export type Tier = 'legend' | 'gold' | 'silver' | 'bronze';
export type MatchStatus = 'upcoming' | 'live' | 'finished';
export type Outcome = 'H' | 'D' | 'A';      // local gana / empate / visitante gana
export type BetKind = 'score' | 'winner';   // marcador exacto · solo ganador

// Placeholder team name for knockout matches whose rivals aren't known yet.
export const TBD = 'Por definir';

export interface Player {
  id: string;
  name: string;
  fullName: string;
  country: string;
  number: string;
  kitA: string;
  kitB: string;
  role: string;
  tier: Tier;
  silhouette: string;
}

export interface Match {
  id: string;
  group: string;        // 'A'..'L' for group stage, '' for knockout
  stage?: string;       // knockout round label (e.g. '32avos', 'Octavos', 'Final')
  home: string;
  away: string;
  date: string;
  venue: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
}

// Are both teams of a match known yet? (knockout matches start as TBD)
export function teamsKnown(m: Match): boolean {
  return m.home !== TBD && m.away !== TBD && !!m.home && !!m.away;
}

export interface Group {
  color: string;
  teams: string[];
}

export const FLAGS: Record<string, string> = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'Korea Republic': '🇰🇷', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭',
  'Brazil': '🇧🇷', 'Morocco': '🇲🇦', 'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'USA': '🇺🇸', 'Paraguay': '🇵🇾', 'Australia': '🇦🇺', 'Türkiye': '🇹🇷',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', "Côte d'Ivoire": '🇨🇮', 'Ecuador': '🇪🇨',
  'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'IR Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'Spain': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Ghana': '🇬🇭', 'Panama': '🇵🇦',
};

export const GROUPS: Record<string, Group> = {
  A: { color: '#22C55E', teams: ['Mexico', 'South Africa', 'Korea Republic', 'Czechia'] },
  B: { color: '#EF4444', teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'] },
  C: { color: '#F97316', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  D: { color: '#3B82F6', teams: ['USA', 'Paraguay', 'Australia', 'Türkiye'] },
  E: { color: '#8B5CF6', teams: ['Germany', "Côte d'Ivoire", 'Curaçao', 'Ecuador'] },
  F: { color: '#EAB308', teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'] },
  G: { color: '#EC4899', teams: ['Belgium', 'Egypt', 'IR Iran', 'New Zealand'] },
  H: { color: '#06B6D4', teams: ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'] },
  I: { color: '#84CC16', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
  J: { color: '#14B8A6', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
  K: { color: '#F59E0B', teams: ['Portugal', 'Congo DR', 'Uzbekistan', 'Colombia'] },
  L: { color: '#818CF8', teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
};

// SVG silhouette poses (variants used by role)
const SILHOUETTE_FORWARD = `
  <circle cx="30" cy="11" r="9.5"/>
  <path d="M17 23 Q30 18 43 23 L46 52 Q30 48 14 52 Z"/>
  <path d="M14 50 L9 76 L17 78 L21 53"/>
  <path d="M46 50 L51 76 L43 78 L39 53"/>
  <path d="M17 27 L2 14 L0 19 L16 33"/>
  <path d="M43 27 L58 12 L60 17 L44 33"/>
`;
const SILHOUETTE_MID = `
  <circle cx="30" cy="11" r="9.5"/>
  <path d="M17 23 Q30 19 43 23 L45 50 Q30 46 15 50 Z"/>
  <path d="M15 48 L10 74 L18 76 L22 51"/>
  <path d="M45 48 L50 74 L42 76 L38 51"/>
  <path d="M17 28 L4 22 L2 27 L16 35"/>
  <path d="M43 28 L58 20 L60 25 L44 35"/>
`;
const SILHOUETTE_LEGEND = `
  <circle cx="30" cy="10" r="10"/>
  <path d="M16 22 Q30 17 44 22 L47 54 Q30 50 13 54 Z"/>
  <path d="M13 52 L8 80 L16 82 L20 54"/>
  <path d="M47 52 L52 80 L44 82 L40 54"/>
  <path d="M16 27 L0 18 L-2 23 L15 33"/>
  <path d="M44 27 L60 16 L62 21 L45 33"/>
  <circle cx="46" cy="72" r="8"/>
`;

export const PLAYERS: Player[] = [
  { id: 'messi', name: 'Messi', fullName: 'Lionel Messi', country: 'Argentina', number: '10', kitA: '#74ACDF', kitB: '#FFFFFF', role: 'Delantero', tier: 'gold', silhouette: SILHOUETTE_FORWARD },
  { id: 'ronaldo', name: 'CR7', fullName: 'Cristiano Ronaldo', country: 'Portugal', number: '7', kitA: '#006600', kitB: '#FF0000', role: 'Delantero', tier: 'gold', silhouette: SILHOUETTE_FORWARD },
  { id: 'mbappe', name: 'Mbappé', fullName: 'Kylian Mbappé', country: 'France', number: '10', kitA: '#002654', kitB: '#FFFFFF', role: 'Delantero', tier: 'gold', silhouette: SILHOUETTE_FORWARD },
  { id: 'james', name: 'James R.', fullName: 'James Rodríguez', country: 'Colombia', number: '10', kitA: '#FCD116', kitB: '#003087', role: 'Mediocampista', tier: 'gold', silhouette: SILHOUETTE_MID },
  { id: 'vini', name: 'Vini Jr', fullName: 'Vinicius Jr.', country: 'Brazil', number: '7', kitA: '#009C3B', kitB: '#FFD700', role: 'Delantero', tier: 'gold', silhouette: SILHOUETTE_FORWARD },
  { id: 'bellingham', name: 'Bellingham', fullName: 'Jude Bellingham', country: 'England', number: '10', kitA: '#003090', kitB: '#FFFFFF', role: 'Mediocampista', tier: 'silver', silhouette: SILHOUETTE_MID },
  { id: 'pedri', name: 'Pedri', fullName: 'Pedri González', country: 'Spain', number: '8', kitA: '#AA151B', kitB: '#F1BF00', role: 'Mediocampista', tier: 'silver', silhouette: SILHOUETTE_MID },
  { id: 'haaland', name: 'Haaland', fullName: 'Erling Haaland', country: 'Norway', number: '9', kitA: '#EF2B2D', kitB: '#FFFFFF', role: 'Delantero', tier: 'silver', silhouette: SILHOUETTE_FORWARD },
  { id: 'yamal', name: 'L. Yamal', fullName: 'Lamine Yamal', country: 'Spain', number: '19', kitA: '#AA151B', kitB: '#F1BF00', role: 'Delantero', tier: 'silver', silhouette: SILHOUETTE_FORWARD },
  { id: 'pulisic', name: 'Pulisic', fullName: 'Christian Pulisic', country: 'USA', number: '10', kitA: '#B22234', kitB: '#FFFFFF', role: 'Delantero', tier: 'silver', silhouette: SILHOUETTE_FORWARD },
  { id: 'rodrygo', name: 'Rodrygo', fullName: 'Rodrygo Goes', country: 'Brazil', number: '11', kitA: '#FFD700', kitB: '#009C3B', role: 'Delantero', tier: 'silver', silhouette: SILHOUETTE_FORWARD },
  { id: 'debruyne', name: 'De Bruyne', fullName: 'Kevin De Bruyne', country: 'Belgium', number: '8', kitA: '#EF3340', kitB: '#000000', role: 'Mediocampista', tier: 'silver', silhouette: SILHOUETTE_MID },
  { id: 'pele', name: 'Pelé', fullName: 'Pelé — O Rei', country: 'Brazil', number: '10', kitA: '#009C3B', kitB: '#FFD700', role: 'LEYENDA', tier: 'legend', silhouette: SILHOUETTE_LEGEND },
  { id: 'muller', name: 'T. Müller', fullName: 'Thomas Müller', country: 'Germany', number: '13', kitA: '#DDDDDD', kitB: '#000000', role: 'Mediocampista', tier: 'bronze', silhouette: SILHOUETTE_MID },
];

// Host stadiums for the 2026 World Cup (rotated across the fixture).
const HOST_VENUES = [
  'Estadio Azteca, Ciudad de México',
  'Estadio Akron, Guadalajara',
  'Estadio BBVA, Monterrey',
  'BC Place, Vancouver',
  'BMO Field, Toronto',
  'SoFi Stadium, Los Ángeles',
  "Levi's Stadium, San Francisco",
  'Lumen Field, Seattle',
  'Arrowhead Stadium, Kansas City',
  'AT&T Stadium, Dallas',
  'NRG Stadium, Houston',
  'Mercedes-Benz Stadium, Atlanta',
  'Hard Rock Stadium, Miami',
  'Gillette Stadium, Boston',
  'MetLife Stadium, Nueva York',
  'Lincoln Financial Field, Filadelfia',
];

// ── REAL group-stage fixture (official FIFA calendar, Colombia time) ──────
// Each group lists its 6 matches as [homeIdx, awayIdx, 'MM-DDTHH:MM', venue].
// IMPORTANT: position n in the array IS match id `${group}${n+1}`, and each
// id keeps the SAME pairing it always had — (0,1),(2,3),(0,2),(1,3),(0,3),(1,2)
// — so bets already stored against an id stay attached to the same matchup.
// Only date/time/venue and home/away orientation were corrected to FIFA's
// listing. All times are Colombia (UTC-5). When the live API is reachable its
// schedule replaces this fixture entirely.
const GROUP_FIXTURES: Record<string, [number, number, string, string][]> = {
  A: [
    [0, 1, '06-11T14:00', 'Estadio de la Ciudad de México'],
    [2, 3, '06-11T21:00', 'Estadio Guadalajara'],
    [0, 2, '06-18T22:00', 'Estadio Guadalajara'],
    [3, 1, '06-18T11:00', 'Estadio de Atlanta'],
    [3, 0, '06-24T20:00', 'Estadio de la Ciudad de México'],
    [1, 2, '06-24T20:00', 'Estadio Monterrey'],
  ],
  B: [
    [0, 1, '06-12T14:00', 'Estadio de Toronto'],
    [2, 3, '06-13T14:00', 'Estadio de la Bahía de San Francisco'],
    [0, 2, '06-18T21:00', 'BC Place Vancouver'],
    [3, 1, '06-18T18:00', 'Estadio de Los Ángeles'],
    [3, 0, '06-24T18:00', 'BC Place Vancouver'],
    [1, 2, '06-24T18:00', 'Estadio de Seattle'],
  ],
  C: [
    [0, 1, '06-13T17:00', 'Estadio de Nueva York/Nueva Jersey'],
    [2, 3, '06-13T20:00', 'Estadio de Boston'],
    [0, 2, '06-19T20:30', 'Estadio de Toronto'],
    [3, 1, '06-19T18:00', 'Estadio de Boston'],
    [3, 0, '06-24T23:00', 'Estadio de Miami'],
    [1, 2, '06-24T23:00', 'Estadio de Atlanta'],
  ],
  D: [
    [0, 1, '06-12T20:00', 'Estadio de Los Ángeles'],
    [2, 3, '06-13T23:00', 'BC Place Vancouver'],
    [0, 2, '06-19T14:00', 'Estadio de Seattle'],
    [3, 1, '06-19T21:00', 'Estadio de la Bahía de San Francisco'],
    [3, 0, '06-26T22:00', 'BC Place Vancouver'],
    [1, 2, '06-26T22:00', 'Estadio de Houston'],
  ],
  E: [
    [0, 1, '06-20T15:00', 'Estadio de Toronto'],
    [3, 2, '06-20T19:00', 'Estadio Kansas City'],
    [0, 2, '06-14T12:00', 'Estadio de Houston'],
    [1, 3, '06-14T18:00', 'Estadio de Filadelfia'],
    [3, 0, '06-25T15:00', 'Estadio de Nueva York/Nueva Jersey'],
    [2, 1, '06-25T15:00', 'Estadio de Boston'],
  ],
  F: [
    [0, 1, '06-14T15:00', 'Estadio de Dallas'],
    [2, 3, '06-14T21:00', 'Estadio Monterrey'],
    [0, 2, '06-20T12:00', 'Estadio de Houston'],
    [3, 1, '06-20T22:00', 'Estadio Monterrey'],
    [3, 0, '06-25T19:00', 'Estadio de Atlanta'],
    [1, 2, '06-25T19:00', 'Estadio de Dallas'],
  ],
  G: [
    [0, 1, '06-15T14:00', 'Estadio de Seattle'],
    [2, 3, '06-15T20:00', 'Estadio de Los Ángeles'],
    [0, 2, '06-21T18:00', 'Estadio de Los Ángeles'],
    [3, 1, '06-21T21:00', 'BC Place Vancouver'],
    [3, 0, '06-26T23:00', 'BC Place Vancouver'],
    [1, 2, '06-26T23:00', 'Estadio de Seattle'],
  ],
  H: [
    [0, 1, '06-15T11:00', 'Estadio de Atlanta'],
    [2, 3, '06-15T17:00', 'Estadio de Miami'],
    [0, 2, '06-21T12:00', 'Estadio de Atlanta'],
    [3, 1, '06-21T17:00', 'Estadio de Miami'],
    [3, 0, '06-26T20:00', 'Estadio Guadalajara'],
    [1, 2, '06-26T20:00', 'Estadio de Houston'],
  ],
  I: [
    [0, 1, '06-16T14:00', 'Estadio de Nueva York/Nueva Jersey'],
    [2, 3, '06-16T17:00', 'Estadio de Boston'],
    [0, 2, '06-22T17:00', 'Estadio de Filadelfia'],
    [3, 1, '06-22T20:00', 'Estadio de Nueva York/Nueva Jersey'],
    [3, 0, '06-26T15:00', 'Estadio de Boston'],
    [1, 2, '06-26T15:00', 'Estadio de Toronto'],
  ],
  J: [
    [0, 1, '06-16T20:00', 'Estadio Kansas City'],
    [2, 3, '06-16T23:00', 'Estadio de la Bahía de San Francisco'],
    [0, 2, '06-22T18:00', 'Estadio de Dallas'],
    [3, 1, '06-22T21:00', 'Estadio de la Bahía de San Francisco'],
    [3, 0, '06-27T22:00', 'Estadio de la Bahía de San Francisco'],
    [1, 2, '06-27T22:00', 'Estadio de Dallas'],
  ],
  K: [
    [0, 1, '06-17T12:00', 'Estadio de Houston'],
    [2, 3, '06-17T21:00', 'Estadio de la Ciudad de México'],
    [0, 2, '06-23T18:00', 'Estadio Guadalajara'],
    [3, 1, '06-23T21:00', 'Estadio de la Ciudad de México'],
    [3, 0, '06-27T19:30', 'Estadio de Miami'],
    [1, 2, '06-27T19:30', 'Estadio de Atlanta'],
  ],
  // Group L: the source listing had a copy-paste error here, so days follow its
  // notes (opens 17 jun with two Europeans; Croatia–Ghana closes on 27 jun) and
  // hours are estimates within the official windows.
  L: [
    [0, 1, '06-17T15:00', 'Estadio de Boston'],
    [2, 3, '06-17T18:00', 'Estadio de Filadelfia'],
    [0, 2, '06-23T13:00', 'Estadio de Houston'],
    [3, 1, '06-23T22:00', 'Estadio Guadalajara'],
    [0, 3, '06-27T17:00', 'Estadio de Seattle'],
    [1, 2, '06-27T17:00', 'BC Place Vancouver'],
  ],
};

// Build the complete group-stage fixture: 12 groups × 6 matches = 72 games.
// Every match ships as `upcoming` with NO score — real results come only from
// the live API (football-data.org) or the admin panel. We never fabricate
// scores for games that haven't been played.
function buildGroupStage(): Match[] {
  const out: Match[] = [];
  Object.entries(GROUPS).forEach(([gKey, g]) => {
    (GROUP_FIXTURES[gKey] || []).forEach(([h, a, dt, venue], i) => {
      out.push({
        id: `${gKey}${i + 1}`,
        group: gKey,
        home: g.teams[h],
        away: g.teams[a],
        date: `2026-${dt}`,
        venue,
        status: 'upcoming',
      });
    });
  });
  // Chronological so the "by date" listing reads naturally.
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// Knockout bracket: 16 + 8 + 4 + 2 + 1 (3rd place) + 1 (final) = 32 matches.
// Teams are "Por definir" until the group stage / previous round decides them;
// betting stays locked on a match until both rivals are known (teamsKnown).
const KNOCKOUT_SPEC: { stage: string; count: number; day: number; times: string[] }[] = [
  { stage: '32avos',  count: 16, day: 28, times: ['12:00', '15:00', '18:00'] }, // 28 jun – 3 jul
  { stage: 'Octavos', count: 8,  day: 4,  times: ['14:00', '18:00'] },          // 4 – 7 jul (month +1)
  { stage: 'Cuartos', count: 4,  day: 9,  times: ['15:00', '19:00'] },          // 9 – 11 jul
  { stage: 'Semifinal', count: 2, day: 14, times: ['18:00'] },                  // 14 – 15 jul
  { stage: 'Tercer puesto', count: 1, day: 18, times: ['15:00'] },              // 18 jul
  { stage: 'Final',   count: 1,  day: 19, times: ['15:00'] },                   // 19 jul
];

function buildKnockout(): Match[] {
  const out: Match[] = [];
  let venueIdx = 5;
  KNOCKOUT_SPEC.forEach(spec => {
    const isJune = spec.stage === '32avos';
    for (let i = 0; i < spec.count; i++) {
      const dayOffset = Math.floor(i / spec.times.length);
      const day = spec.day + dayOffset;
      const month = isJune && day <= 30 ? '06' : '07';
      const realDay = isJune && day > 30 ? day - 30 : day;
      const time = spec.times[i % spec.times.length];
      out.push({
        id: `KO-${spec.stage}-${i + 1}`,
        group: '',
        stage: spec.stage,
        home: TBD,
        away: TBD,
        date: `2026-${month}-${String(realDay).padStart(2, '0')}T${time}`,
        venue: HOST_VENUES[venueIdx++ % HOST_VENUES.length],
        status: 'upcoming',
      });
    }
  });
  return out;
}

// Full tournament: 72 group-stage + 32 knockout = 104 matches.
export const MATCHES: Match[] = [...buildGroupStage(), ...buildKnockout()];

export const TEAM_STRENGTH: Record<string, number> = {
  'France': 90, 'Brazil': 89, 'Argentina': 88, 'England': 88,
  'Spain': 87, 'Germany': 85, 'Portugal': 84, 'Netherlands': 83,
  'Belgium': 80, 'Norway': 74, 'USA': 75, 'Canada': 72, 'Mexico': 73,
  'Colombia': 71, 'Japan': 70, 'Morocco': 68, 'Uruguay': 68,
  'Senegal': 67, 'Switzerland': 66, 'Croatia': 65, 'Korea Republic': 63,
  'Sweden': 64, 'Ecuador': 62, 'Australia': 62, 'Türkiye': 61,
  "Côte d'Ivoire": 58, 'Czechia': 59, 'Scotland': 59, 'Algeria': 58,
  'Austria': 57, 'Egypt': 56, 'Saudi Arabia': 56, 'Tunisia': 54,
  'IR Iran': 54, 'Bosnia and Herzegovina': 54, 'Paraguay': 53,
  'Ghana': 53, 'Uzbekistan': 52, 'Congo DR': 52, 'South Africa': 50,
  'Iraq': 48, 'Panama': 48, 'Cabo Verde': 47, 'Qatar': 46,
  'Jordan': 46, 'New Zealand': 45, 'Curaçao': 40, 'Haiti': 40,
};

export function winProbability(home: string, away: string): { home: number; draw: number; away: number } {
  const sh = TEAM_STRENGTH[home] ?? 55;
  const sa = TEAM_STRENGTH[away] ?? 55;
  const diff = Math.abs(sh - sa) / Math.max(sh, sa);
  const drawP = Math.max(0.10, 0.28 - diff * 0.22);
  const remainder = 1 - drawP;
  const homeShare = (sh * 1.05) / (sh * 1.05 + sa);
  const h = Math.round(remainder * homeShare * 100);
  const d = Math.round(drawP * 100);
  return { home: h, draw: d, away: 100 - h - d };
}

export function outcomeOf(h: number, a: number): Outcome {
  return h > a ? 'H' : h < a ? 'A' : 'D';
}

export function calculatePoints(bH: number, bA: number, rH: number, rA: number): number {
  if (bH === rH && bA === rA) return 3;
  return outcomeOf(bH, bA) === outcomeOf(rH, rA) ? 1 : 0;
}

// A bet is either an exact-score guess or a winner-only (1X2) guess.
export interface BetLike {
  home?: number;
  away?: number;
  kind?: BetKind;     // undefined === 'score' (backward compatible)
  pick?: Outcome;     // used when kind === 'winner'
}

// Business rule: a registered player who does NOT place a bet on a match still
// competes — they are entered automatically with a 0–0 exact-score prediction.
export const DEFAULT_BET = { home: 0, away: 0, kind: 'score' as BetKind } as const;

// Points scheme (decided by the pool):
//   • Marcador (score): 3 if exact, 1 if only the winner/draw is right, else 0.
//   • Resultado (winner/1X2): 1 if the outcome is right, else 0.
// This is the single source of truth — every screen scores through it so the
// rules can't drift or be bypassed.
export function pointsFor(bet: BetLike | undefined, m: Match): number {
  if (m.status !== 'finished' || m.homeScore == null || m.awayScore == null) return 0;
  const real = outcomeOf(m.homeScore, m.awayScore);
  if (bet?.kind === 'winner') {
    return bet.pick === real ? 1 : 0;
  }
  const b = bet ?? DEFAULT_BET;
  return calculatePoints(b.home ?? 0, b.away ?? 0, m.homeScore, m.awayScore);
}

// Match times are stored as Colombia local time (UTC−5). Build the real instant
// so the deadline and the displayed time are correct on any device.
export function toInstant(iso: string): Date {
  // 'YYYY-MM-DDTHH:MM' → append seconds + Colombia offset if no zone is present.
  const hasZone = /[Zz]|[+-]\d\d:?\d\d$/.test(iso);
  return new Date(hasZone ? iso : `${iso.length <= 16 ? iso + ':00' : iso}-05:00`);
}

export function canBet(matchDate: string, matchStatus: MatchStatus): boolean {
  if (matchStatus !== 'upcoming') return false;
  const deadline = toInstant(matchDate).getTime() - 5 * 60 * 1000;
  return Date.now() < deadline;
}

export function fmtDate(iso: string): string {
  return toInstant(iso).toLocaleDateString('es-CO', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Bogota',
  });
}

// Colombian time in 12-hour format, e.g. "1:00 p. m.".
export function fmtTime(iso: string): string {
  return toInstant(iso).toLocaleTimeString('es-CO', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota',
  });
}
