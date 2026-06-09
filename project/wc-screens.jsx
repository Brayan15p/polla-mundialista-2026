// wc-screens.jsx v2 — Premium FIFA Visual Overhaul

// ─── GLOBAL BG LAYER ─────────────────────────────────────────────────────────
function BgLayer() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Hex grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V17L28 0l28 17v33L28 66zm0-2l26-15V19L28 2 2 19v30L28 64z' fill='%23C9A62C' fill-opacity='0.028'/%3E%3C/svg%3E")`,
        backgroundSize: '56px 100px',
      }} />
      {/* Radial gold top glow */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '90vw', height: '60vw', background: 'radial-gradient(ellipse, rgba(201,166,44,0.09) 0%, transparent 65%)', borderRadius: '50%' }} />
      {/* Trophy watermark bottom-right */}
      <div style={{
        position: 'absolute', bottom: '-4%', right: '-4%', width: '35vw', maxWidth: 280,
        backgroundImage: "url('uploads/pasted-1781013290237-0.png')",
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        aspectRatio: '3/4', opacity: 0.032, filter: 'grayscale(1)',
      }} />
    </div>
  );
}

// ─── AVATAR BUBBLE ────────────────────────────────────────────────────────────
function AvatarBubble({ player, size = 40 }) {
  if (!player) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,215,0,0.35)', flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: `linear-gradient(135deg, ${player.kitA}, ${player.kitB || '#fff'})`,
      border: `${size > 50 ? 3 : 2}px solid #FFD700`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      boxShadow: `0 0 ${size * 0.4}px ${player.kitA}55`,
    }}>
      <svg viewBox="0 0 60 90" width={size * 0.65} height={size * 0.85} fill="none">
        <g fill={player.tier === 'legend' || player.tier === 'gold' ? '#FFD700' : 'rgba(255,255,255,0.9)'}
          dangerouslySetInnerHTML={{ __html: player.silhouette || `<circle cx="30" cy="12" r="9"/><rect x="17" y="23" width="26" height="26" rx="4"/><rect x="13" y="47" width="12" height="26" rx="3"/><rect x="35" y="47" width="12" height="26" rx="3"/>` }} />
      </svg>
    </div>
  );
}

// ─── FLAG BADGE ───────────────────────────────────────────────────────────────
function FlagBadge({ country, size = 52 }) {
  const { FLAGS } = window.WC_DATA;
  return (
    <div style={{
      width: size + 12, height: size + 12, borderRadius: 14,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size, lineHeight: 1,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      {FLAGS[country] || '🏴'}
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function NavBar({ user, view, onNavigate, onLogout, userPoints }) {
  const { PLAYERS } = window.WC_DATA;
  const player = PLAYERS.find(p => p.id === user?.playerId);
  const navItems = [
    { key: 'dashboard',   label: 'INICIO',   icon: '⚽' },
    { key: 'matches',     label: 'PARTIDOS', icon: '📅' },
    { key: 'leaderboard', label: 'TABLA',    icon: '🏆' },
    { key: 'profile',     label: 'PERFIL',   icon: '👤' },
  ];
  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 66,
        background: 'rgba(3,3,8,0.96)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="uploads/pasted-1781013290237-0.png" alt="" style={{ width: 32, filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />
          <div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 17, letterSpacing: 2, lineHeight: 1 }}>
              <span style={{ color: '#FFD700' }}>POLLA</span>
              <span style={{ color: '#fff' }}> MUNDIALISTA</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontFamily: "'Barlow Condensed',sans-serif" }}>FIFA WORLD CUP 2026™</div>
          </div>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Barlow',sans-serif", lineHeight: 1 }}>{user.username}</div>
              <div style={{ fontSize: 11, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>
                <span style={{ color: '#FFD700', fontWeight: 700 }}>{userPoints ?? 0}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}> PTS</span>
              </div>
            </div>
            <AvatarBubble player={player} size={40} />
            <button onClick={onLogout} title="Salir" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 18, cursor: 'pointer', lineHeight: 1, marginLeft: 2 }}>⏻</button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(3,3,8,0.98)', backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,215,0,0.1)',
        display: 'flex', paddingBottom: 'max(6px,env(safe-area-inset-bottom))',
      }}>
        {navItems.map(item => {
          const active = view === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)} style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '9px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? '#FFD700' : 'rgba(255,255,255,0.3)',
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 9,
              letterSpacing: 1, transition: 'color 0.2s', position: 'relative',
            }}>
              {active && (
                <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: 'linear-gradient(90deg,transparent,#FFD700,transparent)', borderRadius: 2 }} />
              )}
              <span style={{ fontSize: 22, lineHeight: 1, filter: active ? 'drop-shadow(0 0 6px rgba(255,215,0,0.7))' : 'none' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── LIVE MATCH CARD ──────────────────────────────────────────────────────────
function LiveCard({ match, bet }) {
  const { FLAGS } = window.WC_DATA;
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.05))',
      border: '1px solid rgba(239,68,68,0.4)', borderRadius: 18, padding: '18px 20px', marginBottom: 12,
      boxShadow: '0 0 30px rgba(239,68,68,0.12)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'wc-livePulse 1s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#EF4444', letterSpacing: 3 }}>EN VIVO · {match.minute}'</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <FlagBadge country={match.home} size={48} />
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8 }}>{match.home}</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 100 }}>
          <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 50, color: '#fff', lineHeight: 1, letterSpacing: 2 }}>
            {match.homeScore}<span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 4px' }}>–</span>{match.awayScore}
          </div>
          {bet && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif", marginTop: 6 }}>Tu apuesta: {bet.home}–{bet.away}</div>}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <FlagBadge country={match.away} size={48} />
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8 }}>{match.away}</div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardScreen({ user, users, bets, matches, onNavigate }) {
  const { PLAYERS, FLAGS, calculatePoints } = window.WC_DATA;
  const player = PLAYERS.find(p => p.id === user.playerId);
  const userBets = bets[user.id] || {};

  const totalPoints = matches.reduce((s, m) => {
    if (m.status !== 'finished') return s;
    const b = userBets[m.id]; if (!b) return s;
    return s + calculatePoints(b.home, b.away, m.homeScore, m.awayScore);
  }, 0);

  const poolAmount = users.filter(u => u.poolJoined).length * 100000;

  const allRanks = [...users].map(u => {
    const ub = bets[u.id] || {};
    return matches.reduce((s, m) => {
      if (m.status !== 'finished') return s;
      const b = ub[m.id]; if (!b) return s;
      return s + calculatePoints(b.home, b.away, m.homeScore, m.awayScore);
    }, 0);
  }).sort((a, b) => b - a);
  const rank = allRanks.findIndex(p => p <= totalPoints) + 1;

  const live     = matches.filter(m => m.status === 'live');
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const pending  = upcoming.filter(m => !userBets[m.id]);
  const recent   = matches.filter(m => m.status === 'finished').slice(-5).reverse();

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 };

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      {/* Hero user card */}
      <div style={{
        ...card, padding: 20, marginBottom: 14,
        background: player ? `linear-gradient(135deg,${player.kitA}18,rgba(5,5,8,0))` : card.background,
        border: player ? `1px solid ${player.kitA}44` : card.border,
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: player ? `0 8px 40px ${player.kitA}22` : 'none',
      }}>
        <AvatarBubble player={player} size={76} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 24, color: '#fff', letterSpacing: 1, lineHeight: 1 }}>{user.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 3, fontFamily: "'Barlow',sans-serif" }}>
            {player ? `${window.WC_DATA.FLAGS[player.country] || ''} ${player.fullName}` : 'Sin jugador'}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif", background: 'rgba(255,255,255,0.07)', padding: '3px 8px', borderRadius: 4 }}>#{rank} EN TABLA</span>
            {user.poolJoined && <span style={{ fontSize: 10, color: '#FFD700', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif", background: 'rgba(255,215,0,0.1)', padding: '3px 8px', borderRadius: 4 }}>🏆 EN BOLSA</span>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 52, lineHeight: 1, background: 'linear-gradient(180deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{totalPoints}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif" }}>PUNTOS</div>
        </div>
      </div>

      {/* Pool card */}
      <div style={{
        ...card, padding: '18px 20px', marginBottom: 14,
        background: 'linear-gradient(135deg,rgba(201,166,44,0.12),rgba(201,166,44,0.04))',
        border: '1px solid rgba(255,215,0,0.3)',
        display: 'flex', alignItems: 'center', gap: 16,
        animation: 'wc-cardGlow 3.5s ease-in-out infinite',
        boxShadow: '0 0 0 rgba(255,215,0,0)',
      }}>
        <img src="uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 56, filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.7))', animation: 'wc-float 4s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>BOLSA GENERAL</div>
          <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 34, lineHeight: 1.1, background: 'linear-gradient(90deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ${poolAmount.toLocaleString('es-CO')} <span style={{ fontSize: 18 }}>COP</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: "'Barlow',sans-serif" }}>
            {users.filter(u => u.poolJoined).length} participantes · El ganador se lleva TODO
          </div>
        </div>
      </div>

      {/* Live */}
      {live.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'wc-livePulse 1s ease-in-out infinite', boxShadow: '0 0 8px #EF4444' }} />
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 3, color: '#EF4444' }}>PARTIDOS EN VIVO</span>
          </div>
          {live.map(m => <LiveCard key={m.id} match={m} bet={userBets[m.id]} />)}
        </div>
      )}

      {/* CTA */}
      <button onClick={() => onNavigate('matches')} style={{
        width: '100%', padding: '18px', marginBottom: 16,
        background: pending.length > 0 ? 'linear-gradient(135deg,#FFE566,#C9A62C)' : 'rgba(255,255,255,0.06)',
        border: 'none', borderRadius: 14,
        color: pending.length > 0 ? '#000' : 'rgba(255,255,255,0.3)',
        fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: 3, cursor: 'pointer',
        boxShadow: pending.length > 0 ? '0 6px 30px rgba(201,166,44,0.45)' : 'none',
        animation: pending.length > 0 ? 'wc-cardGlow 2s ease-in-out infinite' : 'none',
        transition: 'all 0.25s',
      }}>
        {pending.length > 0 ? `⚽ HACER APUESTAS · ${pending.length} PENDIENTES` : '📋 VER TODOS LOS PARTIDOS'}
      </button>

      {/* World Cup groups reference */}
      <div onClick={() => onNavigate('matches')} style={{
        ...card, padding: 0, marginBottom: 14, overflow: 'hidden', cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <img src="uploads/WC-6.jpg" alt="Grupos FIFA 2026" style={{ width: '100%', display: 'block', opacity: 0.88, borderRadius: 17 }} />
      </div>

      {/* Recent results */}
      {recent.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>ÚLTIMOS RESULTADOS</div>
          {recent.map(m => {
            const bet = userBets[m.id];
            const pts = bet ? calculatePoints(bet.home, bet.away, m.homeScore, m.awayScore) : null;
            const ptC = pts === 3 ? '#22C55E' : pts === 1 ? '#FFD700' : '#4B5563';
            const { FLAGS } = window.WC_DATA;
            return (
              <div key={m.id} style={{
                ...card, padding: '12px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12,
                border: pts === 3 ? '1px solid rgba(34,197,94,0.25)' : card.border,
                background: pts === 3 ? 'rgba(34,197,94,0.06)' : card.background,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 26 }}>{FLAGS[m.home]}</span>
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff' }}>
                      {m.home} <span style={{ color: '#FFD700' }}>{m.homeScore}–{m.awayScore}</span> {m.away}
                    </div>
                    {bet
                      ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif" }}>Tu apuesta: {bet.home}–{bet.away}</div>
                      : <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', fontFamily: "'Barlow',sans-serif" }}>Sin apuesta</div>}
                  </div>
                  <span style={{ fontSize: 26 }}>{FLAGS[m.away]}</span>
                </div>
                {pts !== null && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, color: ptC, lineHeight: 1 }}>+{pts}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>PTS</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MATCH BET CARD ───────────────────────────────────────────────────────────
function MatchBetCard({ match, bet, canBetNow, onBet }) {
  const { FLAGS, GROUPS, calculatePoints } = window.WC_DATA;
  const [homeVal, setHomeVal] = React.useState(bet != null ? String(bet.home) : '');
  const [awayVal, setAwayVal] = React.useState(bet != null ? String(bet.away) : '');
  const [editing, setEditing] = React.useState(!bet && match.status === 'upcoming' && canBetNow);
  const [saved, setSaved]     = React.useState(false);

  React.useEffect(() => {
    if (bet != null) { setHomeVal(String(bet.home)); setAwayVal(String(bet.away)); }
  }, [bet]);

  const groupColor = GROUPS[match.group]?.color || '#FFD700';
  const isLive = match.status === 'live';
  const isDone = match.status === 'finished';

  const save = () => {
    const h = parseInt(homeVal), a = parseInt(awayVal);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onBet(h, a); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const pts = isDone && bet != null ? calculatePoints(bet.home, bet.away, match.homeScore, match.awayScore) : null;
  const ptsColor = pts === 3 ? '#22C55E' : pts === 1 ? '#FFD700' : '#6B7280';

  const numInp = {
    width: 56, height: 56, textAlign: 'center', fontSize: 28,
    background: 'rgba(255,255,255,0.08)', border: `1.5px solid ${groupColor}66`,
    borderRadius: 10, color: '#FFD700', fontFamily: "'Anton',sans-serif", outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      background: isLive ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.035)',
      border: isLive ? '1px solid rgba(239,68,68,0.35)' : bet ? '1px solid rgba(255,215,0,0.15)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, marginBottom: 12, overflow: 'hidden',
      boxShadow: isLive ? '0 0 24px rgba(239,68,68,0.1)' : 'none',
    }}>
      {/* Color bar top */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${groupColor},${groupColor}55,transparent)` }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header: group + venue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, color: groupColor, padding: '3px 9px', border: `1px solid ${groupColor}55`, borderRadius: 5 }}>GRUPO {match.group}</span>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#EF4444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'wc-livePulse 1s infinite' }} />{match.minute}'
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: "'Barlow',sans-serif", textAlign: 'right', maxWidth: 160, lineHeight: 1.3 }}>
            {match.date.split('T')[1]?.slice(0,5) || ''} · {match.venue}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Home */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.home} size={52} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>{match.home}</div>
          </div>

          {/* Score / Input / VS */}
          <div style={{ textAlign: 'center', minWidth: 120, flexShrink: 0 }}>
            {match.status !== 'upcoming' ? (
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 44, color: '#fff', lineHeight: 1, letterSpacing: 2 }}>
                {match.homeScore}
                <span style={{ color: 'rgba(255,255,255,0.22)', margin: '0 6px', fontSize: 32 }}>–</span>
                {match.awayScore}
              </div>
            ) : editing && canBetNow ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <input type="number" min="0" max="20" value={homeVal} onChange={e => setHomeVal(e.target.value)} style={numInp} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'Anton',sans-serif", fontSize: 26 }}>–</span>
                <input type="number" min="0" max="20" value={awayVal} onChange={e => setAwayVal(e.target.value)} style={numInp} />
              </div>
            ) : bet != null ? (
              <div>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 34, color: '#FFD700', letterSpacing: 2 }}>{bet.home}–{bet.away}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif", marginTop: 2 }}>TU APUESTA</div>
              </div>
            ) : (
              <div style={{ padding: '12px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 26, color: 'rgba(255,255,255,0.18)', letterSpacing: 3 }}>VS</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: "'Barlow',sans-serif", marginTop: 2 }}>sin apostar</div>
              </div>
            )}
          </div>

          {/* Away */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.away} size={52} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>{match.away}</div>
          </div>
        </div>

        {/* Action area */}
        {match.status === 'upcoming' && (
          <div style={{ marginTop: 14 }}>
            {canBetNow ? (
              editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={save} style={{
                    flex: 1, padding: '13px',
                    background: saved ? 'linear-gradient(135deg,#16a34a,#22C55E)' : 'linear-gradient(135deg,#FFE566,#C9A62C)',
                    border: 'none', borderRadius: 10, color: '#000',
                    fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: 2, cursor: 'pointer',
                    transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(201,166,44,0.4)',
                  }}>
                    {saved ? '✓ APUESTA GUARDADA' : bet != null ? 'ACTUALIZAR APUESTA' : '⚽ APOSTAR'}
                  </button>
                  {bet != null && (
                    <button onClick={() => setEditing(false)} style={{ padding: '13px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  )}
                </div>
              ) : (
                <button onClick={() => setEditing(true)} style={{
                  width: '100%', padding: '12px',
                  background: `rgba(${groupColor === '#FFD700' ? '255,215,0' : '255,255,255'},0.07)`,
                  border: `1px solid ${groupColor}44`, borderRadius: 10, color: groupColor,
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
                }}>
                  {bet != null ? '✏️ MODIFICAR APUESTA' : '+ PONER APUESTA · $3.000 COP'}
                </button>
              )
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.22)', fontFamily: "'Barlow',sans-serif", padding: '8px 0' }}>
                🔒 Cierre de apuestas — falta menos de 5 min
              </div>
            )}
          </div>
        )}

        {/* Points result */}
        {pts !== null && (
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 10,
            background: `rgba(${pts === 3 ? '34,197,94' : pts === 1 ? '255,215,0' : '107,114,128'},0.1)`,
            border: `1px solid rgba(${pts === 3 ? '34,197,94' : pts === 1 ? '255,215,0' : '107,114,128'},0.2)`,
          }}>
            <div>
              <div style={{ fontSize: 13, color: ptsColor, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                {pts === 3 ? '🎯 ¡Marcador exacto!' : pts === 1 ? '✅ Acertaste el ganador' : '❌ Sin puntos'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Tu apuesta: {bet.home}–{bet.away} · Real: {match.homeScore}–{match.awayScore}
              </div>
            </div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 32, color: ptsColor, lineHeight: 1 }}>+{pts}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATCHES SCREEN ───────────────────────────────────────────────────────────
function MatchesScreen({ user, bets, matches, onBet }) {
  const { FLAGS, GROUPS, canBet, fmtDate } = window.WC_DATA;
  const [activeGroup, setActiveGroup] = React.useState('all');
  const userBets = bets[user.id] || {};

  const filtered = activeGroup === 'all' ? matches : matches.filter(m => m.group === activeGroup);
  const byDay = filtered.reduce((acc, m) => {
    const day = m.date.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(m); return acc;
  }, {});

  const tabs = [{ key: 'all', label: 'TODOS', color: '#FFD700' }, ...Object.entries(GROUPS).map(([k, v]) => ({ key: k, label: k, color: v.color }))];

  return (
    <div style={{ padding: '82px 0 100px', position: 'relative', zIndex: 1 }}>
      {/* Group tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '0 16px 12px', scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(g => (
          <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 20, border: 'none',
            background: activeGroup === g.key ? g.color : 'rgba(255,255,255,0.07)',
            color: activeGroup === g.key && g.key !== 'all' ? '#fff' : activeGroup === g.key ? '#000' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12,
            letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: activeGroup === g.key ? 900 : 700,
          }}>{g.key === 'all' ? 'TODOS' : `GRP ${g.label}`}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 0', maxWidth: 600, margin: '0 auto' }}>
        {Object.entries(byDay).map(([day, dayMatches]) => (
          <div key={day} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                {fmtDate(day + 'T12:00')}
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            {dayMatches.map(m => (
              <MatchBetCard key={m.id} match={m} bet={userBets[m.id]}
                canBetNow={canBet(m.date, m.status)}
                onBet={(h, a) => onBet(m.id, h, a)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardScreen({ users, bets, matches, currentUser }) {
  const { PLAYERS, FLAGS, calculatePoints } = window.WC_DATA;

  const rankings = [...users].map(u => {
    const ub = bets[u.id] || {};
    let pts = 0, exact = 0, correct = 0, total = 0;
    matches.forEach(m => {
      if (m.status !== 'finished') return;
      const b = ub[m.id]; if (!b) return;
      total++;
      const p = calculatePoints(b.home, b.away, m.homeScore, m.awayScore);
      pts += p; if (p === 3) exact++; if (p >= 1) correct++;
    });
    return { ...u, pts, exact, correct, total };
  }).sort((a, b) => b.pts - a.pts);

  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const podiumH = [140, 185, 110];
  const podiumOrder = rankings.length >= 3 ? [rankings[1], rankings[0], rankings[2]] : rankings;
  const podiumRanks = [2, 1, 3];

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <img src="uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 60, filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.8))', animation: 'wc-float 3.5s ease-in-out infinite', marginBottom: 6 }} />
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 34, background: 'linear-gradient(135deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 5 }}>CLASIFICACIÓN</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4, fontFamily: "'Barlow',sans-serif" }}>Tabla en tiempo real · {rankings.length} participantes</div>
      </div>

      {/* Podium */}
      {rankings.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 28, justifyContent: 'center', marginTop: 20 }}>
          {podiumOrder.map((u, i) => {
            const rank = podiumRanks[i];
            const pl = PLAYERS.find(p => p.id === u.playerId);
            return (
              <div key={u.id} style={{ flex: 1, maxWidth: 155, textAlign: 'center' }}>
                <AvatarBubble player={pl} size={rank === 1 ? 56 : 44} />
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: 2 }}>{u.username}</div>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: medals[rank - 1], marginBottom: 6 }}>{u.pts} pts</div>
                <div style={{
                  height: podiumH[i], background: `linear-gradient(to top, ${medals[rank - 1]}22, ${medals[rank - 1]}44)`,
                  border: `2px solid ${medals[rank - 1]}`, borderBottom: 'none',
                  borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 52, color: medals[rank - 1], opacity: 0.55 }}>#{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {rankings.map((u, i) => {
        const pl = PLAYERS.find(p => p.id === u.playerId);
        const isMe = u.id === currentUser.id;
        const medal = medals[i] || 'rgba(255,255,255,0.12)';
        return (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px', marginBottom: 8,
            background: isMe ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.03)',
            border: isMe ? '1px solid rgba(255,215,0,0.28)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            animation: i === 0 ? 'wc-cardGlow 3s ease-in-out infinite' : 'none',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: i < 3 ? `${medal}18` : 'rgba(255,255,255,0.04)',
              border: `2px solid ${i < 3 ? medal : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Anton',sans-serif", fontSize: 13,
              color: i < 3 ? medal : 'rgba(255,255,255,0.3)',
            }}>#{i + 1}</div>
            <AvatarBubble player={pl} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {u.username}
                {isMe && <span style={{ fontSize: 9, color: '#FFD700', letterSpacing: 1 }}>▸ TÚ</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif' " }}>
                {u.exact} exactos · {u.correct} acertados · {u.total} apostados
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, color: i < 3 ? medal : '#fff', lineHeight: 1 }}>{u.pts}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>PTS</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({ user, users, bets, matches, onChangePlayer, onLogout, onShowAdmin }) {
  const { PLAYERS, FLAGS, calculatePoints } = window.WC_DATA;
  const [showSel, setShowSel] = React.useState(false);
  const player = PLAYERS.find(p => p.id === user.playerId);
  const ub = bets[user.id] || {};

  const stats = matches.reduce((s, m) => {
    if (m.status !== 'finished') return s;
    const b = ub[m.id]; if (!b) return s;
    const p = calculatePoints(b.home, b.away, m.homeScore, m.awayScore);
    return { ...s, pts: s.pts + p, exact: s.exact + (p === 3 ? 1 : 0), bets: s.bets + 1 };
  }, { pts: 0, exact: 0, bets: 0 });

  const pool = users.filter(u => u.poolJoined).length * 100000;

  if (showSel) return <window.PlayerSelectScreen onSelect={pid => { onChangePlayer(pid); setShowSel(false); }} currentPlayerId={user.playerId} />;

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {/* Hero card */}
      <div style={{
        borderRadius: 22, padding: 28, marginBottom: 16, textAlign: 'center', overflow: 'hidden', position: 'relative',
        background: player ? `linear-gradient(160deg,${player.kitA}22,rgba(5,5,8,0))` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${player ? player.kitA + '44' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: player ? `0 12px 48px ${player.kitA}18` : 'none',
      }}>
        {/* BG number watermark */}
        {player && (
          <div style={{ position: 'absolute', right: -10, top: -10, fontFamily: "'Anton',sans-serif", fontSize: 160, color: player.kitA, opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>
            {player.number}
          </div>
        )}
        <div style={{ margin: '0 auto 14px', display: 'flex', justifyContent: 'center' }}>
          <AvatarBubble player={player} size={100} />
        </div>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, color: '#fff', letterSpacing: 2 }}>{user.username}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 6px', fontFamily: "'Barlow',sans-serif" }}>{user.email}</div>
        {player && (
          <div style={{ color: '#FFD700', fontSize: 15, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
            {FLAGS[player.country] || ''} {player.fullName}
          </div>
        )}
        <button onClick={() => setShowSel(true)} style={{
          marginTop: 14, padding: '8px 24px',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 20, color: 'rgba(255,255,255,0.65)',
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, cursor: 'pointer',
        }}>CAMBIAR JUGADOR</button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Puntos totales',      value: stats.pts,    color: '#FFD700', icon: '⭐' },
          { label: 'Exactos',             value: stats.exact,  color: '#22C55E', icon: '🎯' },
          { label: 'Apuestas hechas',     value: stats.bets,   color: '#3B82F6', icon: '⚽' },
          { label: 'Bolsa total',         value: `$${Math.round(pool / 1000)}K`, color: '#C9A62C', icon: '🏆' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -4, right: 4, fontSize: 44, opacity: 0.07, lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 40, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: "'Barlow',sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {user.poolJoined && (
        <div style={{
          background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.22)',
          borderRadius: 14, padding: '16px 18px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <img src="uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 40, filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.7))' }} />
          <div>
            <div style={{ color: '#FFD700', fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, letterSpacing: 1 }}>INSCRITO EN LA BOLSA GENERAL</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Barlow',sans-serif" }}>Pagaste $100.000 COP · ¡Mucha suerte campeón!</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onShowAdmin} style={{
          padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, color: 'rgba(255,255,255,0.6)',
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
        }}>⚙️ PANEL DE ADMINISTRADOR</button>
        <button onClick={onLogout} style={{
          padding: '14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, color: '#EF4444',
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
        }}>CERRAR SESIÓN</button>
      </div>
    </div>
  );
}

// ─── ADMIN SCREEN ─────────────────────────────────────────────────────────────
function AdminScreen({ matches, onClose, onUpdateResult }) {
  const { FLAGS } = window.WC_DATA;
  const [vals, setVals] = React.useState(
    Object.fromEntries(matches.map(m => [m.id, { home: m.homeScore ?? '', away: m.awayScore ?? '' }]))
  );
  const [saved, setSaved] = React.useState({});

  const save = (id) => {
    const h = parseInt(vals[id].home), a = parseInt(vals[id].away);
    if (isNaN(h) || isNaN(a)) return;
    onUpdateResult(id, h, a);
    setSaved(p => ({ ...p, [id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [id]: false })), 2200);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030306', zIndex: 300, overflowY: 'auto', padding: '24px 16px 100px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, padding: 0 }}>←</button>
          <div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#FFD700', letterSpacing: 3 }}>ADMIN — RESULTADOS</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif" }}>Ingresa los resultados para calcular puntos</div>
          </div>
        </div>
        {matches.map(m => {
          const v = vals[m.id] || { home: '', away: '' };
          const inpS = { width: 52, height: 48, textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, color: '#FFD700', fontFamily: "'Anton',sans-serif", fontSize: 26, outline: 'none' };
          return (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  {FLAGS[m.home]} {m.home} vs {m.away} {FLAGS[m.away]}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {m.group && `Grupo ${m.group} · `}{m.status} · {m.date.split('T')[0]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <input type="number" min="0" max="20" value={v.home} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, home: e.target.value } }))} style={inpS} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Anton',sans-serif", fontSize: 22 }}>–</span>
                <input type="number" min="0" max="20" value={v.away} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, away: e.target.value } }))} style={inpS} />
                <button onClick={() => save(m.id)} style={{
                  padding: '10px 14px', background: saved[m.id] ? '#22C55E' : '#FFD700',
                  border: 'none', borderRadius: 8, color: '#000',
                  fontFamily: "'Anton',sans-serif", fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
                }}>{saved[m.id] ? '✓' : 'OK'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { BgLayer, AvatarBubble, FlagBadge, NavBar, LiveCard, DashboardScreen, MatchBetCard, MatchesScreen, LeaderboardScreen, ProfileScreen, AdminScreen });
