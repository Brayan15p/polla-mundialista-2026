import { useState, useEffect, useMemo } from 'react';
import { calculatePoints, type Match } from './lib/data';
import { fetchMatches } from './lib/api';
import { loadState, saveState, type AppState, type User, type View } from './lib/state';
import { IntroAnimation } from './components/Intro';
import { AuthScreen, type RegisterPayload } from './components/Auth';
import { PlayerSelectScreen } from './components/PlayerSelect';
import { BgLayer, NavBar } from './components/Shared';
import { DashboardScreen } from './components/Dashboard';
import { MatchesScreen } from './components/Matches';
import { BracketScreen } from './components/Bracket';
import { LeaderboardScreen } from './components/Leaderboard';
import { ProfileScreen } from './components/Profile';
import { AdminScreen } from './components/Admin';

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [showIntro, setShowIntro] = useState(true);
  const [baseMatches, setBaseMatches] = useState<Match[]>([]);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');

  // Load match data (live API with mock fallback)
  useEffect(() => {
    const ctrl = new AbortController();
    fetchMatches(ctrl.signal).then(res => {
      setBaseMatches(res.matches);
      setDataSource(res.source);
    });
    return () => ctrl.abort();
  }, []);

  // Persist on change
  useEffect(() => { saveState(state); }, [state]);

  // Merge admin result overrides into match list
  const matches = useMemo(() => baseMatches.map(m => {
    const r = state.matchResults[m.id];
    return r ? { ...m, homeScore: r.home, awayScore: r.away, status: 'finished' as const } : m;
  }), [baseMatches, state.matchResults]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const introComplete = () => { setShowIntro(false); };

  const login = (email: string, password: string) => {
    const u = state.users.find(u => u.email === email && u.password === password);
    if (!u) { alert('Credenciales incorrectas. Prueba el acceso demo.'); return; }
    setState(p => ({ ...p, currentUser: u, view: 'dashboard' }));
  };

  const register = ({ username, email, password, joinPool }: RegisterPayload) => {
    if (state.users.find(u => u.email === email)) { alert('Este correo ya está registrado.'); return; }
    const nu: User = { id: 'u' + Date.now(), username, email, password, playerId: null, poolJoined: !!joinPool, createdAt: new Date().toISOString() };
    setState(p => ({ ...p, users: [...p.users, nu], currentUser: nu, view: 'playerSelect' }));
  };

  const selectPlayer = (playerId: string) => {
    setState(p => ({
      ...p,
      currentUser: p.currentUser ? { ...p.currentUser, playerId } : null,
      users: p.users.map(u => (u.id === p.currentUser?.id ? { ...u, playerId } : u)),
      view: 'dashboard',
    }));
  };

  const placeBet = (matchId: string, home: number, away: number) => {
    const uid = state.currentUser!.id;
    setState(p => ({
      ...p,
      bets: { ...p.bets, [uid]: { ...(p.bets[uid] || {}), [matchId]: { home, away, at: new Date().toISOString() } } },
    }));
  };

  const updateResult = (matchId: string, home: number, away: number) => {
    setState(p => ({ ...p, matchResults: { ...p.matchResults, [matchId]: { home, away } } }));
  };

  const logout = () => setState(p => ({ ...p, currentUser: null, view: 'auth', showAdmin: false }));
  const go = (view: View) => setState(p => ({ ...p, view }));

  // Compute current user's live point total
  const userTotalPoints = useMemo(() => {
    if (!state.currentUser) return 0;
    const ub = state.bets[state.currentUser.id] || {};
    return matches.reduce((s, m) => {
      if (m.status !== 'finished') return s;
      const b = ub[m.id]; if (!b) return s;
      return s + calculatePoints(b.home, b.away, m.homeScore!, m.awayScore!);
    }, 0);
  }, [state.currentUser, state.bets, matches]);

  // ── Render ───────────────────────────────────────────────────────────
  if (showIntro) return <IntroAnimation onComplete={introComplete} />;

  const { currentUser, users, bets, view, showAdmin } = state;

  if (!currentUser) return <AuthScreen onLogin={login} onRegister={register} />;
  if (!currentUser.playerId) return <PlayerSelectScreen onSelect={selectPlayer} />;
  if (showAdmin) return <AdminScreen matches={matches} onClose={() => setState(p => ({ ...p, showAdmin: false }))} onUpdateResult={updateResult} />;

  return (
    <div style={{ background: '#050508', minHeight: '100vh' }}>
      <BgLayer />
      <NavBar user={currentUser} view={view} onNavigate={go} onLogout={logout} userPoints={userTotalPoints} />

      {dataSource === 'live' && (
        <div style={{ position: 'fixed', top: 70, right: 12, zIndex: 150, fontSize: 9, letterSpacing: 1, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>● DATOS EN VIVO</div>
      )}

      {view === 'dashboard' && <DashboardScreen user={currentUser} users={users} bets={bets} matches={matches} onNavigate={go} />}
      {view === 'matches' && <MatchesScreen user={currentUser} users={users} bets={bets} matches={matches} onBet={placeBet} />}
      {view === 'bracket' && <BracketScreen matches={matches} />}
      {view === 'leaderboard' && <LeaderboardScreen users={users} bets={bets} matches={matches} currentUser={currentUser} />}
      {view === 'profile' && (
        <ProfileScreen
          user={currentUser} users={users} bets={bets} matches={matches}
          onChangePlayer={selectPlayer} onLogout={logout}
          onShowAdmin={() => setState(p => ({ ...p, showAdmin: true }))}
        />
      )}
    </div>
  );
}
