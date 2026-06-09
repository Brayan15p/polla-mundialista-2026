import { useState } from 'react';
import { FLAGS, PLAYERS, type Player, type Tier } from '../lib/data';

interface TierStyle {
  bg: string; border: string; glow: string; badge: string; badgeTxt: string;
}

const tierStyles: Record<Tier, TierStyle> = {
  legend: { bg: 'linear-gradient(160deg,#2a1a00,#5a3800,#2a1a00)', border: '2px solid #FFD700', glow: 'rgba(255,200,0,0.7)', badge: '#FFD700', badgeTxt: '#000' },
  gold: { bg: 'linear-gradient(160deg,#1a1a00,#3a3000,#1a1a00)', border: '1.5px solid #C9A62C', glow: 'rgba(201,166,44,0.55)', badge: '#C9A62C', badgeTxt: '#000' },
  silver: { bg: 'linear-gradient(160deg,#111520,#1e2540,#111520)', border: '1.5px solid rgba(192,192,192,0.6)', glow: 'rgba(192,192,192,0.3)', badge: '#aaa', badgeTxt: '#000' },
  bronze: { bg: 'linear-gradient(160deg,#1a1000,#2a2010,#1a1000)', border: '1.5px solid rgba(205,127,50,0.6)', glow: 'rgba(205,127,50,0.3)', badge: '#CD7F32', badgeTxt: '#000' },
};

export function FifaCard({ player, selected, onClick }: { player: Player; selected: boolean; onClick: () => void }) {
  const ts = tierStyles[player.tier] || tierStyles.bronze;
  const flag = FLAGS[player.country] || '🏴';
  const isPremium = player.tier === 'legend' || player.tier === 'gold';

  return (
    <div onClick={onClick} style={{
      width: 130, position: 'relative', cursor: 'pointer',
      background: ts.bg,
      border: selected ? '2.5px solid #FFD700' : ts.border,
      borderRadius: 14, padding: '14px 10px 12px',
      textAlign: 'center',
      transform: selected ? 'scale(1.08) translateY(-6px)' : 'scale(1)',
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: selected
        ? `0 16px 48px ${ts.glow}, 0 0 30px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)`
        : `0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
      overflow: 'hidden',
    }}>
      {/* Card inner shine */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.06),transparent)', borderRadius: '14px 14px 0 0', pointerEvents: 'none' }} />

      {/* Tier badge */}
      <div style={{ position: 'absolute', top: 8, left: 8, background: ts.badge, color: ts.badgeTxt, fontFamily: "'Anton',sans-serif", fontSize: 10, letterSpacing: 1, padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
        {player.tier === 'legend' ? 'LEYENDA' : player.tier.toUpperCase()}
      </div>

      {/* Jersey number */}
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 52, lineHeight: 1, color: isPremium ? '#FFD700' : 'rgba(255,255,255,0.55)', textShadow: `0 0 20px ${ts.glow}` }}>
        {player.number}
      </div>

      {/* Flag */}
      <div style={{ fontSize: 30, margin: '4px 0', lineHeight: 1 }}>{flag}</div>

      {/* Silhouette SVG */}
      <div style={{ margin: '6px auto 2px', width: 52, height: 68 }}>
        <svg viewBox="0 0 60 90" width="52" height="68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill={isPremium ? '#FFD700' : player.kitA} opacity="0.85"
            dangerouslySetInnerHTML={{ __html: player.silhouette || '' }} />
        </svg>
      </div>

      {/* Kit color stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${player.kitA},${player.kitB || player.kitA})`, borderRadius: 2, margin: '4px 0 6px' }} />

      {/* Name */}
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: 1, lineHeight: 1.1 }}>
        {player.name}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 1 }}>
        {player.role.toUpperCase()}
      </div>

      {/* Selected check */}
      {selected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000' }}>✓</div>
      )}
    </div>
  );
}

interface PlayerSelectScreenProps {
  onSelect: (playerId: string) => void;
  currentPlayerId?: string | null;
}

export function PlayerSelectScreen({ onSelect, currentPlayerId }: PlayerSelectScreenProps) {
  const [sel, setSel] = useState<string | null>(currentPlayerId || null);
  const tierOrder: Record<Tier, number> = { legend: 0, gold: 1, silver: 2, bronze: 3 };
  const sorted = [...PLAYERS].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return (
    <div style={{ minHeight: '100vh', padding: '40px 16px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,166,44,0.1) 0%, transparent 60%)' }} />

      <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 'clamp(22px,5vw,42px)', background: 'linear-gradient(135deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 5 }}>ELIGE TU JUGADOR</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8, fontFamily: "'Barlow',sans-serif" }}>Tu ídolo te representará en la Polla Mundialista</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 860, position: 'relative', zIndex: 1 }}>
        {sorted.map(p => (
          <FifaCard key={p.id} player={p} selected={sel === p.id} onClick={() => setSel(p.id)} />
        ))}
      </div>

      <button onClick={() => sel && onSelect(sel)} disabled={!sel} style={{
        marginTop: 40, padding: '17px 60px', position: 'relative', zIndex: 1,
        background: sel ? 'linear-gradient(135deg,#FFE566,#C9A62C)' : 'rgba(255,255,255,0.07)',
        border: 'none', borderRadius: 12,
        color: sel ? '#000' : 'rgba(255,255,255,0.2)',
        fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: 4,
        cursor: sel ? 'pointer' : 'not-allowed', transition: 'all 0.3s',
        boxShadow: sel ? '0 6px 28px rgba(201,166,44,0.5)' : 'none',
      }}>CONFIRMAR SELECCIÓN</button>
    </div>
  );
}
