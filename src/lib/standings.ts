// standings.ts — Group tables (cuadrangulares) computed live from finished matches.

import { GROUPS, type Match } from './data';

export interface TeamRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;   // goles a favor
  ga: number;   // goles en contra
  gd: number;   // diferencia
  points: number;
}

// Build the standings table for a single group, sorted by the usual
// criteria: points → goal difference → goals for → name.
export function groupStandings(groupKey: string, matches: Match[]): TeamRow[] {
  const teams = GROUPS[groupKey]?.teams ?? [];
  const rows: Record<string, TeamRow> = {};
  for (const t of teams) {
    rows[t] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  }

  for (const m of matches) {
    if (m.group !== groupKey || m.status !== 'finished') continue;
    if (m.homeScore == null || m.awayScore == null) continue;
    const h = rows[m.home], a = rows[m.away];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; h.points += 3; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }

  return Object.values(rows)
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
}

// Knockout-round scaffold for the 2026 format (Round of 32 → Final).
// Real fixtures/dates of the FIFA World Cup 2026 host schedule.
export interface KnockoutRound {
  key: string;
  name: string;
  short: string;
  dateRange: string;
  slots: number;     // number of ties in the round
}

export const KNOCKOUT_ROUNDS: KnockoutRound[] = [
  { key: 'r32', name: 'Dieciseisavos', short: '32avos', dateRange: '28 jun – 3 jul', slots: 16 },
  { key: 'r16', name: 'Octavos de final', short: 'Octavos', dateRange: '4 – 7 jul', slots: 8 },
  { key: 'qf',  name: 'Cuartos de final', short: 'Cuartos', dateRange: '9 – 11 jul', slots: 4 },
  { key: 'sf',  name: 'Semifinales', short: 'Semis', dateRange: '14 – 15 jul', slots: 2 },
  { key: 'final', name: 'GRAN FINAL', short: 'Final', dateRange: '19 jul', slots: 1 },
];

// FIFA World Cup 2026 Final — MetLife Stadium, New York/New Jersey.
export const FINAL_DATE = new Date('2026-07-19T15:00:00-04:00');
export const TOURNAMENT_START = new Date('2026-06-11T12:00:00-05:00');
