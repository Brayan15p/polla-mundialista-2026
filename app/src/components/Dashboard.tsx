import { FLAGS, PLAYERS, calculatePoints, type Match } from '../lib/data';
import type { User, Bet, View } from '../lib/state';
import { AvatarBubble, LiveCard } from './Shared';

interface DashboardScreenProps {
  user: User;
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matches: Match[];
  onNavigate: (view: View) => void;
}

export function DashboardScreen({ user, users, bets, matches, onNavigate }: DashboardScreenProps) {
  const player = PLAYERS.find(p => p.id === user.playerId);
  const userBets = bets[user.id] || {};

  const totalPoints = matches.reduce((s, m) => {
    if (m.status !== 'finished') return s;
    const b = userBets[m.id]; if (!b) return s;
    return s + calculatePoints(b.home, b.away, m.homeScore!, m.awayScore!);
  }, 0);

  const poolAmount = users.filter(u => u.poolJoined).length * 100000;

  const allRanks = [...users].map(u => {
    const ub = bets[u.id] || {};
    return matches.reduce((s, m) => {
      if (m.status !== 'finished') return s;
      const b = ub[m.id]; if (!b) return s;
      return s + calculatePoints(b.home, b.away, m.homeScore!, m.awayScore!);
    }, 0);
  }).sort((a, b) => b - a);
  const rank = allRanks.findIndex(p => p <= totalPoints) + 1;

  const live = matches.filter(m => m.status === 'live');
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const pending = upcoming.filter(m => !userBets[m.id]);
  const recent = matches.filter(m => m.status === 'finished').slice(-5).reverse();

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
            {player ? `${FLAGS[player.country] || ''} ${player.fullName}` : 'Sin jugador'}
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
        <img src="/uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 56, filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.7))', animation: 'wc-float 4s ease-in-out infinite' }} />
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
        <img src="/uploads/WC-6.jpg" alt="Grupos FIFA 2026" style={{ width: '100%', display: 'block', opacity: 0.88, borderRadius: 17 }} />
      </div>

      {/* Recent results */}
      {recent.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>ÚLTIMOS RESULTADOS</div>
          {recent.map(m => {
            const bet = userBets[m.id];
            const pts = bet ? calculatePoints(bet.home, bet.away, m.homeScore!, m.awayScore!) : null;
            const ptC = pts === 3 ? '#22C55E' : pts === 1 ? '#FFD700' : '#4B5563';
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
