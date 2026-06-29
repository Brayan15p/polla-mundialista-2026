import { createClient } from '@supabase/supabase-js';

// Health / self-audit endpoint for the polla.
//
// Returns 200 with { ok: true, ... } when EVERYTHING the pool depends on is
// healthy, or 503 with { ok: false, ... } when an invariant is broken. A cron
// (.github/workflows/healthcheck.yml) hits this every 30 min so we notice
// instantly if the app stops serving or the api-* duplicates ever come back.
//
// What it verifies:
//   - Supabase is reachable (the bets/results live here).
//   - matches_total === 104  (the full WC2026 fixture, 72 groups + 32 knockout).
//   - matches_api === 0      (no loose 'api-*' duplicate match rows).
//   - bets_api === 0         (no bet orphaned on an 'api-*' id -> nobody loses
//                             their bet; the hard rule of the pool).
//   - football-data.org responds (informational; doesn't flip ok by itself).
//
// No PII is exposed: only counts. Optionally guard with HEALTH_TOKEN env (if set,
// require ?key=<token>); if unset the endpoint is open (counts aren't sensitive).

type Check = { name: string; ok: boolean; value?: number | string; expected?: number | string; detail?: string };

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  const ts = new Date().toISOString();
  const healthToken = process.env.HEALTH_TOKEN;
  if (healthToken && req.query?.key !== healthToken) {
    return res.status(401).json({ ok: false, ts, error: 'unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const footballApiKey = process.env.VITE_FOOTBALL_API_KEY;

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  if (!supabaseUrl || !supabaseServiceKey) {
    add({ name: 'env', ok: false, detail: 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    return res.status(503).json({ ok: false, ts, checks });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Helper: exact COUNT without pulling rows (head:true).
  const count = async (
    table: string,
    apply?: (q: any) => any,
  ): Promise<{ n: number | null; error?: string }> => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count: n, error } = await q;
    return { n: n ?? null, error: error?.message };
  };

  // 1) Supabase reachable + fixture intact.
  const matchesTotal = await count('matches');
  if (matchesTotal.error) {
    add({ name: 'supabase', ok: false, detail: matchesTotal.error });
    // Can't trust anything else if the DB is down — short-circuit.
    return res.status(503).json({ ok: false, ts, checks });
  }
  add({ name: 'supabase', ok: true });
  add({ name: 'matches_total', ok: matchesTotal.n === 104, value: matchesTotal.n ?? '?', expected: 104 });

  // 2) No api-* duplicates in matches, no api-* orphan bets.
  const matchesApi = await count('matches', q => q.like('id', 'api-%'));
  add({ name: 'matches_api', ok: matchesApi.n === 0, value: matchesApi.n ?? '?', expected: 0, detail: matchesApi.error });

  const betsApi = await count('bets', q => q.like('match_id', 'api-%'));
  add({ name: 'bets_api', ok: betsApi.n === 0, value: betsApi.n ?? '?', expected: 0, detail: betsApi.error });

  // 3) Totals (informational — surfaced so the log shows the pool is alive).
  const betsTotal = await count('bets');
  add({ name: 'bets_total', ok: !betsTotal.error, value: betsTotal.n ?? '?', detail: betsTotal.error });

  // 4) Football API reachability (informational; soft — a flaky API doesn't
  //    break the pool, the fixture+bets still serve).
  if (footballApiKey) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch('https://api.football-data.org/v4/competitions/WC', {
        headers: { 'X-Auth-Token': footballApiKey },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      add({ name: 'football_api', ok: r.ok, value: r.status });
    } catch (err: any) {
      add({ name: 'football_api', ok: false, detail: err?.message ?? 'fetch failed' });
    }
  } else {
    add({ name: 'football_api', ok: false, detail: 'VITE_FOOTBALL_API_KEY not set' });
  }

  // `ok` rides only on the CRITICAL invariants (DB up, fixture intact, no
  // duplicates, no orphan bets). football_api / bets_total are informational.
  const critical = ['supabase', 'matches_total', 'matches_api', 'bets_api'];
  const ok = checks.filter(c => critical.includes(c.name)).every(c => c.ok);

  return res.status(ok ? 200 : 503).json({ ok, ts, checks });
}
