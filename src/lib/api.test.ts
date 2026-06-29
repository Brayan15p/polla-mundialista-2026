import { describe, it, expect } from 'vitest';
import { mapMatch, mapStatus, mergeLiveOntoFixture, type RawMatch } from './api';
import { fmtTime, MATCHES, TBD } from './data';

// These tests pin down the API → app mapping WITHOUT hitting the network, so
// they verify the two things that actually bite us: status mapping (live /
// finished) and that kickoff times end up in correct Colombia local time.

const raw = (over: Partial<RawMatch> = {}): RawMatch => ({
  id: 12345,
  utcDate: '2026-06-12T18:00:00Z',
  status: 'TIMED',
  homeTeam: { name: 'Mexico' },
  awayTeam: { name: 'Canada' },
  group: 'GROUP_A',
  score: { fullTime: { home: null, away: null } },
  ...over,
});

describe('mapStatus — live / finished detection', () => {
  it('maps in-play and paused to "live"', () => {
    expect(mapStatus('IN_PLAY')).toBe('live');
    expect(mapStatus('PAUSED')).toBe('live');
  });
  it('maps finished/awarded to "finished"', () => {
    expect(mapStatus('FINISHED')).toBe('finished');
    expect(mapStatus('AWARDED')).toBe('finished');
  });
  it('maps scheduled states to "upcoming"', () => {
    expect(mapStatus('TIMED')).toBe('upcoming');
    expect(mapStatus('SCHEDULED')).toBe('upcoming');
  });
});

describe('mapMatch — kickoff in Colombia time', () => {
  it('keeps the UTC zone so the hour converts correctly to Bogotá (UTC-5)', () => {
    // 18:00 UTC must read as 1:00 p. m. in Colombia, NOT 6:00 p. m.
    const m = mapMatch(raw({ utcDate: '2026-06-12T18:00:00Z' }), 0);
    expect(m.date).toContain('Z'); // zone preserved, not stripped
    const t = fmtTime(m.date);
    expect(t).toMatch(/\b1:00\b/);
    expect(/p\.?\s?m/i.test(t)).toBe(true);
  });

  it('a midnight-UTC kickoff rolls back to the previous evening in Colombia', () => {
    // 00:00 UTC on the 13th = 7:00 p. m. on the 12th in Bogotá.
    const t = fmtTime(mapMatch(raw({ utcDate: '2026-06-13T00:00:00Z' }), 0).date);
    expect(t).toMatch(/\b7:00\b/);
    expect(/p\.?\s?m/i.test(t)).toBe(true);
  });

  it('carries live score + minute through', () => {
    const m = mapMatch(raw({ status: 'IN_PLAY', minute: 57, score: { fullTime: { home: 2, away: 1 } } }), 0);
    expect(m.status).toBe('live');
    expect(m.homeScore).toBe(2);
    expect(m.awayScore).toBe(1);
    expect(m.minute).toBe(57);
  });

  it('strips the GROUP_ prefix from group labels', () => {
    expect(mapMatch(raw({ group: 'GROUP_K' }), 0).group).toBe('K');
  });

  it('leaves an unplayed match with no scores', () => {
    const m = mapMatch(raw(), 0);
    expect(m.homeScore).toBeUndefined();
    expect(m.awayScore).toBeUndefined();
  });

  it('reads penalty scores for a knockout shootout', () => {
    const m = mapMatch(raw({
      status: 'FINISHED',
      score: { fullTime: { home: 1, away: 1 }, penalties: { home: 4, away: 2 } },
    }), 0);
    expect(m.homePens).toBe(4);
    expect(m.awayPens).toBe(2);
  });

  // Regression: the API listed a group game the other way around than our fixture
  // (it sent "Panama vs England" for fixture L5 "England vs Panama"), so the exact
  // home/away match failed, the result never reached the slot, and 12 bets went
  // unscored. The lookup is now order-independent and re-orients the score.
  it('maps a reversed group game onto its stable slot and re-orients the score', () => {
    const g = MATCHES.find(m => m.group)!; // a real group fixture
    const m = mapMatch(raw({
      homeTeam: { name: g.away }, awayTeam: { name: g.home }, // API lists it reversed
      group: 'GROUP_' + g.group, status: 'FINISHED',
      score: { fullTime: { home: 0, away: 2 } },              // g.away 0 - g.home 2
    }), 0);
    expect(m.id).toBe(g.id);          // mapped to the stable slot, not 'api-*'
    expect(m.home).toBe(g.home);      // canonical fixture orientation
    expect(m.away).toBe(g.away);
    expect(m.homeScore).toBe(2);      // g.home's 2 goals, re-oriented to the home side
    expect(m.awayScore).toBe(0);
  });
});

describe('mergeLiveOntoFixture', () => {
  it('keeps the full 104-match fixture backbone and overlays group scores', () => {
    // A live group game between two real fixture rivals.
    const g = MATCHES.find(m => m.group)!;
    const out = mergeLiveOntoFixture([raw({
      homeTeam: { name: g.home }, awayTeam: { name: g.away },
      group: 'GROUP_' + g.group, status: 'FINISHED',
      score: { fullTime: { home: 3, away: 0 } },
    })]);
    // All 104 fixture slots survive (incl. the 32 knockout slots the bracket needs).
    expect(out.filter(m => MATCHES.some(f => f.id === m.id))).toHaveLength(104);
    const scored = out.find(m => m.id === g.id)!;
    expect(scored.status).toBe('finished');
    expect(scored.homeScore).toBe(3);
  });

  it('appends a finished knockout game as a loose entry (real teams, no fixture slot)', () => {
    const out = mergeLiveOntoFixture([raw({
      homeTeam: { name: 'Brazil' }, awayTeam: { name: 'France' },
      group: null, status: 'FINISHED', score: { fullTime: { home: 2, away: 1 } },
    })]);
    const loose = out.find(m => m.home === 'Brazil' && m.away === 'France');
    expect(loose).toBeDefined();
    expect(loose!.status).toBe('finished');
    // The knockout fixture slots are still waiting to be filled by the engine.
    expect(out.some(m => m.stage && m.home === TBD)).toBe(true);
  });

  it('overlays a reversed group game onto its fixture slot without a duplicate api- entry', () => {
    const g = MATCHES.find(m => m.group)!;
    const out = mergeLiveOntoFixture([raw({
      homeTeam: { name: g.away }, awayTeam: { name: g.home }, // reversed vs fixture
      group: 'GROUP_' + g.group, status: 'FINISHED',
      score: { fullTime: { home: 0, away: 2 } },
    })]);
    expect(out.some(m => m.id.startsWith('api-'))).toBe(false); // no orphan duplicate
    const slot = out.find(m => m.id === g.id)!;
    expect(slot.status).toBe('finished');
    expect(slot.homeScore).toBe(2); // re-oriented to the fixture's home side
    expect(slot.awayScore).toBe(0);
  });
});
