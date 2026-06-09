import { useState, useEffect } from 'react';
import { Particles } from './Particles';

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 5000),
      setTimeout(() => setPhase(6), 6200),
      setTimeout(() => setPhase(7), 7400),
      setTimeout(() => onComplete(), 8400),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onComplete]);

  const ease = 'cubic-bezier(0.22,1,0.36,1)';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* WC-6 groups image — faint background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/uploads/WC-6.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: phase >= 2 ? 0.08 : 0, transition: 'opacity 3s',
        filter: 'blur(2px) saturate(0.5)',
      }} />

      {/* Stadium radial light sweep */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(201,166,44,0.07) 15deg, transparent 30deg, rgba(201,166,44,0.04) 50deg, transparent 70deg, rgba(201,166,44,0.07) 120deg, transparent 140deg)',
        animation: 'wc-rotateSlow 30s linear infinite',
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 2s',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
        animation: 'wc-scan 4s linear infinite',
        opacity: phase >= 2 ? 0.6 : 0, transition: 'opacity 1s',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <Particles count={220} footballs={true} />

      {/* Gold radial glow */}
      <div style={{
        position: 'absolute',
        width: '70vw', height: '70vw', maxWidth: 700, maxHeight: 700,
        background: 'radial-gradient(circle, rgba(201,166,44,0.25) 0%, rgba(201,166,44,0.08) 35%, transparent 65%)',
        borderRadius: '50%',
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 2.5s',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Trophy */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center',
        transform: phase >= 2
          ? 'translateY(0) scale(1)'
          : phase >= 1
            ? 'translateY(60px) scale(0.7)'
            : 'translateY(140px) scale(0.5)',
        opacity: phase >= 1 ? 1 : 0,
        transition: `transform 2.4s ${ease}, opacity 1.5s`,
        filter: phase >= 3
          ? 'drop-shadow(0 0 50px rgba(255,215,0,0.95)) drop-shadow(0 0 100px rgba(255,165,0,0.55))'
          : 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
        animation: phase >= 3 ? 'wc-float 3.5s ease-in-out infinite' : 'none',
        marginBottom: 8,
      }}>
        <img src="/uploads/pasted-1781013290237-0.png" alt="FIFA World Cup Trophy"
          style={{ width: 'min(280px,48vw)', display: 'block', margin: '0 auto' }} />
      </div>

      {/* FIFA WC 2026 subtitle */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.9s ${ease} 0.1s`,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: 'clamp(12px,2vw,22px)', color: 'rgba(255,255,255,0.55)',
          letterSpacing: 7, textTransform: 'uppercase',
        }}>FIFA WORLD CUP 2026™</div>
      </div>

      {/* POLLA MUNDIALISTA */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center', marginTop: 4,
        opacity: phase >= 4 ? 1 : 0,
        transform: phase >= 4 ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(30px)',
        transition: 'all 1.1s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          fontFamily: "'Anton',sans-serif",
          fontSize: 'clamp(44px,10vw,116px)',
          lineHeight: 0.9,
          background: 'linear-gradient(180deg, #FFE566 0%, #C9A62C 45%, #FFD700 75%, #9A7200 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 6,
          filter: 'drop-shadow(0 4px 24px rgba(201,166,44,0.6))',
          animation: phase >= 4 ? 'wc-goldPulseText 2.5s ease-in-out infinite' : 'none',
        }}>
          POLLA<br />MUNDIALISTA
        </div>
      </div>

      {/* Host nations */}
      <div style={{
        position: 'relative', zIndex: 3, display: 'flex', gap: 16,
        alignItems: 'center', marginTop: 22,
        opacity: phase >= 5 ? 1 : 0,
        transform: phase >= 5 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.8s ease 0.15s',
      }}>
        {([['🇺🇸', 'USA'], ['🇨🇦', 'CANADA'], ['🇲🇽', 'MÉXICO']] as const).map(([flag, name], i) => (
          <div key={i} style={{
            textAlign: 'center',
            opacity: phase >= 5 ? 1 : 0,
            transition: `opacity 0.6s ${i * 0.12 + 0.2}s`,
          }}>
            <div style={{ fontSize: 32, lineHeight: 1 }}>{flag}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, marginTop: 3 }}>{name}</div>
          </div>
        ))}
      </div>

      {/* Tagline badge */}
      <div style={{
        position: 'relative', zIndex: 3, marginTop: 18,
        opacity: phase >= 6 ? 1 : 0,
        transition: 'opacity 0.8s 0.2s',
      }}>
        <div style={{
          background: 'linear-gradient(90deg, rgba(201,166,44,0.15), rgba(201,166,44,0.3), rgba(201,166,44,0.15))',
          border: '1px solid rgba(255,215,0,0.4)',
          padding: '8px 28px', borderRadius: 2,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: 13, letterSpacing: 4, color: '#FFD700',
        }}>
          ⚽ APUESTA · COMPITE · GANA LA BOLSA ⚽
        </div>
      </div>

      {/* White flash out */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 8,
        background: '#fff',
        opacity: phase === 7 ? 0.5 : 0,
        transition: phase === 7 ? 'opacity 0.1s' : 'opacity 1.5s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 8,
        background: '#000',
        opacity: phase >= 7 ? 0.7 : 0,
        transition: 'opacity 1.2s 0.15s',
        pointerEvents: 'none',
      }} />

      <button onClick={onComplete} style={{
        position: 'absolute', bottom: 28, right: 28, zIndex: 10,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
        color: 'rgba(255,255,255,0.5)', padding: '8px 22px', borderRadius: 4,
        fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, letterSpacing: 3, fontWeight: 700, cursor: 'pointer',
      }}>SALTAR ›</button>
    </div>
  );
}
