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
  const profile = await fetchProfile(data.user!.id);
  return { user: profile ?? { id: data.user!.id, username, email: '', password: '', playerId: null, poolJoined: joinPool, createdAt: new Date().toISOString() } };
}

export async function cloudSignIn(
  email: string, password: string,
): Promise<{ user?: User; error?: string }> {
  if (!supabase) return { error: 'Supabase no configurado' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const profile = await fetchProfile(data.user!.id);
  return { user: profile ?? undefined };
}

export async function cloudSignOut(): Promise<void> {
  await supabase?.auth.signOut();
}

// Restore the logged-in user on page load (session persists in localStorage).
export async function cloudCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return (await fetchProfile(data.user.id)) ?? null;
}

async function fetchProfile(id: string): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data ? toUser(data as ProfileRow) : null;
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
