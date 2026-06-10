import { useState } from 'react';
import { FLAGS, PLAYERS, type Player, type Match } from '../lib/data';
import type { User, View } from '../lib/state';

const COUNTRY_CODES: Record<string, string> = {
  'Mexico': 'mx', 'South Africa': 'za', 'Korea Republic': 'kr', 'Czechia': 'cz',
  'Canada': 'ca', 'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Türkiye': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', "Côte d'Ivoire": 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'IR Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cabo Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'Congo DR': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
};

export function BgLayer() {
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
        backgroundImage: "url('/uploads/pasted-1781013290237-0.png')",
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        aspectRatio: '3/4', opacity: 0.032, filter: 'grayscale(1)',
      }} />
    </div>
  );
}

export function AvatarBubble({ player, size = 40 }: { player?: Player | null; size?: number }) {
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

export function FlagBadge({ country, size = 52 }: { country: string; size?: number }) {
  const code = COUNTRY_CODES[country];
  const [failed, setFailed] = useState(false);
  const w = size + 16;
  const h = Math.round(w * 0.67);
  return (
    <div style={{
      width: w, height: h, borderRadius: 10,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.13)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      flexShrink: 0,
    }}>
      {code && !failed ? (
        <img
          src={`https://flagcdn.com/w80/${code}.png`}
          alt={country}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.6, lineHeight: 1 }}>{FLAGS[country] || '🏴'}</span>
      )}
    </div>
  );
}

interface NavBarProps {
  user: User;
  view: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  userPoints: number;
}

export function NavBar({ user, view, onNavigate, onLogout, userPoints }: NavBarProps) {
  const player = PLAYERS.find(p => p.id === user?.playerId);
  const navItems: { key: View; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'INICIO', icon: '⚽' },
    { key: 'matches', label: 'PARTIDOS', icon: '📅' },
    { key: 'bracket', label: 'FASES', icon: '🗺️' },
    { key: 'leaderboard', label: 'TABLA', icon: '🏆' },
    { key: 'profile', label: 'PERFIL', icon: '👤' },
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
          <img src="/uploads/pasted-1781013290237-0.png" alt="" style={{ width: 32, filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />
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

export function LiveCard({ match, bet }: { match: Match; bet?: { home: number; away: number } }) {
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
