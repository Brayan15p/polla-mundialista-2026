import { useState, useEffect, useMemo } from 'react';
import { pointsFor, type Match, type BetKind, type Outcome } from './lib/data';
import { fetchMatches } from './lib/api';
import { loadState, saveState, type AppState, type User, type View } from './lib/state';
import { supabaseEnabled } from './lib/supabase';
import {
  cloudSignIn, cloudSignUp, cloudSignOut, cloudCurrentUser, cloudLoadAll,
  cloudSetPlayer, cloudPlaceBet, cloudUpdateResult, cloudSubscribe, cloudSyncMatches,
  cloudSendPasswordReset, cloudUpdatePassword, cloudOnPasswordRecovery,
} from './lib/cloud';
import { Tutorial } from './components/Tutorial';
import { Celebration } from './components/Celebration';
import { IntroAnimation } from './components/Intro';
import { AuthScreen, ResetPasswordScreen, type RegisterPayload } from './components/Auth';
import { PlayerSelectScreen } from './components/PlayerSelect';
import { BgLayer, NavBar } from './components/Shared';
import { DashboardScreen } from './components/Dashboard';
import { MatchesScreen } from './components/Matches';
import { MyBetsScreen } from './components/MyBets';
import { BracketScreen } from './components/Bracket';
import { LeaderboardScreen } from './components/Leaderboard';
import { ProfileScreen } from './components/Profile';
import { AdminScreen } from './components/Admin';

export default function App() {
  // In cloud mode, data comes from Supabase — start empty. In local mode, use
  // the bundled demo state from localStorage.
  const [state, setState] = useState<AppState>(() =>
    supabaseEnabled
      ? { users: [], currentUser: null, bets: {}, matchResults: {}, view: 'auth', showAdmin: false }
      : loadState(),
  );
  const [showIntro, setShowIntro] = useState(true);
  const [baseMatches, setBaseMatches] = useState<Match[]>([]);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingTutorial, setPendingTutorial] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [celebratePoints, setCelebratePoints] = useState<number | null>(null);

  // Load match data (live API with mock fallback)
  useEffect(() => {
    const ctrl = new AbortController();
    fetchMatches(ctrl.signal).then(res => {
      setBaseMatches(res.matches);
      setDataSource(res.source);
    });
    return () => ctrl.abort();
  }, []);

  // Cloud mode: restore the logged-in user, load shared data, and keep every
  // device in sync via Realtime.
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    const refresh = async () => {
      const data = await cloudLoadAll();
      if (active) setState(p => ({ ...p, users: data.users, bets: data.bets, matchResults: data.matchResults }));
    };
    (async () => {
      const u = await cloudCurrentUser();
      if (active && u) setState(p => ({ ...p, currentUser: u, view: u.playerId ? 'dashboard' : 'playerSelect' }));
      await refresh();
    })();
    const unsub = cloudSubscribe(refresh);
    return () => { active = false; unsub(); };
  }, []);

  // Open the "set new password" screen when the user arrives from a recovery email.
  useEffect(() => {
    if (!supabaseEnabled) return;
    return cloudOnPasswordRecovery(() => { setShowIntro(false); setRecovery(true); });
  }, []);

  // Persist on change (local mode only — cloud mode is the source of truth).
  useEffect(() => { if (!supabaseEnabled) saveState(state); }, [state]);

  // Merge admin result overrides into match list
  const matches = useMemo(() => baseMatches.map(m => {
    const r = state.matchResults[m.id];
    return r ? { ...m, homeScore: r.home, awayScore: r.away, status: 'finished' as const } : m;
  }), [baseMatches, state.matchResults]);

  // Celebrate when a result posts and the user's own bet won points (once each).
  useEffect(() => {
    const u = state.currentUser;
    if (!u) return;
    const key = `pollaCelebrated_${u.id}`;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(key) || '[]'); } catch { /* ignore */ }
    const ub = state.bets[u.id] || {};
    const newlyFinished = matches.filter(m => m.status === 'finished' && !seen.includes(m.id));
    if (newlyFinished.length === 0) return;
    // Only celebrate real placed bets that scored (not the 0–0 default).
    const wonPoints = newlyFinished.reduce((s, m) => s + (ub[m.id] ? pointsFor(ub[m.id], m) : 0), 0);
    localStorage.setItem(key, JSON.stringify([...seen, ...newlyFinished.map(m => m.id)]));
    if (wonPoints > 0) setCelebratePoints(wonPoints);
  }, [matches, state.bets, state.currentUser]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const introComplete = () => { setShowIntro(false); };

  // Turn raw auth errors into clear Spanish guidance.
  const friendlyError = (err?: string): string => {
    const e = (err || '').toLowerCase();
    if (/failed to fetch|networkerror|load failed|fetch event/.test(e))
      return 'No se pudo conectar con el servidor.\n\nRevisa:\n• Tu conexión a internet.\n• Que la URL de Supabase esté bien escrita (https://tu-proyecto.supabase.co, sin barra final ni espacios).\n• Que en Vercel hayas vuelto a desplegar (Redeploy) después de agregar las variables.';
    if (/invalid login credentials/.test(e)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/.test(e)) return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada (o desactiva la confirmación en Supabase).';
    if (/user already registered/.test(e)) return 'Ese correo ya está registrado. Inicia sesión.';
    return err || 'Ocurrió un error. Inténtalo de nuevo.';
  };

  const login = async (email: string, password: string) => {
    if (supabaseEnabled) {
      const res = await cloudSignIn(email, password);
      if (res.error || !res.user) { alert(friendlyError(res.error) || 'No se pudo iniciar sesión.'); return; }
      setState(p => ({ ...p, currentUser: res.user!, view: res.user!.playerId ? 'dashboard' : 'playerSelect' }));
      return;
    }
    const u = state.users.find(u => u.email === email && u.password === password);
    if (!u) { alert('Credenciales incorrectas. Prueba el acceso demo.'); return; }
    setState(p => ({ ...p, currentUser: u, view: 'dashboard' }));
  };

  const register = async ({ username, email, password, joinPool }: RegisterPayload) => {
    if (supabaseEnabled) {
      const res = await cloudSignUp(username, email, password, joinPool);
      if (res.error) { alert(friendlyError(res.error)); return; }
      if (res.needsConfirm) { alert('Te enviamos un correo para confirmar tu cuenta. Confírmalo y vuelve a iniciar sesión.'); return; }
      setPendingTutorial(true);
      setState(p => ({ ...p, currentUser: res.user!, view: 'playerSelect' }));
      return;
    }
    if (state.users.find(u => u.email === email)) { alert('Este correo ya está registrado.'); return; }
    const nu: User = { id: 'u' + Date.now(), username, email, password, playerId: null, poolJoined: !!joinPool, createdAt: new Date().toISOString() };
    setPendingTutorial(true);
    setState(p => ({ ...p, users: [...p.users, nu], currentUser: nu, view: 'playerSelect' }));
  };

  const selectPlayer = (playerId: string) => {
    if (supabaseEnabled && state.currentUser) cloudSetPlayer(state.currentUser.id, playerId);
    setState(p => ({
      ...p,
      currentUser: p.currentUser ? { ...p.currentUser, playerId } : null,
      users: p.users.map(u => (u.id === p.currentUser?.id ? { ...u, playerId } : u)),
      view: 'dashboard',
    }));
    // New players get a quick football-flavoured tutorial after picking a card.
    if (pendingTutorial) { setShowTutorial(true); setPendingTutorial(false); }
  };

  const placeBet = (matchId: string, payload: { home: number; away: number; kind: BetKind; pick?: Outcome }) => {
    const uid = state.currentUser!.id;
    const bet = { ...payload, at: new Date().toISOString() };
    if (supabaseEnabled) cloudPlaceBet(uid, matchId, bet);
    setState(p => ({
      ...p,
      bets: { ...p.bets, [uid]: { ...(p.bets[uid] || {}), [matchId]: bet } },
    }));
  };

  const updateResult = (matchId: string, home: number, away: number) => {
    if (supabaseEnabled) cloudUpdateResult(matchId, home, away);
    setState(p => ({ ...p, matchResults: { ...p.matchResults, [matchId]: { home, away } } }));
  };

  const logout = () => {
    if (supabaseEnabled) cloudSignOut();
    setState(p => ({ ...p, currentUser: null, view: 'auth', showAdmin: false }));
  };
  const go = (view: View) => setState(p => ({ ...p, view }));

  // Compute current user's live point total
  const userTotalPoints = useMemo(() => {
    if (!state.currentUser) return 0;
    const ub = state.bets[state.currentUser.id] || {};
    // 0–0 default applies: every finished match counts, even with no bet.
    return matches.reduce((s, m) => s + pointsFor(ub[m.id], m), 0);
  }, [state.currentUser, state.bets, matches]);

  // Save the new password chosen from the recovery email, then log straight in.
  const submitNewPassword = async (newPassword: string): Promise<{ error?: string }> => {
    const res = await cloudUpdatePassword(newPassword);
    if (res.error) return res;
    const u = await cloudCurrentUser();
    setRecovery(false);
    if (u) setState(p => ({ ...p, currentUser: u, view: u.playerId ? 'dashboard' : 'playerSelect' }));
    return {};
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (showIntro) return <IntroAnimation onComplete={introComplete} />;
  if (recovery) return <ResetPasswordScreen onSubmit={submitNewPassword} />;

  const { currentUser, users, bets, view, showAdmin } = state;

  if (!currentUser) return <AuthScreen onLogin={login} onRegister={register} onForgotPassword={supabaseEnabled ? cloudSendPasswordReset : undefined} />;
  if (!currentUser.playerId) return <PlayerSelectScreen onSelect={selectPlayer} />;
  if (showAdmin) return (
    <AdminScreen
      matches={matches}
      onClose={() => setState(p => ({ ...p, showAdmin: false }))}
      onUpdateResult={updateResult}
      onSyncMatches={supabaseEnabled ? () => cloudSyncMatches(matches) : undefined}
    />
  );

  return (
    <div style={{ background: '#050508', minHeight: '100vh' }}>
      <BgLayer />
      {showTutorial && <Tutorial user={currentUser} onClose={() => setShowTutorial(false)} />}
      {celebratePoints !== null && <Celebration points={celebratePoints} onDone={() => setCelebratePoints(null)} />}
      <NavBar user={currentUser} view={view} onNavigate={go} onLogout={logout} userPoints={userTotalPoints} />

      {dataSource === 'live' && (
        <div style={{ position: 'fixed', top: 70, right: 12, zIndex: 150, fontSize: 9, letterSpacing: 1, color: '#22C55E', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, padding: '2px 8px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>● DATOS EN VIVO</div>
      )}

      {view === 'dashboard' && <DashboardScreen user={currentUser} users={users} bets={bets} matches={matches} onNavigate={go} />}
      {view === 'matches' && <MatchesScreen user={currentUser} users={users} bets={bets} matches={matches} onBet={placeBet} />}
      {view === 'mybets' && <MyBetsScreen user={currentUser} users={users} bets={bets} matches={matches} onBet={placeBet} />}
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
