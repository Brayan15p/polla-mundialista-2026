#!/usr/bin/env node
// api-smoke.mjs — Live check against football-data.org.
//
// Run it where the network is open (your machine), NOT inside the sandboxed
// web session (that container blocks outbound hosts). It answers three things:
//   1. Does the API key work?  (HTTP 200)
//   2. Is anything live / finished right now, and what does it say?
//   3. Are kickoff times correct once converted to Colombia time?
//
//   node scripts/api-smoke.mjs
//
// Reads VITE_FOOTBALL_API_KEY from .env (or the environment).

import { readFileSync } from 'node:fs';

function readKey() {
  if (process.env.VITE_FOOTBALL_API_KEY) return process.env.VITE_FOOTBALL_API_KEY.trim();
  try {
    const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    return (env.match(/VITE_FOOTBALL_API_KEY=(.+)/) || [])[1]?.trim() || '';
  } catch {
    return '';
  }
}

const COL = (iso) =>
  new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota', weekday: 'short', day: 'numeric',
    month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  });

const key = readKey();
if (!key) {
  console.error('✗ No VITE_FOOTBALL_API_KEY found (.env or env var). Aborting.');
  process.exit(1);
}

const url = 'https://api.football-data.org/v4/competitions/WC/matches';
console.log('→ GET', url);

try {
  const res = await fetch(url, { headers: { 'X-Auth-Token': key } });
  console.log(`← HTTP ${res.status} ${res.statusText}`);
  if (!res.ok) {
    console.error('✗ API call failed:', (await res.text()).slice(0, 400));
    process.exit(1);
  }

  const data = await res.json();
  const ms = data.matches || [];
  console.log(`✓ API works — ${ms.length} matches for ${data.competition?.name || 'WC'}`);

  const by = {};
  for (const m of ms) by[m.status] = (by[m.status] || 0) + 1;
  console.log('  status breakdown:', JSON.stringify(by));

  const live = ms.filter((m) => m.status === 'IN_PLAY' || m.status === 'PAUSED');
  console.log(`\n● EN VIVO ahora: ${live.length}`);
  for (const m of live)
    console.log(`   ${m.homeTeam?.name} ${m.score?.fullTime?.home ?? 0}-${m.score?.fullTime?.away ?? 0} ${m.awayTeam?.name}  (min ${m.minute ?? '?'})`);

  const fin = ms.filter((m) => m.status === 'FINISHED');
  console.log(`\n✓ FINALIZADOS: ${fin.length}`);
  for (const m of fin.slice(0, 5))
    console.log(`   ${m.homeTeam?.name} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.name}`);

  console.log('\n🕒 Próximos 5 (hora de Colombia):');
  for (const m of ms.filter((m) => m.status === 'TIMED' || m.status === 'SCHEDULED').slice(0, 5))
    console.log(`   ${COL(m.utcDate)}  —  ${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
} catch (e) {
  console.error('✗ Network/error:', e.message);
  process.exit(1);
}
