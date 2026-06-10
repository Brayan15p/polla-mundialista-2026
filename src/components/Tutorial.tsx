import { useState } from 'react';
import { PLAYERS } from '../lib/data';
import type { User } from '../lib/state';
import { AvatarBubble } from './Shared';

// Friendly, football-flavoured onboarding shown once to brand-new players.
export function Tutorial({ user, onClose }: { user: User; onClose: () => void }) {
  const player = PLAYERS.find(p => p.id === user.playerId);
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: '🏟️',
      title: `¡BIENVENIDO A LA CANCHA, ${user.username.toUpperCase()}!`,
      body: player
        ? `Saltas al campo con ${player.fullName} en la espalda. Aquí no se patea el balón… se patean marcadores. Arranca tu Mundial.`
        : 'Aquí no se patea el balón… se patean marcadores. Arranca tu Mundial.',
    },
    {
      icon: '🎯',
      title: 'CÓMO SE ANOTA',
      body: 'Predice el marcador de cada partido. Marcador EXACTO = 3 puntos (¡golazo!). Acertar solo quién gana o el empate = 1 punto. Fallar = 0. Así de simple.',
    },
    {
      icon: '⏱️',
      title: 'REGLAS DE ORO',
      body: 'Puedes apostar hasta 5 minutos antes del pitazo inicial. ¿Se te pasó el partido? Entras automático con un 0–0 por defecto… así que ¡no te quedes en la banca!',
    },
    {
      icon: '🗺️',
      title: 'CONOCE EL ESTADIO',
      body: 'INICIO: tu resumen. PARTIDOS: aquí apuestas. FASES: cuadrangulares, llaves y cuenta regresiva a la final. TABLA: la clasificación. PERFIL: tus estadísticas.',
    },
    {
      icon: '🏆',
      title: 'A LEVANTAR LA COPA',
      body: 'Cada punto te sube en la TABLA. El que más sume al final del Mundial se corona campeón y se lleva la bolsa. El balón ya rueda… ¡demuestra que sabes de fútbol!',
    },
  ];

  const s = slides[step];
  const last = step === slides.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(3,3,8,0.92)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
      animation: 'wc-fadeIn 0.3s ease',
    }}>
      {/* glow */}
      <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)', width: '80vw', maxWidth: 520, height: 320, background: 'radial-gradient(ellipse, rgba(201,166,44,0.18), transparent 70%)', pointerEvents: 'none' }} />

      <div key={step} style={{
        position: 'relative', width: '100%', maxWidth: 420,
        background: 'linear-gradient(160deg,rgba(255,255,255,0.06),rgba(5,5,8,0.2))',
        border: '1px solid rgba(255,215,0,0.3)', borderRadius: 24, padding: '30px 26px 24px',
        textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'wc-bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {step === 0 && player && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <AvatarBubble player={player} size={92} />
          </div>
        )}
        <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 14, filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.5))' }}>{s.icon}</div>

        <div style={{
          fontFamily: "'Anton',sans-serif", fontSize: 'clamp(22px,5.5vw,28px)', letterSpacing: 1.5, lineHeight: 1.05,
          background: 'linear-gradient(180deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 12,
        }}>{s.title}</div>

        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: "'Barlow',sans-serif", marginBottom: 22 }}>
          {s.body}
        </div>

        {/* dots */}
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 20 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 4,
              background: i === step ? '#FFD700' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              padding: '13px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2,
            }}>‹ ATRÁS</button>
          )}
          <button onClick={() => (last ? onClose() : setStep(step + 1))} style={{
            flex: 1, padding: '14px', border: 'none', borderRadius: 12,
            background: 'linear-gradient(135deg,#FFE566,#C9A62C)', color: '#000',
            fontFamily: "'Anton',sans-serif", fontSize: 17, letterSpacing: 2, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(201,166,44,0.45)',
          }}>{last ? '¡QUE RUEDE EL BALÓN! ⚽' : 'SIGUIENTE ›'}</button>
        </div>

        {!last && (
          <button onClick={onClose} style={{
            marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            fontSize: 12, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", textDecoration: 'underline',
          }}>Saltar tutorial</button>
        )}
      </div>
    </div>
  );
}
