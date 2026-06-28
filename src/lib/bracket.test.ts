import { describe, it, expect } from 'vitest';
import { MATCHES, GROUPS, TEAM_STRENGTH, TBD, teamsKnown, knockoutWinner, type Match } from './data';
import {
  GROUP_KEYS, THIRD_SLOT_GROUPS, MATCHNO_TO_ID,
  qualification, resolveKnockout, bracketRounds,
} from './bracket';

const strength = (t: string) => TEAM_STRENGTH[t] ?? 55;

// Finish the whole group stage deterministically by team strength. The stronger
// team wins every match 2–0, EXCEPT the 3rd-vs-4th game, whose margin we widen
// for groups in `qualifyThirds` so those groups' third-placed teams rank above
// the rest (lets us steer which 8 thirds advance to a known-valid combination).
function finishGroups(qualifyThirds: Set<string>): Match[] {
  const rankIn: Record<string, Record<string, number>> = {};
  for (const g of GROUP_KEYS) {
    const ordered = [...GROUPS[g].teams].sort((a, b) => strength(b) - strength(a) || a.localeCompare(b));
    rankIn[g] = {};
    ordered.forEach((t, i) => (rankIn[g][t] = i)); // 0 = strongest … 3 = weakest
  }
  return MATCHES.map(m => {
    if (!m.group) return m;
    const rh = rankIn[m.group][m.home];
    const ra = rankIn[m.group][m.away];
    const lo = Math.min(rh, ra), hi = Math.max(rh, ra);
    const margin = lo === 2 && hi === 3 ? (qualifyThirds.has(m.group) ? 6 : 1) : 2;
    const homeWins = rh < ra;
    return { ...m, homeScore: homeWins ? margin : 0, awayScore: homeWins ? 0 : margin, status: 'finished' as const };
  });
}

// Play one knockout round: resolve teams, then settle every decided tie 2–0 in
// favour of the stronger side (so we never need penalties here).
function playStage(matches: Match[], from: number, to: number): Match[] {
  const resolved = resolveKnockout(matches);
  const ids = new Set<string>();
  for (let mn = from; mn <= to; mn++) ids.add(MATCHNO_TO_ID[mn]);
  return resolved.map(m => {
    if (!ids.has(m.id) || m.status === 'finished' || m.home === TBD || m.away === TBD) return m;
    const homeWins = strength(m.home) >= strength(m.away);
    return { ...m, homeScore: homeWins ? 2 : 0, awayScore: homeWins ? 0 : 2, status: 'finished' as const };
  });
}

// {A..H} is a valid third-place combination (a perfect matching exists).
const VALID_THIRDS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

describe('qualification', () => {
  it('leaves everything undecided while no group is complete', () => {
    const q = qualification(MATCHES);
    expect(q.allComplete).toBe(false);
    expect(Object.keys(q.winners)).toHaveLength(0);
    expect(q.bestThirds).toHaveLength(0);
  });

  it('locks winners/runners-up and exactly 8 best thirds once groups finish', () => {
    const q = qualification(finishGroups(VALID_THIRDS));
    expect(q.allComplete).toBe(true);
    expect(Object.keys(q.winners)).toHaveLength(12);
    expect(Object.keys(q.runners)).toHaveLength(12);
    expect(q.bestThirds).toHaveLength(8);
    // Winner and runner-up of a group are different real teams in that group.
    for (const g of GROUP_KEYS) {
      expect(GROUPS[g].teams).toContain(q.winners[g]);
      expect(GROUPS[g].teams).toContain(q.runners[g]);
      expect(q.winners[g]).not.toBe(q.runners[g]);
    }
  });

  it('assigns each third slot to an allowed, distinct group', () => {
    const q = qualification(finishGroups(VALID_THIRDS));
    const slots = Object.keys(THIRD_SLOT_GROUPS).map(Number);
    expect(Object.keys(q.thirdGroupBySlot).map(Number).sort()).toEqual(slots.sort((a, b) => a - b));
    const assigned = Object.entries(q.thirdGroupBySlot);
    for (const [slot, g] of assigned) {
      expect(THIRD_SLOT_GROUPS[Number(slot)]).toContain(g);
    }
    const groups = assigned.map(([, g]) => g);
    expect(new Set(groups).size).toBe(groups.length); // all distinct
  });
});

describe('resolveKnockout — Round of 32', () => {
  it('keeps every knockout slot TBD before the group stage decides anything', () => {
    const resolved = resolveKnockout(MATCHES);
    const ko = resolved.filter(m => !m.group);
    expect(ko).toHaveLength(32);
    expect(ko.every(m => m.home === TBD && m.away === TBD)).toBe(true);
  });

  it('fills all 16 ties with 32 distinct real teams once groups finish', () => {
    const resolved = resolveKnockout(finishGroups(VALID_THIRDS));
    const r32 = resolved.filter(m => m.stage === '32avos');
    expect(r32).toHaveLength(16);
    expect(r32.every(teamsKnown)).toBe(true);
    const teams = r32.flatMap(m => [m.home, m.away]);
    expect(new Set(teams).size).toBe(32);
  });
});

describe('resolveKnockout — full propagation to the final', () => {
  it('advances winners all the way to a single champion', () => {
    let s = finishGroups(VALID_THIRDS);
    s = playStage(s, 73, 88);   // R32
    s = playStage(s, 89, 96);   // R16
    s = playStage(s, 97, 100);  // QF
    s = playStage(s, 101, 102); // SF
    s = playStage(s, 103, 104); // 3rd place + final

    const final = resolveKnockout(s).find(m => m.stage === 'Final')!;
    expect(teamsKnown(final)).toBe(true);
    expect(final.status).toBe('finished');
    expect(knockoutWinner(final)).toBeDefined();

    // Third-place playoff is fed by the two losing semifinalists.
    const third = resolveKnockout(s).find(m => m.stage === 'Tercer puesto')!;
    expect(teamsKnown(third)).toBe(true);
  });
});

describe('penalty shootouts decide who advances', () => {
  it('propagates the penalty winner of a drawn knockout tie', () => {
    const resolved = resolveKnockout(finishGroups(VALID_THIRDS));
    // Match 73 → KO-32avos-1 feeds match 90 (KO-Octavos-2) as its home side.
    const r32first = resolved.find(m => m.id === MATCHNO_TO_ID[73])!;
    const drawn: Match = { ...r32first, homeScore: 1, awayScore: 1, homePens: 4, awayPens: 2, status: 'finished' };
    expect(knockoutWinner(drawn)).toBe(drawn.home);

    const next = resolveKnockout(resolved.map(m => (m.id === drawn.id ? drawn : m)));
    const r16 = next.find(m => m.id === MATCHNO_TO_ID[90])!;
    expect(r16.home).toBe(drawn.home);
  });
});

describe('resolveKnockout — live API knockout results', () => {
  it('attaches a loose API knockout score by team pair and propagates the winner', () => {
    const groups = finishGroups(VALID_THIRDS);
    const r32 = resolveKnockout(groups).find(m => m.id === MATCHNO_TO_ID[73])!;
    expect(teamsKnown(r32)).toBe(true);

    // The API reports the tie under its own id, teams possibly the other way
    // around, with a final score — exactly how a live knockout game arrives.
    const looseApi: Match = {
      id: 'api-9001', group: '?', home: r32.away, away: r32.home,
      date: '2026-06-28T12:00', venue: '', status: 'finished', homeScore: 0, awayScore: 3,
    };
    const out = resolveKnockout([...groups, looseApi]);

    const slot = out.find(m => m.id === MATCHNO_TO_ID[73])!;
    expect(slot.status).toBe('finished');
    expect(slot.homeScore).toBe(3);              // re-oriented to the slot's home side
    expect(slot.awayScore).toBe(0);
    expect(knockoutWinner(slot)).toBe(r32.home);

    // The loose entry is absorbed, never shown twice.
    expect(out.find(m => m.id === 'api-9001')).toBeUndefined();

    // Winner propagates to the Round-of-16 slot fed by match 73 (match 90, home).
    const r16 = out.find(m => m.id === MATCHNO_TO_ID[90])!;
    expect(r16.home).toBe(r32.home);
  });

  it('reads penalties from a drawn live tie to decide who advances', () => {
    const groups = finishGroups(VALID_THIRDS);
    const r32 = resolveKnockout(groups).find(m => m.id === MATCHNO_TO_ID[73])!;
    const looseApi: Match = {
      id: 'api-9002', group: '?', home: r32.home, away: r32.away,
      date: '2026-06-28T12:00', venue: '', status: 'finished',
      homeScore: 1, awayScore: 1, homePens: 2, awayPens: 4,
    };
    const out = resolveKnockout([...groups, looseApi]);
    const slot = out.find(m => m.id === MATCHNO_TO_ID[73])!;
    expect(knockoutWinner(slot)).toBe(r32.away); // lost the score line, won on pens
  });

  it('leaves a group-stage result untouched even if those teams meet again in KO', () => {
    // Sanity: loose attachment must never absorb a group game (it would corrupt
    // standings). A group game keeps its group key, so it is ignored as a source.
    const groups = finishGroups(VALID_THIRDS);
    const out = resolveKnockout(groups);
    expect(out.filter(m => m.group).length).toBe(groups.filter(m => m.group).length);
  });
});

describe('bracketRounds view', () => {
  it('exposes all six rounds with the right number of ties', () => {
    const rounds = bracketRounds(resolveKnockout(finishGroups(VALID_THIRDS)));
    const counts = Object.fromEntries(rounds.map(r => [r.key, r.ties.length]));
    expect(counts).toEqual({ r32: 16, r16: 8, qf: 4, sf: 2, third: 1, final: 1 });
  });
});
