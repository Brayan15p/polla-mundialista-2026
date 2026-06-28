// state.ts — App state shape, defaults, and localStorage persistence.

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  playerId: string | null;
  poolJoined: boolean;
  createdAt: string;
}

// Super users / admins — by email so it works in both local and cloud mode
// without any DB schema change. Only these accounts see the admin panel and
// can edit results, sync matches, etc. Everyone else gets a clean player UI
// with no admin controls. Compared case-insensitively.
export const ADMIN_EMAILS = ['apedrazacespedes@gmail.com'];

export function isAdmin(user?: Pick<User, 'email'> | null): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.trim().toLowerCase());
}

import type { BetKind, Outcome } from './data';

export interface Bet {
  home: number;          // used for exact-score bets
  away: number;
  kind?: BetKind;        // 'score' (default) or 'winner'
  pick?: Outcome;        // 'H' | 'D' | 'A' for winner-only bets
  at?: string;
}

// A real (admin/API) result. Penalties are only meaningful for a knockout tie
// that is level after 90' — they decide who advances, not the bet points.
export interface MatchResult {
  home: number;
  away: number;
  homePens?: number;
  awayPens?: number;
}

export type View = 'auth' | 'playerSelect' | 'dashboard' | 'matches' | 'mybets' | 'bracket' | 'leaderboard' | 'profile';

export interface AppState {
  users: User[];
  currentUser: User | null;
  bets: Record<string, Record<string, Bet>>;
  matchResults: Record<string, MatchResult>;
  view: View;
  showAdmin: boolean;
}

export function defaultState(): AppState {
  // Only a single demo account exists for the local "Acceso demo rápido"
  // button — no fabricated competitors. Real players come from sign-up (and,
  // in cloud mode, from Supabase). The leaderboard therefore shows only people
  // who are actually registered.
  const users: User[] = [
    { id: 'demo', username: 'Demo', email: 'demo@polla.com', password: 'demo123', playerId: 'bellingham', poolJoined: true, createdAt: '2026-06-09' },
    // Super user (admin). Email must stay in ADMIN_EMAILS to keep admin rights.
    { id: 'super', username: 'Andrés', email: 'apedrazacespedes@gmail.com', password: 'AdminPolla2026!', playerId: 'james', poolJoined: true, createdAt: '2026-06-09' },
  ];

  return { users, currentUser: null, bets: {}, matchResults: {}, view: 'auth', showAdmin: false };
}

const STORAGE_KEY = 'pollaWC2026_v4';

export function loadState(): AppState {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as AppState;
  } catch {
    /* ignore */
  }
  return defaultState();
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Cloud-mode redundancy cache ───────────────────────────────────────────
// In cloud mode Supabase is the source of truth, but we ALSO mirror the shared
// data (bets/results/users) to localStorage. This is what makes a player's
// entered score survive a page refresh and a momentary cloud read failure: on
// boot we hydrate instantly from this cache, then reconcile with the cloud.
// Nothing here ever deletes data — it only adds a local backup layer.
const CLOUD_CACHE_KEY = 'pollaWC2026_cloudcache_v1';

export interface CloudCache {
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matchResults: Record<string, MatchResult>;
}

export function loadCloudCache(): CloudCache {
  try {
    const s = localStorage.getItem(CLOUD_CACHE_KEY);
    if (s) return JSON.parse(s) as CloudCache;
  } catch {
    /* ignore */
  }
  return { users: [], bets: {}, matchResults: {} };
}

export function saveCloudCache(c: CloudCache): void {
  try {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}
