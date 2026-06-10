// data.ts — FIFA World Cup 2026 data module (ported from wc-data.js)

export type Tier = 'legend' | 'gold' | 'silver' | 'bronze';
export type MatchStatus = 'upcoming' | 'live' | 'finished';

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
  group: string;
  home: string;
  away: string;
  date: string;
  venue: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
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

// Round-robin pairings (team indices) for each of a group's 3 matchdays.
const ROUND_PAIRS: [number, number][][] = [
  [[0, 1], [2, 3]], // Jornada 1
  [[0, 2], [1, 3]], // Jornada 2
  [[0, 3], [1, 2]], // Jornada 3
];
const MATCH_TIMES = ['13:00', '16:00', '19:00'];

// Build the complete group-stage fixture: 12 groups × 6 matches = 72 games.
// Every match ships as `upcoming` with NO score — real results come only from
// the live API (football-data.org) or the admin panel. We never fabricate
// scores for games that haven't been played.
function buildGroupStage(): Match[] {
  const out: Match[] = [];
  let venueIdx = 0;
  Object.entries(GROUPS).forEach(([gKey, g], gIdx) => {
    ROUND_PAIRS.forEach((pairs, round) => {
      pairs.forEach((pair, p) => {
        const day = 11 + round * 5 + (gIdx % 5); // June 11–25, 2026
        const time = MATCH_TIMES[(gIdx + p) % MATCH_TIMES.length];
        out.push({
          id: `${gKey}${round * 2 + p + 1}`,
          group: gKey,
          home: g.teams[pair[0]],
          away: g.teams[pair[1]],
          date: `2026-06-${String(day).padStart(2, '0')}T${time}`,
          venue: HOST_VENUES[venueIdx++ % HOST_VENUES.length],
          status: 'upcoming',
        });
      });
    });
  });
  // Chronological so the "by date" listing reads naturally.
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const MATCHES: Match[] = buildGroupStage();

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

export function calculatePoints(bH: number, bA: number, rH: number, rA: number): number {
  if (bH === rH && bA === rA) return 3;
  const bW = bH > bA ? 'H' : bH < bA ? 'A' : 'D';
  const rW = rH > rA ? 'H' : rH < rA ? 'A' : 'D';
  return bW === rW ? 1 : 0;
}

export function canBet(matchDate: string, matchStatus: MatchStatus): boolean {
  if (matchStatus !== 'upcoming') return false;
  const deadline = new Date(matchDate).getTime() - 5 * 60 * 1000;
  return Date.now() < deadline;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtTime(iso: string): string {
  return iso.split('T')[1] ? iso.split('T')[1].substring(0, 5) : '';
}
