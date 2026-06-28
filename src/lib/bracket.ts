// bracket.ts — Tournament progression engine for the 48-team 2026 World Cup.
//
// Turns the live group-stage results into the full knockout bracket and keeps it
// up to date automatically:
//   1. Computes each group's table (reusing standings.ts).
//   2. Once a group is decided, locks its winner (1X) and runner-up (2X).
//   3. Once ALL groups are decided, ranks the twelve third-placed teams, keeps
//      the best eight, and slots them into the correct Round-of-32 ties using
//      FIFA's official allowed-group constraints (Annex C of the regulations).
//   4. Propagates the winner of every knockout tie up the bracket, round by
//      round, all the way to the final — plus the third-place play-off.
//
// The bracket layout (which group/match feeds which tie) is the OFFICIAL FIFA
// World Cup 2026 structure, expressed by FIFA match number (73–104):
//   https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
//
// This module is pure: give it the merged match list (group results applied) and
// it returns a NEW match list with the knockout teams filled in wherever they
// are known. Nothing is fabricated — unknown slots stay `Por definir` (TBD).

import { GROUPS, TBD, knockoutWinner, knockoutLoser, type Match } from './data';
import { groupStandings, type TeamRow } from './standings';

export const GROUP_KEYS = Object.keys(GROUPS); // ['A'..'L']

// ── Official 2026 knockout layout, keyed by FIFA match number ───────────────
// Source codes used below:
//   '1X' → winner of group X        '2X' → runner-up of group X
//   '3:NN' → best-third assigned to match NN's third slot
//   'WNN' → winner of match NN      'LNN' → loser of match NN

// Round of 32 (matches 73–88).
const R32_SEED: Record<number, [string, string]> = {
  73: ['2A', '2B'],
  74: ['1E', '3:74'],
  75: ['1F', '2C'],
  76: ['1C', '2F'],
  77: ['1I', '3:77'],
  78: ['2E', '2I'],
  79: ['1A', '3:79'],
  80: ['1L', '3:80'],
  81: ['1D', '3:81'],
  82: ['1G', '3:82'],
  83: ['2K', '2L'],
  84: ['1H', '2J'],
  85: ['1B', '3:85'],
  86: ['1J', '2H'],
  87: ['1K', '3:87'],
  88: ['2D', '2G'],
};

// Round of 16 → Final, plus the third-place play-off (103).
const FEEDS: Record<number, [string, string]> = {
  89: ['W74', 'W77'], 90: ['W73', 'W75'], 91: ['W76', 'W78'], 92: ['W79', 'W80'],
  93: ['W83', 'W84'], 94: ['W81', 'W82'], 95: ['W86', 'W88'], 96: ['W85', 'W87'],
  97: ['W89', 'W90'], 98: ['W93', 'W94'], 99: ['W91', 'W92'], 100: ['W95', 'W96'],
  101: ['W97', 'W98'], 102: ['W99', 'W100'],
  103: ['L101', 'L102'], // tercer puesto: losing semifinalists
  104: ['W101', 'W102'], // gran final
};

// For each "winner vs third" tie, the groups its third-placed team may come
// from. Straight from FIFA's bracket — this is what makes the assignment
// deterministic once we know which eight groups' thirds qualified.
export const THIRD_SLOT_GROUPS: Record<number, string[]> = {
  74: ['A', 'B', 'C', 'D', 'F'],
  77: ['C', 'D', 'F', 'G', 'H'],
  79: ['C', 'E', 'F', 'H', 'I'],
  80: ['E', 'H', 'I', 'J', 'K'],
  81: ['B', 'E', 'F', 'I', 'J'],
  82: ['A', 'E', 'H', 'I', 'J'],
  85: ['E', 'F', 'G', 'I', 'J'],
  87: ['D', 'E', 'I', 'J', 'L'],
};

// FIFA match number ↔ our stable knockout slot ids (KO-32avos-1 … KO-Final-1).
// The slots were built in this exact order in data.ts, so bets stay attached.
export const MATCHNO_TO_ID: Record<number, string> = (() => {
  const m: Record<number, string> = {};
  for (let i = 0; i < 16; i++) m[73 + i] = `KO-32avos-${i + 1}`;
  for (let i = 0; i < 8; i++) m[89 + i] = `KO-Octavos-${i + 1}`;
  for (let i = 0; i < 4; i++) m[97 + i] = `KO-Cuartos-${i + 1}`;
  m[101] = 'KO-Semifinal-1';
  m[102] = 'KO-Semifinal-2';
  m[103] = 'KO-Tercer puesto-1';
  m[104] = 'KO-Final-1';
  return m;
})();

export const ID_TO_MATCHNO: Record<string, number> = Object.fromEntries(
  Object.entries(MATCHNO_TO_ID).map(([n, id]) => [id, Number(n)]),
);

// ── Qualification from the group stage ──────────────────────────────────────

export interface Qualification {
  standings: Record<string, TeamRow[]>;   // per group, already sorted
  complete: Record<string, boolean>;       // all 6 matches of the group played
  allComplete: boolean;                    // every group finished
  winners: Record<string, string>;         // group → team (only when complete)
  runners: Record<string, string>;         // group → team (only when complete)
  thirdRanking: TeamRow[];                 // the 12 thirds, best first (live)
  bestThirds: string[];                    // 8 qualifying third teams (allComplete)
  thirdGroupBySlot: Record<number, string>;// match no → qualifying group (allComplete)
}

// Rank the twelve third-placed teams against each other. Same criteria the group
// table uses: points → goal difference → goals for → name (stable & deterministic).
function rankThirds(standings: Record<string, TeamRow[]>): TeamRow[] {
  return GROUP_KEYS
    .map(g => standings[g]?.[2])
    .filter((r): r is TeamRow => !!r)
    .sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
}

// Assign each Round-of-32 third slot to one of the qualifying groups, honouring
// THIRD_SLOT_GROUPS. With the official constraints this system is solvable; we
// find a valid perfect matching by backtracking (slots ordered by fewest
// options first, which makes the assignment unique in practice).
function assignThirdSlots(qualifyingGroups: string[]): Record<number, string> | null {
  const slots = Object.keys(THIRD_SLOT_GROUPS)
    .map(Number)
    .sort((a, b) => {
      const oa = THIRD_SLOT_GROUPS[a].filter(g => qualifyingGroups.includes(g)).length;
      const ob = THIRD_SLOT_GROUPS[b].filter(g => qualifyingGroups.includes(g)).length;
      return oa - ob;
    });

  const result: Record<number, string> = {};
  const used = new Set<string>();

  const place = (i: number): boolean => {
    if (i === slots.length) return true;
    const slot = slots[i];
    for (const g of THIRD_SLOT_GROUPS[slot]) {
      if (!qualifyingGroups.includes(g) || used.has(g)) continue;
      used.add(g);
      result[slot] = g;
      if (place(i + 1)) return true;
      used.delete(g);
      delete result[slot];
    }
    return false;
  };

  return place(0) ? result : null;
}

export function qualification(matches: Match[]): Qualification {
  const standings: Record<string, TeamRow[]> = {};
  const complete: Record<string, boolean> = {};
  const winners: Record<string, string> = {};
  const runners: Record<string, string> = {};

  for (const g of GROUP_KEYS) {
    const table = groupStandings(g, matches);
    standings[g] = table;
    const played = matches.filter(m => m.group === g && m.status === 'finished').length;
    const done = played >= 6;
    complete[g] = done;
    if (done) {
      winners[g] = table[0]?.team;
      runners[g] = table[1]?.team;
    }
  }

  const allComplete = GROUP_KEYS.every(g => complete[g]);
  const thirdRanking = rankThirds(standings);

  let bestThirds: string[] = [];
  let thirdGroupBySlot: Record<number, string> = {};
  if (allComplete) {
    const best = thirdRanking.slice(0, 8);
    bestThirds = best.map(r => r.team);
    const groupOf = (team: string) => GROUP_KEYS.find(g => GROUPS[g].teams.includes(team))!;
    const qualifyingGroups = best.map(r => groupOf(r.team));
    thirdGroupBySlot = assignThirdSlots(qualifyingGroups) ?? {};
  }

  return { standings, complete, allComplete, winners, runners, thirdRanking, bestThirds, thirdGroupBySlot };
}

// ── Resolve the knockout bracket ────────────────────────────────────────────

// Fill the home/away of every knockout match wherever the feeding teams are
// known, propagating winners up the bracket. Group matches are returned
// untouched. Pure — never mutates the input.
export function resolveKnockout(matches: Match[]): Match[] {
  const q = qualification(matches);
  const byId = new Map(matches.map(m => [m.id, m]));
  const resolved: Record<number, Match> = {};

  // Live knockout games coming straight from the football API arrive as separate
  // entries: their team names are known, but they aren't attached to one of our
  // stable KO slot ids. Index them by an order-independent team-pair so we can
  // graft their score onto the matching slot AS WE RESOLVE it — that way the
  // winner propagates up the bracket in this same ascending pass. Group games and
  // admin results need no special handling (the latter already sit on the slot id).
  const koIds = new Set(Object.values(MATCHNO_TO_ID));
  const pairKey = (a: string, b: string) => [a, b].sort().join(' × ');
  const loose = new Map<string, Match>();
  for (const m of matches) {
    if (koIds.has(m.id)) continue;                       // already a KO slot
    if (m.group && m.group !== '?') continue;            // a group-stage game
    if (!m.home || !m.away || m.home === TBD || m.away === TBD) continue;
    if (m.homeScore == null || m.awayScore == null) continue;
    loose.set(pairKey(m.home, m.away), m);
  }
  const absorbed = new Set<string>();

  // Real knockout pairings from the API, indexed by each team (incl. ties not yet
  // played, no score). The home side of every R32 slot is a group winner/runner-up
  // and is reliable; our third-place assignment may differ from the OFFICIAL draw,
  // so when the API knows the real opponent for a slot's anchor team we adopt it.
  const apiKoByTeam = new Map<string, Match>();
  for (const m of matches) {
    if (koIds.has(m.id)) continue;
    if (m.group && m.group !== '?') continue;
    if (!m.home || !m.away || m.home === TBD || m.away === TBD) continue;
    apiKoByTeam.set(m.home, m);
    apiKoByTeam.set(m.away, m);
  }

  const thirdTeam = (slot: number): string => {
    const g = q.thirdGroupBySlot[slot];
    return g ? (q.standings[g]?.[2]?.team ?? TBD) : TBD;
  };

  const source = (code: string): string => {
    if (code.startsWith('W')) return knockoutWinner(resolved[Number(code.slice(1))] ?? blank(Number(code.slice(1)))) ?? TBD;
    if (code.startsWith('L')) return knockoutLoser(resolved[Number(code.slice(1))] ?? blank(Number(code.slice(1)))) ?? TBD;
    if (code.startsWith('3:')) return q.allComplete ? thirdTeam(Number(code.slice(2))) : TBD;
    const pos = code[0], g = code.slice(1);
    if (!q.complete[g]) return TBD;
    return pos === '1' ? (q.winners[g] ?? TBD) : (q.runners[g] ?? TBD);
  };

  // Safety net so source() never dereferences an unbuilt match.
  const blank = (mn: number): Match => byId.get(MATCHNO_TO_ID[mn]) ?? {
    id: MATCHNO_TO_ID[mn], group: '', home: TBD, away: TBD, date: '', venue: '', status: 'upcoming',
  };

  // Match numbers only ever reference LOWER numbers, so ascending order resolves
  // every dependency in a single pass (R32 → R16 → QF → SF → 3rd/Final).
  for (let mn = 73; mn <= 104; mn++) {
    const id = MATCHNO_TO_ID[mn];
    const base = byId.get(id);
    if (!base) continue;
    const [hs, as] = mn <= 88 ? R32_SEED[mn] : FEEDS[mn];
    let m: Match = { ...base, home: source(hs), away: source(as) };
    // R32 only: trust the API for the real opponent of this slot's anchor (home)
    // team, overriding a third-place guess that doesn't match the official draw.
    if (mn <= 88 && m.home !== TBD) {
      const real = apiKoByTeam.get(m.home);
      if (real) {
        const realAway = real.home === m.home ? real.away : real.home;
        if (realAway && realAway !== TBD && realAway !== m.home) m = { ...m, away: realAway };
      }
    }
    // Graft a live API result onto a still-open slot whose teams are now known,
    // re-orienting the score if the API lists the pair the other way around.
    if (m.status !== 'finished' && m.home !== TBD && m.away !== TBD) {
      const hit = loose.get(pairKey(m.home, m.away));
      if (hit) {
        const flip = hit.home !== m.home;
        m = {
          ...m,
          homeScore: flip ? hit.awayScore : hit.homeScore,
          awayScore: flip ? hit.homeScore : hit.awayScore,
          homePens: flip ? hit.awayPens : hit.homePens,
          awayPens: flip ? hit.homePens : hit.awayPens,
          status: hit.status,
          minute: hit.minute,
        };
        absorbed.add(hit.id);
      }
    }
    resolved[mn] = m;
  }

  // Swap each KO slot for its resolved version and drop the loose API entries we
  // absorbed, so the same game never appears twice.
  return matches
    .map(m => resolved[ID_TO_MATCHNO[m.id]] ?? m)
    .filter(m => !absorbed.has(m.id));
}

// ── Structured view for the bracket UI ──────────────────────────────────────

export interface BracketTie {
  id: string;
  matchNo: number;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  homePens?: number;
  awayPens?: number;
  status: Match['status'];
  winner?: string;     // advancing team, once decided
  date: string;
}

export interface BracketRound {
  key: string;
  name: string;
  ties: BracketTie[];
}

const ROUND_DEFS: { key: string; name: string; from: number; to: number }[] = [
  { key: 'r32', name: 'Dieciseisavos', from: 73, to: 88 },
  { key: 'r16', name: 'Octavos de final', from: 89, to: 96 },
  { key: 'qf', name: 'Cuartos de final', from: 97, to: 100 },
  { key: 'sf', name: 'Semifinales', from: 101, to: 102 },
  { key: 'third', name: 'Tercer puesto', from: 103, to: 103 },
  { key: 'final', name: 'Gran Final', from: 104, to: 104 },
];

// Build the round-by-round bracket from an already-resolved match list (the one
// App passes around), ready for the Bracket screen to render.
export function bracketRounds(resolvedMatches: Match[]): BracketRound[] {
  const byId = new Map(resolvedMatches.map(m => [m.id, m]));
  return ROUND_DEFS.map(def => {
    const ties: BracketTie[] = [];
    for (let mn = def.from; mn <= def.to; mn++) {
      const m = byId.get(MATCHNO_TO_ID[mn]);
      if (!m) continue;
      ties.push({
        id: m.id, matchNo: mn, home: m.home, away: m.away,
        homeScore: m.homeScore, awayScore: m.awayScore,
        homePens: m.homePens, awayPens: m.awayPens,
        status: m.status, winner: knockoutWinner(m), date: m.date,
      });
    }
    return { key: def.key, name: def.name, ties };
  });
}
