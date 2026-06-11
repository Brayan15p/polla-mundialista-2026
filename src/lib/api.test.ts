import { describe, it, expect } from 'vitest';
import { mapMatch, mapStatus, type RawMatch } from './api';
import { fmtTime } from './data';

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
});
