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

export async function cloudPlaceBet(userId: string, matchId: string, home: number, away: number): Promise<void> {
  await supabase?.from('bets').upsert(
    { user_id: userId, match_id: matchId, home, away },
    { onConflict: 'user_id,match_id' },
  );
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
    supabase.from('bets').select('user_id, match_id, home, away'),
    supabase.from('match_results').select('match_id, home, away'),
  ]);

  const users = (profilesRes.data as ProfileRow[] | null)?.map(toUser) ?? [];

  const bets: CloudData['bets'] = {};
  for (const b of (betsRes.data ?? []) as { user_id: string; match_id: string; home: number; away: number }[]) {
    (bets[b.user_id] ??= {})[b.match_id] = { home: b.home, away: b.away };
  }

  const matchResults: CloudData['matchResults'] = {};
  for (const r of (resultsRes.data ?? []) as { match_id: string; home: number; away: number }[]) {
    matchResults[r.match_id] = { home: r.home, away: r.away };
  }

  return { users, bets, matchResults };
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
