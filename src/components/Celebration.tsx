import { useEffect } from 'react';
import { Confetti } from './Particles';

export function Celebration({ points, onDone }: { points: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  const headline =
    points >= 3 ? '🎯 ¡MARCADOR EXACTO!' : points === 1 ? '✅ ¡ACERTASTE!' : '¡PUNTO!';

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3,3,8,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
        animation: 'wc-fadeIn 0.3s ease-out',
        padding: 20,
      }}
    >
      <Confetti active={true} />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '36px 30px 40px',
          borderRadius: 24,
          background: 'linear-gradient(180deg,rgba(20,18,8,0.92),rgba(8,8,12,0.92))',
          border: '1px solid rgba(255,215,0,0.35)',
          boxShadow: '0 0 60px rgba(255,215,0,0.25), inset 0 0 30px rgba(255,215,0,0.08)',
          animation: 'wc-bounceIn 0.6s cubic-bezier(.18,.89,.32,1.28), wc-cardGlow 2.4s ease-in-out infinite',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <img
          src="/uploads/pasted-1781013290237-0.png"
          alt="Trofeo"
          style={{
            width: 110,
            height: 'auto',
            filter: 'drop-shadow(0 6px 18px rgba(255,215,0,0.55))',
            animation: 'wc-float 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            marginTop: 14,
            fontFamily: "'Anton',sans-serif",
            fontSize: 64,
            lineHeight: 1,
            letterSpacing: 1,
            background: 'linear-gradient(180deg,#FFE566,#C9A62C)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'wc-goldPulseText 1.6s ease-in-out infinite',
          }}
        >
          +{points}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: "'Anton',sans-serif",
            fontSize: 28,
            letterSpacing: 0.5,
            color: '#FFD700',
            textShadow: '0 2px 10px rgba(255,215,0,0.4)',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: 18,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.82)',
          }}
        >
          Sumaste {points} {points === 1 ? 'punto' : 'puntos'} a tu Polla
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "'Barlow',sans-serif",
            fontSize: 12,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          Toca para continuar
        </div>
      </div>
    </div>
  );
}
