import { describe, it, expect } from 'vitest';
import { calculatePoints, pointsFor, canBet, winProbability, teamsKnown, fmtTime, MATCHES, TBD, type Match } from './data';
import { groupStandings } from './standings';

describe('calculatePoints', () => {
  it('gives 3 for an exact score', () => {
    expect(calculatePoints(2, 1, 2, 1)).toBe(3);
    expect(calculatePoints(0, 0, 0, 0)).toBe(3);
  });
  it('gives 1 for the right winner but wrong score', () => {
    expect(calculatePoints(2, 0, 3, 1)).toBe(1); // home win predicted, home win real
    expect(calculatePoints(0, 2, 1, 3)).toBe(1); // away win
  });
  it('gives 1 for a correctly predicted draw', () => {
    expect(calculatePoints(1, 1, 2, 2)).toBe(1);
  });
  it('gives 0 when the result is wrong', () => {
    expect(calculatePoints(2, 0, 0, 2)).toBe(0);
    expect(calculatePoints(1, 1, 2, 0)).toBe(0);
  });
});

const finished = (h: number, a: number): Match => ({
  id: 'X1', group: 'A', home: 'Brazil', away: 'Mexico',
  date: '2026-06-11T13:00', venue: 'Azteca', status: 'finished', homeScore: h, awayScore: a,
});

describe('pointsFor — 0-0 default rule', () => {
  it('scores a missing bet as 0-0', () => {
    expect(pointsFor(undefined, finished(0, 0))).toBe(3);   // default 0-0 hits an actual 0-0
    expect(pointsFor(undefined, finished(0, 2))).toBe(0);   // 0-0 predicts a draw; 0-2 is an away win → 0 pts
    expect(pointsFor(undefined, finished(1, 1))).toBe(1);   // 0-0 predicts a draw; 1-1 is a draw → 1 pt
  });
  it('a real bet beats the default', () => {
    expect(pointsFor({ home: 2, away: 1 }, finished(2, 1))).toBe(3);
  });
  it('returns 0 for matches that are not finished', () => {
    const upcoming: Match = { ...finished(1, 0), status: 'upcoming', homeScore: undefined, awayScore: undefined };
    expect(pointsFor({ home: 1, away: 0 }, upcoming)).toBe(0);
  });
});

describe('pointsFor — winner (1X2) bets', () => {
  it('gives 1 for the correct winner pick, 0 otherwise', () => {
    expect(pointsFor({ home: 0, away: 0, kind: 'winner', pick: 'H' }, finished(2, 0))).toBe(1);
    expect(pointsFor({ home: 0, away: 0, kind: 'winner', pick: 'A' }, finished(2, 0))).toBe(0);
    expect(pointsFor({ home: 0, away: 0, kind: 'winner', pick: 'D' }, finished(1, 1))).toBe(1);
  });
  it('never awards 3 to a winner bet, even if the score coincides', () => {
    expect(pointsFor({ home: 2, away: 1, kind: 'winner', pick: 'H' }, finished(2, 1))).toBe(1);
  });
});

describe('fixture integrity', () => {
  it('has 104 matches total (72 group + 32 knockout)', () => {
    expect(MATCHES.length).toBe(104);
    expect(MATCHES.filter(m => m.group).length).toBe(72);
    expect(MATCHES.filter(m => !m.group).length).toBe(32);
  });
  it('knockout matches start with both teams undefined (TBD)', () => {
    const ko = MATCHES.filter(m => !m.group);
    expect(ko.every(m => m.home === TBD && m.away === TBD)).toBe(true);
    expect(ko.every(m => !teamsKnown(m))).toBe(true);
  });
  it('group matches have known teams', () => {
    expect(MATCHES.filter(m => m.group).every(teamsKnown)).toBe(true);
  });
  it('formats kickoff time in 12-hour Colombian format (not 24h)', () => {
    const t = fmtTime('2026-06-11T13:00');
    expect(t).not.toBe('13:00');
    expect(/\d{1,2}:\d{2}/.test(t)).toBe(true);
    expect(/m\.?/i.test(t)).toBe(true); // a. m. / p. m.
  });
});

describe('canBet — betting deadline', () => {
  it('allows betting well before kickoff', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(canBet(future, 'upcoming')).toBe(true);
  });
  it('blocks betting within 5 minutes of kickoff', () => {
    const soon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    expect(canBet(soon, 'upcoming')).toBe(false);
  });
  it('blocks betting on live or finished matches', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(canBet(future, 'live')).toBe(false);
    expect(canBet(future, 'finished')).toBe(false);
  });
});

describe('winProbability', () => {
  it('always sums to 100', () => {
    const p = winProbability('Brazil', 'Haiti');
    expect(p.home + p.draw + p.away).toBe(100);
  });
  it('favours the stronger team', () => {
    const p = winProbability('Brazil', 'Haiti');
    expect(p.home).toBeGreaterThan(p.away);
  });
});

describe('groupStandings', () => {
  const mk = (id: string, home: string, away: string, hs: number, as: number): Match => ({
    id, group: 'A', home, away, date: '2026-06-11T13:00', venue: 'x', status: 'finished', homeScore: hs, awayScore: as,
  });
  it('awards 3 points for a win, 1 for a draw, sorts by points then GD', () => {
    // Group A teams: Mexico, South Africa, Korea Republic, Czechia
    const matches = [
      mk('A1', 'Mexico', 'South Africa', 3, 0),       // Mexico +3
      mk('A2', 'Korea Republic', 'Czechia', 1, 1),    // draw
    ];
    const table = groupStandings('A', matches);
    expect(table[0].team).toBe('Mexico');
    expect(table[0].points).toBe(3);
    expect(table[0].gd).toBe(3);
    const kr = table.find(r => r.team === 'Korea Republic')!;
    expect(kr.points).toBe(1);
    const za = table.find(r => r.team === 'South Africa')!;
    expect(za.points).toBe(0);
    expect(za.gd).toBe(-3);
  });
  it('ignores matches that are not finished', () => {
    const table = groupStandings('A', []);
    expect(table.every(r => r.played === 0 && r.points === 0)).toBe(true);
  });
});
