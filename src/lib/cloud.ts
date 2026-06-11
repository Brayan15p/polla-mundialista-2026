// cloud.ts — Supabase data layer for shared, multi-device play.
//
// Maps Supabase rows onto the app's existing AppState shape so the UI doesn't
// care whether data is local or in the cloud. All writes are guarded by Row
// Level Security; this module only ever uses the anon key.

import { supabase } from './supabase';
import type { User, Bet } from './state';

interface ProfileRow {
  id: string;
  username: string;
  player_id: string | null;
  pool_joined: boolean;
  created_at: string;
}

function toUser(p: ProfileRow): User {
  return {
    id: p.id,
    username: p.username,
    email: '',          // auth owns the email/password; not duplicated here
    password: '',
    playerId: p.player_id,
    poolJoined: p.pool_joined,
    createdAt: p.created_at,
  };
}

export interface CloudData {
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matchResults: Record<string, { home: number; away: number }>;
}

// ── Auth ────────────────────────────────────────────────────────────────
export async function cloudSignUp(
  username: string, email: string, password: string, joinPool: boolean,
): Promise<{ user?: User; needsConfirm?: boolean; error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, pool_joined: joinPool } }, // read by the DB trigger
  });
  if (error) return { error: error.message };
  if (!data.session) return { needsConfirm: true }; // email confirmation is ON
  const profile = await ensureProfile(data.user, username, joinPool);
  return { user: profile ?? { id: data.user!.id, username, email: '', password: '', playerId: null, poolJoined: joinPool, createdAt: new Date().toISOString() } };
}

export async function cloudSignIn(
  email: string, password: string,
): Promise<{ user?: User; error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const profile = await ensureProfile(data.user);
  if (!profile) return { error: 'No se pudo cargar tu perfil. Verifica que ejecutaste schema.sql en Supabase.' };
  return { user: profile };
}

export async function cloudSignOut(): Promise<void> {
  await supabase?.auth.signOut();
}

// Send a password-reset email. The link returns the user to the app, where the
// PASSWORD_RECOVERY event (below) opens the "set new password" screen.
export async function cloudSendPasswordReset(email: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  return { error: error?.message };
}

// Set a new password (used after arriving from the recovery email).
export async function cloudUpdatePassword(newPassword: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message };
}

// Fire `cb` when the user lands from a recovery email so we can show the form.
export function cloudOnPasswordRecovery(cb: () => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') cb();
  });
  return () => data.subscription.unsubscribe();
}

// Restore the logged-in user on page load (session persists in localStorage).
export async function cloudCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return await ensureProfile(data.user);
}

async function fetchProfile(id: string): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data ? toUser(data as ProfileRow) : null;
}

// Return the player's profile, creating it on the fly if it's missing — this
// keeps login working even if the auto-profile trigger wasn't installed or the
// account was created before schema.sql was applied.
async function ensureProfile(
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined,
  username?: string, poolJoined?: boolean,
): Promise<User | null> {
  if (!supabase || !authUser) return null;
  const existing = await fetchProfile(authUser.id);
  if (existing) return existing;

  const meta = authUser.user_metadata || {};
  const name = username || (meta.username as string) || authUser.email?.split('@')[0] || 'Jugador';
  const pool = poolJoined ?? Boolean(meta.pool_joined);
  const { data } = await supabase
    .from('profiles')
    .insert({ id: authUser.id, username: name, pool_joined: pool })
    .select('*')
    .maybeSingle();
  if (data) return toUser(data as ProfileRow);
  // Insert may have raced with the trigger — read once more.
  return await fetchProfile(authUser.id);
}

// ── Writes ──────────────────────────────────────────────────────────────
export async function cloudSetPlayer(userId: string, playerId: string): Promise<void> {
  await supabase?.from('profiles').update({ player_id: playerId }).eq('id', userId);
}

export async function cloudPlaceBet(
  userId: string, matchId: string,
  bet: { home: number; away: number; kind?: string; pick?: string },
): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { error } = await supabase.from('bets').upsert(
    { user_id: userId, match_id: matchId, home: bet.home, away: bet.away, kind: bet.kind ?? 'score', pick: bet.pick ?? null },
    { onConflict: 'user_id,match_id' },
  );
  if (!error) return {};
  // Turn the raw Postgres/PostgREST error into something the player can act on.
  const msg = error.message || '';
  if (/column .*(kind|pick).* does not exist|'kind'|'pick'/i.test(msg))
    return { error: 'Falta una actualización de la base de datos. El admin debe ejecutar supabase/migration_bet_kind.sql en Supabase.' };
  if (/no sincronizado|sincroniza/i.test(msg))
    return { error: 'Este partido no está sincronizado. El admin debe abrir el panel y presionar “Sincronizar partidos”.' };
  return { error: msg || 'No se pudo guardar la apuesta.' };
}

export async function cloudUpdateResult(matchId: string, home: number, away: number): Promise<void> {
  await supabase?.from('match_results').upsert(
    { match_id: matchId, home, away },
    { onConflict: 'match_id' },
  );
}

// Push kickoff times to the `matches` table (admin only) so the server-side
// anti-fraud trigger can enforce the betting deadline. See supabase/anti_fraud.sql.
export async function cloudSyncMatches(matches: { id: string; date: string }[]): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const rows = matches.map(m => ({ id: m.id, kickoff: m.date }));
  const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'id' });
  return { error: error?.message };
}

// ── Reads ───────────────────────────────────────────────────────────────
export async function cloudLoadAll(): Promise<CloudData> {
  const empty: CloudData = { users: [], bets: {}, matchResults: {} };
  if (!supabase) return empty;

  const [profilesRes, betsRes, resultsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('bets').select('user_id, match_id, home, away, kind, pick'),
    supabase.from('match_results').select('match_id, home, away'),
  ]);

  // Surface any read errors to the console so they're visible when debugging.
  if (profilesRes.error) console.error('[cloud] profiles read error:', profilesRes.error.message);
  if (betsRes.error) console.error('[cloud] bets read error:', betsRes.error.message);
  if (resultsRes.error) console.error('[cloud] results read error:', resultsRes.error.message);

  const users = (profilesRes.data as ProfileRow[] | null)?.map(toUser) ?? [];

  const bets: CloudData['bets'] = {};
  for (const b of (betsRes.data ?? []) as { user_id: string; match_id: string; home: number; away: number; kind?: string; pick?: string }[]) {
    (bets[b.user_id] ??= {})[b.match_id] = {
      home: b.home, away: b.away,
      kind: (b.kind as 'score' | 'winner') ?? 'score',
      pick: (b.pick as 'H' | 'D' | 'A' | undefined) ?? undefined,
    };
  }

  const matchResults: CloudData['matchResults'] = {};
  for (const r of (resultsRes.data ?? []) as { match_id: string; home: number; away: number }[]) {
    matchResults[r.match_id] = { home: r.home, away: r.away };
  }

  return { users, bets, matchResults };
}

// ── Diagnostics ────────────────────────────────────────────────────────
// Run a suite of checks and return a plain report the admin can read.
export async function cloudDiagnose(): Promise<string[]> {
  const lines: string[] = [];
  if (!supabase) { lines.push('❌ Supabase NO configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'); return lines; }
  lines.push('✅ Cliente Supabase creado');

  // 1. Auth — who is logged in?
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) lines.push(`❌ Auth: ${error.message}`);
    else if (!user) lines.push('⚠️ No hay sesión activa (no estás logueado en la nube)');
    else lines.push(`✅ Sesión activa: ${user.email} (id: ${user.id})`);
  } catch (e) { lines.push(`❌ Auth fetch falló: ${(e as Error).message}`); }

  // 2. Profiles table
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, username').limit(5);
  if (pErr) lines.push(`❌ Leer profiles: ${pErr.message}`);
  else lines.push(`✅ Profiles: ${profiles?.length ?? 0} usuario(s) encontrados`);

  // 3. Bets table — check columns exist
  const { data: bets, error: bErr } = await supabase.from('bets').select('user_id, match_id, home, away, kind, pick').limit(5);
  if (bErr) {
    lines.push(`❌ Leer bets: ${bErr.message}`);
    if (/kind|pick/i.test(bErr.message)) lines.push('   → Falta ejecutar migration_bet_kind.sql (o re-correr schema.sql)');
  } else {
    lines.push(`✅ Bets: ${bets?.length ?? 0} apuesta(s) en la DB (columns kind/pick OK)`);
  }

  // 4. Write test — try to insert and immediately delete a canary bet
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const testId = '__diag_test__';
      const { error: wErr } = await supabase.from('bets').upsert(
        { user_id: user.id, match_id: testId, home: 0, away: 0, kind: 'score', pick: null },
        { onConflict: 'user_id,match_id' },
      );
      if (wErr) {
        lines.push(`❌ Escribir bets: ${wErr.message}`);
        if (/no sincronizado|sincroniza/i.test(wErr.message)) lines.push('   → El trigger anti-fraude bloquea: sincroniza los partidos desde Admin');
      } else {
        lines.push('✅ Escritura bets: OK');
        await supabase.from('bets').delete().eq('user_id', user.id).eq('match_id', testId);
      }
    }
  } catch (e) { lines.push(`❌ Write test exception: ${(e as Error).message}`); }

  // 5. Match results table
  const { error: rErr } = await supabase.from('match_results').select('match_id').limit(1);
  if (rErr) lines.push(`❌ Leer match_results: ${rErr.message}`);
  else lines.push('✅ match_results: OK');

  // 6. Matches table (anti-fraud kickoffs)
  const { data: mData, error: mErr } = await supabase.from('matches').select('id').limit(1);
  if (mErr) lines.push(`⚠️ Tabla matches (anti-fraud): ${mErr.message}`);
  else if (!mData || mData.length === 0) lines.push('⚠️ Tabla matches vacía — anti-fraude no bloqueará, pero las apuestas sí guardarán');
  else lines.push('✅ Tabla matches con datos (anti-fraude activo)');

  return lines;
}

// ── Realtime ────────────────────────────────────────────────────────────
// Fire `onChange` whenever bets, results, or profiles change anywhere, so
// every device stays in sync live.
export function cloudSubscribe(onChange: () => void): () => void {
  const sb = supabase;
  if (!sb) return () => {};
  const channel = sb
    .channel('polla-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}
