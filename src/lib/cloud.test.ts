import { describe, it, expect } from 'vitest';
import { reconcileCloud, type CloudData, type SharedSlices } from './cloud';

// A player's entered bet must NEVER disappear from the UI on refresh. These
// tests pin the two guarantees of reconcileCloud (the function the Realtime
// refresh uses on every cloud read).

const bet = (home: number, away: number) => ({ home, away, kind: 'score' as const });

const prev: SharedSlices = {
  users: [{ id: 'u1', username: 'Ana', email: 'a@x.com', password: '', playerId: 'messi', poolJoined: true, createdAt: '2026-06-09' }],
  bets: { u1: { 'KO-32avos-1': bet(2, 1), 'match-5': bet(0, 0) } },
  matchResults: { 'match-5': { home: 1, away: 1 } },
};

const cloud = (over: Partial<CloudData>): CloudData => ({
  users: [], bets: {}, matchResults: {},
  ok: { users: true, bets: true, results: true },
  ...over,
});

describe('reconcileCloud — never loses a player\'s data', () => {
  it('keeps existing bets when the bets read FAILED (no blanking)', () => {
    const out = reconcileCloud(prev, cloud({ bets: {}, ok: { users: true, bets: false, results: true } }), 'u1');
    expect(out.bets).toEqual(prev.bets);
  });

  it('keeps existing results/users when their reads FAILED', () => {
    const out = reconcileCloud(prev, cloud({ users: [], matchResults: {}, ok: { users: false, bets: true, results: false } }), 'u1');
    expect(out.users).toEqual(prev.users);
    expect(out.matchResults).toEqual(prev.matchResults);
  });

  it('preserves a just-placed local bet the cloud has not returned yet', () => {
    // Cloud read succeeded but only knows about KO-32avos-1; match-5 was placed
    // a split second ago and hasn't propagated. It must survive.
    const out = reconcileCloud(prev, cloud({ bets: { u1: { 'KO-32avos-1': bet(2, 1) } } }), 'u1');
    expect(out.bets.u1['match-5']).toEqual(bet(0, 0));
    expect(out.bets.u1['KO-32avos-1']).toEqual(bet(2, 1));
  });

  it('lets the cloud value win on a real conflict (other-device edit)', () => {
    const out = reconcileCloud(prev, cloud({ bets: { u1: { 'KO-32avos-1': bet(3, 0) } } }), 'u1');
    expect(out.bets.u1['KO-32avos-1']).toEqual(bet(3, 0)); // cloud, not local 2-1
  });

  it('applies a successful read fully when there is no current user', () => {
    const fresh = cloud({ bets: { u2: { 'match-9': bet(1, 0) } }, matchResults: { 'match-9': { home: 1, away: 0 } } });
    const out = reconcileCloud(prev, fresh, undefined);
    expect(out.bets).toEqual(fresh.bets);
    expect(out.matchResults).toEqual(fresh.matchResults);
  });
});
