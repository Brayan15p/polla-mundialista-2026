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

export interface Bet {
  home: number;
  away: number;
  at?: string;
}

export type View = 'auth' | 'playerSelect' | 'dashboard' | 'matches' | 'leaderboard' | 'profile';

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

  const bets: AppState['bets'] = {
    u001: {
      m001: { home: 2, away: 1 }, m002: { home: 0, away: 0 }, m003: { home: 0, away: 2 }, m004: { home: 2, away: 0 },
      m005: { home: 3, away: 0 }, m006: { home: 2, away: 0 }, m007: { home: 1, away: 0 }, m008: { home: 2, away: 1 },
      m009: { home: 2, away: 0 }, m010: { home: 0, away: 1 }, m011: { home: 3, away: 0 }, m012: { home: 1, away: 1 },
      m013: { home: 2, away: 0 }, m014: { home: 0, away: 0 },
    },
    u002: {
      m001: { home: 1, away: 0 }, m002: { home: 2, away: 0 }, m003: { home: 1, away: 1 }, m004: { home: 1, away: 0 },
      m005: { home: 2, away: 0 }, m006: { home: 1, away: 0 }, m007: { home: 2, away: 1 }, m008: { home: 1, away: 1 },
      m009: { home: 1, away: 0 }, m010: { home: 0, away: 1 }, m011: { home: 2, away: 0 }, m012: { home: 2, away: 2 },
      m013: { home: 3, away: 1 },
    },
    u003: {
      m001: { home: 1, away: 1 }, m002: { home: 1, away: 0 }, m003: { home: 0, away: 3 }, m004: { home: 3, away: 0 },
      m005: { home: 4, away: 1 }, m006: { home: 1, away: 0 }, m007: { home: 2, away: 0 }, m008: { home: 2, away: 0 },
      m009: { home: 1, away: 0 }, m011: { home: 2, away: 0 }, m013: { home: 2, away: 1 },
    },
    u004: {
      m001: { home: 2, away: 0 }, m002: { home: 0, away: 1 }, m003: { home: 1, away: 2 }, m004: { home: 2, away: 0 },
      m005: { home: 3, away: 2 }, m006: { home: 2, away: 0 }, m007: { home: 0, away: 0 }, m008: { home: 1, away: 1 },
      m011: { home: 3, away: 0 }, m012: { home: 1, away: 1 },
    },
    u005: {
      m001: { home: 3, away: 1 }, m002: { home: 1, away: 1 }, m003: { home: 0, away: 1 }, m004: { home: 2, away: 1 },
      m005: { home: 5, away: 0 }, m007: { home: 1, away: 0 }, m009: { home: 2, away: 0 }, m011: { home: 2, away: 0 },
      m012: { home: 2, away: 2 }, m013: { home: 3, away: 1 }, m014: { home: 1, away: 1 },
    },
    demo: {
      m001: { home: 2, away: 0 }, m002: { home: 1, away: 1 }, m003: { home: 0, away: 1 }, m004: { home: 3, away: 0 },
      m005: { home: 4, away: 1 },
    },
  };

  return { users, currentUser: null, bets, matchResults: {}, view: 'auth', showAdmin: false };
}

const STORAGE_KEY = 'pollaWC2026_v3';

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
