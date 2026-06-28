import { useState, useEffect, useMemo, useCallback } from 'react';
import { pointsFor, type Match, type BetKind, type Outcome } from './lib/data';
import { fetchMatches } from './lib/api';
import { resolveKnockout } from './lib/bracket';
import { loadState, saveState, loadCloudCache, saveCloudCache, isAdmin, type AppState, type User, type View } from './lib/state';
import { supabaseEnabled } from './lib/supabase';
import {
  cloudSignIn, cloudSignUp, cloudSignOut, cloudCurrentUser, cloudLoadAll, reconcileCloud,
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
  // In cloud mode, Supabase is the source of truth — but we seed from the local
  // redundancy cache so the player instantly sees their last-known bets/results
  // on load (then the cloud read reconciles). In local mode, use the bundled
  // demo state from localStorage.
  const [state, setState] = useState<AppState>(() => {
    if (!supabaseEnabled) return loadState();
    const cache = loadCloudCache();
    return { users: cache.users, currentUser: null, bets: cache.bets, matchResults: cache.matchResults, view: 'auth', showAdmin: false };
  });
  const [showIntro, setShowIntro] = useState(true);
  const [baseMatches, setBaseMatches] = useState<Match[]>([]);
  const [dataSource, setDataSource] = useState<'live' | 'mock'>('mock');
  const [showTutorial, setShowTutorial] = useState(false);
  const [pendingTutorial, setPendingTutorial] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [celebratePoints, setCelebratePoints] = useState<number | null>(null);
  // Surfaced when a cloud bet write fails, so it's never silent again.
  const [betError, setBetError] = useState<string | null>(null);

  // Load match data (live API with mock fallback)
  useEffect(() => {
    const ctrl = new AbortController();
    fetchMatches(ctrl.signal).then(res => {
      setBaseMatches(res.matches);
      setDataSource(res.source);
    });
    return () => ctrl.abort();
  }, []);

  // Pull the shared cloud data and reconcile it into state. reconcileCloud
  // guarantees a failed read never blanks a slice and a just-placed bet is never
  // dropped. See cloud.ts (unit-tested). Stable identity so the listeners below
  // can all share it.
  const syncFromCloud = useCallback(async () => {
    if (!supabaseEnabled) return;
    const data = await cloudLoadAll();
    setState(p => ({ ...p, ...reconcileCloud(p, data, p.currentUser?.id) }));
  }, []);

  // Cloud mode: restore the logged-in user, load shared data, and keep every
  // device in sync via Realtime.
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    (async () => {
      const u = await cloudCurrentUser();
      if (active && u) setState(p => ({ ...p, currentUser: u, view: u.playerId ? 'dashboard' : 'playerSelect' }));
      await syncFromCloud();
    })();
    const unsub = cloudSubscribe(() => { void syncFromCloud(); });
    return () => { active = false; unsub(); };
  }, [syncFromCloud]);

  // Re-sync whenever the device regains connectivity or the tab is refocused.
  // Supabase Realtime reconnects on its own, but this closes the gap so a player
  // who lost the socket (sleep, tunnel, flaky mobile) never sees stale or missing
  // data once they're back — the freshest cloud state is pulled immediately.
  useEffect(() => {
    if (!supabaseEnabled) return;
    const onOnline = () => { void syncFromCloud(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void syncFromCloud(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncFromCloud]);

  // Auto-sync results every 5 minutes while admin has the app open.
  // More reliable than GitHub Actions cron for free tier repos.
  useEffect(() => {
    if (!supabaseEnabled || !state.currentUser || !isAdmin(state.currentUser)) return;
    const run = () => fetch('/api/sync-results').catch(() => {});
    run();
    const id = setInterval(run, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [state.currentUser]);

  // Open the "set new password" screen when the user arrives from a recovery email.
  useEffect(() => {
    if (!supabaseEnabled) return;
    return cloudOnPasswordRecovery(() => { setShowIntro(false); setRecovery(true); });
  }, []);

  // Persist on change. Local mode: the whole app state. Cloud mode: a redundancy
  // cache of the shared data, so bets/results survive a refresh or a momentary
  // cloud read failure and show instantly on next load.
  useEffect(() => {
    if (supabaseEnabled) saveCloudCache({ users: state.users, bets: state.bets, matchResults: state.matchResults });
    else saveState(state);
  }, [state]);

  // Merge admin/cloud result overrides into the match list, then resolve the
  // knockout bracket: group winners/runners-up + best thirds fill the Round of 32,
  // and every tie's winner propagates up to the final — automatically, as results
  // arrive. Pure; nothing is fabricated (unknown slots stay "Por definir").
  const matches = useMemo(() => {
    const merged = baseMatches.map(m => {
      const r = state.matchResults[m.id];
      return r ? { ...m, homeScore: r.home, awayScore: r.away, homePens: r.homePens, awayPens: r.awayPens, status: 'finished' as const } : m;
    });
    return resolveKnockout(merged);
  }, [baseMatches, state.matchResults]);

  // Signature of the current knockout matchups — changes only when group results
  // decide (or live results advance) a tie. Drives the auto-sync below so we push
  // the cloud fixture again exactly when the bracket moves, not on every render.
  const knockoutSig = useMemo(
    () => matches.filter(m => m.stage).map(m => `${m.id}:${m.home}/${m.away}`).join('|'),
    [matches],
  );

  // Auto-sync the fixture to the cloud whenever a super user is present and the
  // knockout matchups change. This keeps the server-side betting lock current AND
  // lets /api/sync-results map live knockout games — which the API reports under
  // real team names — onto our stable slot ids by team pair, so 16vos → octavos →
  // cuartos → semis → final all track automatically.
  useEffect(() => {
    if (!supabaseEnabled || matches.length === 0) return;
    if (!state.currentUser || !isAdmin(state.currentUser)) return;
    cloudSyncMatches(matches).then(r => {
      if (r.error) console.warn('[cloud] auto-sync de partidos falló:', r.error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentUser, knockoutSig]);

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

  const placeBet = async (matchId: string, payload: { home: number; away: number; kind: BetKind; pick?: Outcome }) => {
    const uid = state.currentUser!.id;
    const bet = { ...payload, at: new Date().toISOString() };
    const prev = state.bets[uid]?.[matchId];
    // Optimistic: show it immediately…
    setState(p => ({
      ...p,
      bets: { ...p.bets, [uid]: { ...(p.bets[uid] || {}), [matchId]: bet } },
    }));
    if (!supabaseEnabled) return;
    // …then confirm it actually persisted. If not, roll back and say why, so a
    // bet that didn't reach the database never looks like it was saved.
    const { error } = await cloudPlaceBet(uid, matchId, bet);
    if (error) {
      setState(p => {
        const ub = { ...(p.bets[uid] || {}) };
        if (prev) ub[matchId] = prev; else delete ub[matchId];
        return { ...p, bets: { ...p.bets, [uid]: ub } };
      });
      setBetError(error);
    } else {
      setBetError(null);
    }
  };

  const updateResult = (matchId: string, home: number, away: number, homePens?: number, awayPens?: number) => {
    if (supabaseEnabled) cloudUpdateResult(matchId, home, away, homePens, awayPens);
    setState(p => ({ ...p, matchResults: { ...p.matchResults, [matchId]: { home, away, homePens, awayPens } } }));
  };

  const logout = () => {
    if (supabaseEnabled) cloudSignOut();
    setState(p => ({ ...p, currentUser: null, view: 'auth', showAdmin: false }));
  };
  const go = (view: View) => setState(p => ({ ...p, view }));

  // Download a full JSON backup of all players, bets and results (admin only).
  // A manual safety net on top of Supabase's own backups — never deletes data.
  const exportBackup = () => {
    const dump = {
      app: 'polla-mundialista-2026',
      exportedAt: new Date().toISOString(),
      users: state.users,
      bets: state.bets,
      matchResults: state.matchResults,
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polla-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
  // Admin panel is gated to super users only — never trust a stale showAdmin flag.
  const admin = isAdmin(currentUser);
  if (showAdmin && admin) return (
    <AdminScreen
      matches={matches}
      onClose={() => setState(p => ({ ...p, showAdmin: false }))}
      onUpdateResult={updateResult}
      onSyncMatches={supabaseEnabled ? () => cloudSyncMatches(matches) : undefined}
      onExport={exportBackup}
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

      {betError && (
        <div onClick={() => setBetError(null)} style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
          maxWidth: 440, width: 'calc(100% - 24px)', cursor: 'pointer',
          background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.45)',
          borderRadius: 12, padding: '12px 16px', color: '#FCA5A5',
          fontFamily: "'Barlow',sans-serif", fontSize: 13, lineHeight: 1.4,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 700, color: '#EF4444', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, marginBottom: 2 }}>⚠️ TU APUESTA NO SE GUARDÓ</div>
          {betError}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Toca para cerrar</div>
        </div>
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
          isAdmin={admin}
          onShowAdmin={() => setState(p => ({ ...p, showAdmin: true }))}
        />
      )}
    </div>
  );
}
