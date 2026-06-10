// state.ts — App state shape, defaults, and localStorage persistence.

import { MATCHES } from './data';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  playerId: string | null;
  poolJoined: boolean;
  createdAt: string;
}

export interface Bet {
  home: number;
  away: number;
  at?: string;
}

export type View = 'auth' | 'playerSelect' | 'dashboard' | 'matches' | 'bracket' | 'leaderboard' | 'profile';

export interface AppState {
  users: User[];
  currentUser: User | null;
  bets: Record<string, Record<string, Bet>>;
  matchResults: Record<string, { home: number; away: number }>;
  view: View;
  showAdmin: boolean;
}

export function defaultState(): AppState {
  const users: User[] = [
    { id: 'u001', username: 'AndrésMesa', email: 'andres@demo.com', password: 'demo123', playerId: 'messi', poolJoined: true, createdAt: '2026-06-01' },
    { id: 'u002', username: 'CarlosRoa', email: 'carlos@demo.com', password: 'demo123', playerId: 'mbappe', poolJoined: true, createdAt: '2026-06-01' },
    { id: 'u003', username: 'LauraVega', email: 'laura@demo.com', password: 'demo123', playerId: 'pedri', poolJoined: true, createdAt: '2026-06-01' },
    { id: 'u004', username: 'DiegoSilva', email: 'diego@demo.com', password: 'demo123', playerId: 'vini', poolJoined: true, createdAt: '2026-06-02' },
    { id: 'u005', username: 'SofíaP', email: 'sofia@demo.com', password: 'demo123', playerId: 'haaland', poolJoined: true, createdAt: '2026-06-03' },
    { id: 'demo', username: 'Demo', email: 'demo@polla.com', password: 'demo123', playerId: 'bellingham', poolJoined: true, createdAt: '2026-06-09' },
  ];

  // Seed some demo bets on the earliest upcoming matches so the betting UI
  // is populated. Scores are predictions only — no real results exist yet.
  const SCORE_PATTERNS: Record<string, [number, number][]> = {
    u001: [[2, 1], [1, 0], [0, 1], [2, 0], [1, 1], [3, 1], [2, 2], [1, 0], [0, 0], [2, 1]],
    u002: [[1, 0], [2, 1], [1, 1], [1, 0], [0, 0], [2, 0], [1, 2], [2, 1], [3, 1]],
    u003: [[1, 1], [1, 0], [0, 2], [3, 0], [2, 1], [1, 0], [2, 0], [1, 1]],
    u004: [[2, 0], [0, 1], [1, 2], [2, 0], [1, 1], [3, 2], [0, 0]],
    u005: [[3, 1], [1, 1], [0, 1], [2, 1], [2, 0], [1, 0], [2, 2], [3, 0], [1, 1]],
    demo: [[2, 0], [1, 1], [0, 1], [1, 0], [2, 1]],
  };

  const bets: AppState['bets'] = {};
  for (const [uid, pattern] of Object.entries(SCORE_PATTERNS)) {
    const userBets: Record<string, Bet> = {};
    pattern.forEach(([home, away], i) => {
      const m = MATCHES[i];
      if (m) userBets[m.id] = { home, away };
    });
    bets[uid] = userBets;
  }

  return { users, currentUser: null, bets, matchResults: {}, view: 'auth', showAdmin: false };
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
