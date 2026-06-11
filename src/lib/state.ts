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

import type { BetKind, Outcome } from './data';

export interface Bet {
  home: number;          // used for exact-score bets
  away: number;
  kind?: BetKind;        // 'score' (default) or 'winner'
  pick?: Outcome;        // 'H' | 'D' | 'A' for winner-only bets
  at?: string;
}

export type View = 'auth' | 'playerSelect' | 'dashboard' | 'matches' | 'mybets' | 'bracket' | 'leaderboard' | 'profile';

export interface AppState {
  users: User[];
  currentUser: User | null;
  bets: Record<string, Record<string, Bet>>;
  matchResults: Record<string, { home: number; away: number }>;
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
