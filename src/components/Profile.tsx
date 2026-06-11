import { useState } from 'react';
import { FLAGS, PLAYERS, pointsFor, type Match } from '../lib/data';
import type { User, Bet } from '../lib/state';
import { AvatarBubble } from './Shared';
import { PlayerSelectScreen } from './PlayerSelect';

interface ProfileScreenProps {
  user: User;
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matches: Match[];
  onChangePlayer: (playerId: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  onShowAdmin: () => void;
}

export function ProfileScreen({ user, users, bets, matches, onChangePlayer, onLogout, isAdmin, onShowAdmin }: ProfileScreenProps) {
  const [showSel, setShowSel] = useState(false);
  const player = PLAYERS.find(p => p.id === user.playerId);
  const ub = bets[user.id] || {};

  // Points count every finished match (0–0 default rule); "bets" = placed bets.
  const stats = matches.reduce((s, m) => {
    if (m.status !== 'finished') return s;
    const b = ub[m.id];
    const p = pointsFor(b, m);
    return { pts: s.pts + p, exact: s.exact + (p === 3 ? 1 : 0), bets: s.bets + (b ? 1 : 0) };
  }, { pts: 0, exact: 0, bets: 0 });

  const pool = users.filter(u => u.poolJoined).length * 100000;

  if (showSel) return <PlayerSelectScreen onSelect={pid => { onChangePlayer(pid); setShowSel(false); }} currentPlayerId={user.playerId} />;

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
          { label: 'Puntos totales', value: stats.pts, color: '#FFD700', icon: '⭐' },
          { label: 'Exactos', value: stats.exact, color: '#22C55E', icon: '🎯' },
          { label: 'Apuestas hechas', value: stats.bets, color: '#3B82F6', icon: '⚽' },
          { label: 'Bolsa total', value: `$${Math.round(pool / 1000)}K`, color: '#C9A62C', icon: '🏆' },
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
          <img src="/uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 40, filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.7))' }} />
          <div>
            <div style={{ color: '#FFD700', fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, letterSpacing: 1 }}>INSCRITO EN LA BOLSA GENERAL</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'Barlow',sans-serif" }}>Pagaste $100.000 COP · ¡Mucha suerte campeón!</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isAdmin && (
          <button onClick={onShowAdmin} style={{
            padding: '14px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 12, color: '#FFD700',
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
          }}>⚙️ PANEL DE ADMINISTRADOR · SUPER USUARIO</button>
        )}
        <button onClick={onLogout} style={{
          padding: '14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, color: '#EF4444',
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
        }}>CERRAR SESIÓN</button>
      </div>
    </div>
  );
}
