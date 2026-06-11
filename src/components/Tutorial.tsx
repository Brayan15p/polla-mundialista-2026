import { useState, type ReactNode } from 'react';
import { PLAYERS } from '../lib/data';
import type { User } from '../lib/state';
import { AvatarBubble } from './Shared';

// Shared inline style helpers ------------------------------------------------
const goldText = {
  background: 'linear-gradient(180deg,#FFE566,#C9A62C)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
};

// A small "feature row" with an emoji chip + label + description.
function InfoRow({ icon, label, desc, accent }: { icon: string; label: string; desc: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '11px 13px',
    }}>
      <div style={{
        width: 38, height: 38, flexShrink: 0, borderRadius: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        background: accent ? `${accent}22` : 'rgba(255,215,0,0.12)',
        border: `1px solid ${accent ? `${accent}55` : 'rgba(255,215,0,0.3)'}`,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13.5,
          letterSpacing: 1.5, color: '#fff', lineHeight: 1.1,
        }}>{label}</div>
        <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

// A card explaining one bet type with its points.
function BetTypeCard({ tag, title, lines, accent }: { tag: string; title: string; lines: { pts: string; txt: string }[]; accent: string }) {
  return (
    <div style={{
      textAlign: 'left', borderRadius: 16, padding: '13px 15px',
      background: `linear-gradient(150deg, ${accent}18, rgba(5,5,8,0.2))`,
      border: `1px solid ${accent}50`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.5,
          color: '#000', background: accent, borderRadius: 6, padding: '2px 7px',
        }}>{tag}</span>
        <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: 1, color: '#fff' }}>{title}</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: i ? 5 : 0 }}>
          <span style={{
            fontFamily: "'Anton',sans-serif", fontSize: 14, color: accent, minWidth: 56, flexShrink: 0,
          }}>{l.pts}</span>
          <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 12.5, lineHeight: 1.35, color: 'rgba(255,255,255,0.72)' }}>{l.txt}</span>
        </div>
      ))}
    </div>
  );
}

interface Slide {
  icon: string;
  title: string;
  content: ReactNode;
}

// Friendly, football-flavoured onboarding shown once to brand-new players.
export function Tutorial({ user, onClose }: { user: User; onClose: () => void }) {
  const player = PLAYERS.find(p => p.id === user.playerId);
  const [step, setStep] = useState(0);

  const body = (txt: ReactNode) => (
    <div style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', fontFamily: "'Barlow',sans-serif" }}>{txt}</div>
  );

  const slides: Slide[] = [
    // 1 — Welcome ------------------------------------------------------------
    {
      icon: '🏟️',
      title: `¡BIENVENIDO A LA CANCHA, ${user.username.toUpperCase()}!`,
      content: (
        <>
          {player && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.25)',
              borderRadius: 16, padding: '12px 16px', marginBottom: 16,
            }}>
              <AvatarBubble player={player} size={64} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>TU CRACK</div>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: 1, ...goldText }}>{player.fullName}</div>
                <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{player.role} · #{player.number}</div>
              </div>
            </div>
          )}
          {body(player
            ? <>Saltas al campo con <b style={{ color: '#FFD700' }}>{player.fullName}</b> en la espalda. Aquí no se patea el balón… se patean marcadores. ¡Arranca tu Mundial, parcero!</>
            : <>Aquí no se patea el balón… se patean marcadores. ¡Arranca tu Mundial, parcero!</>
          )}
        </>
      ),
    },
    // 2 — How scoring works (two bet types) ---------------------------------
    {
      icon: '🎯',
      title: 'CÓMO SE ANOTA',
      content: (
        <>
          {body(<>En cada partido eliges cómo le metes ficha. Hay <b style={{ color: '#FFD700' }}>dos formas</b> de sumar puntos:</>)}
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            <BetTypeCard
              tag="MARCADOR"
              title="Resultado exacto"
              accent="#FFD700"
              lines={[
                { pts: '3 pts', txt: 'si aciertas el marcador EXACTO (¡golazo desde mitad de cancha!).' },
                { pts: '1 pt', txt: 'si solo aciertas quién gana.' },
              ]}
            />
            <BetTypeCard
              tag="1X2"
              title="Resultado / Ganador"
              accent="#4ADE80"
              lines={[
                { pts: '1 pt', txt: 'si aciertas quién gana o si fue empate. Sencillo y seguro.' },
              ]}
            />
          </div>
        </>
      ),
    },
    // 3 — Golden rules -------------------------------------------------------
    {
      icon: '⏱️',
      title: 'REGLAS DE ORO',
      content: (
        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          <InfoRow icon="🕔" label="HASTA 5 MINUTOS ANTES" desc="Puedes apostar o cambiar tu pronóstico hasta 5 minutos antes del pitazo inicial." accent="#FFD700" />
          <InfoRow icon="🥅" label="0–0 POR DEFECTO" desc="¿Se te pasó el partido? No quedas por fuera: entras automático con un 0–0… ¡así que no te duermas!" accent="#60A5FA" />
        </div>
      ),
    },
    // 4 — Bottom tabs --------------------------------------------------------
    {
      icon: '🧭',
      title: 'CONOCE EL ESTADIO',
      content: (
        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          <InfoRow icon="⚽" label="INICIO" desc="Tu resumen: lo importante de un vistazo." />
          <InfoRow icon="📅" label="PARTIDOS" desc="Aquí es donde apuestas, partido por partido." accent="#4ADE80" />
          <InfoRow icon="🎟️" label="APUESTAS" desc="Tus pronósticos y los puntos que vas sumando." accent="#FFD700" />
          <InfoRow icon="🗺️" label="FASES" desc="Cuadrangulares, llaves y la cuenta regresiva a la final." accent="#60A5FA" />
          <InfoRow icon="🏆" label="TABLA" desc="La clasificación: quién va de líder." accent="#FFD700" />
          <InfoRow icon="👤" label="PERFIL" desc="Tus estadísticas y tu crack." />
        </div>
      ),
    },
    // 5 — Knockout stages ----------------------------------------------------
    {
      icon: '🗺️',
      title: 'LAS FASES FINALES',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '6px 0 16px' }}>
            {[
              { n: '104', l: 'PARTIDOS' },
              { n: '72', l: 'DE GRUPOS' },
              { n: '32', l: 'ELIMINATORIAS' },
            ].map(b => (
              <div key={b.l} style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 14, padding: '10px 4px',
              }}>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 'clamp(22px,7vw,28px)', lineHeight: 1, ...goldText }}>{b.n}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{b.l}</div>
              </div>
            ))}
          </div>
          {body(<>El Mundial 2026 trae <b style={{ color: '#FFD700' }}>104 partidos</b>. Las eliminatorias aparecen como <b>“Por definir”</b> y se desbloquean apenas se conozcan los rivales. ¡Prepárate para la fiesta grande!</>)}
        </>
      ),
    },
    // 6 — How to win ---------------------------------------------------------
    {
      icon: '🏆',
      title: 'A LEVANTAR LA COPA',
      content: body(
        <>Cada punto te sube en la <b style={{ color: '#FFD700' }}>TABLA</b>. El que más sume al final del Mundial se corona campeón… y se lleva <b style={{ color: '#FFD700' }}>la bolsa</b>. Así que afina el ojo y demuestra que de fútbol sí sabes.</>
      ),
    },
    // 7 — Motivational close -------------------------------------------------
    {
      icon: '⚽',
      title: '¡QUE RUEDE EL BALÓN!',
      content: (
        <>
          {body(player
            ? <>Todo listo, <b style={{ color: '#FFD700' }}>{user.username}</b>. {player.fullName} ya calienta en la banda. El balón está en el círculo central… ¡a meterle ficha y a ganar!</>
            : <>Todo listo, <b style={{ color: '#FFD700' }}>{user.username}</b>. El balón está en el círculo central… ¡a meterle ficha y a ganar!</>
          )}
          <div style={{
            marginTop: 16, fontFamily: "'Anton',sans-serif", fontSize: 'clamp(18px,5vw,22px)', letterSpacing: 1.5,
            ...goldText, animation: 'wc-goldPulseText 2s ease-in-out infinite',
          }}>¡SUERTE EN LA CANCHA! 🍀</div>
        </>
      ),
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
        maxHeight: '92vh', overflowY: 'auto',
        background: 'linear-gradient(160deg,rgba(255,255,255,0.06),rgba(5,5,8,0.2))',
        border: '1px solid rgba(255,215,0,0.3)', borderRadius: 24, padding: '28px 24px 22px',
        textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'wc-bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Skip — always available */}
        {!last && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer',
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 1.5,
          }}>SALTAR ✕</button>
        )}

        <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 12, filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.5))', animation: 'wc-popIn 0.5s ease both' }}>{s.icon}</div>

        <div style={{
          fontFamily: "'Anton',sans-serif", fontSize: 'clamp(21px,5.4vw,27px)', letterSpacing: 1.5, lineHeight: 1.05,
          ...goldText, marginBottom: 14,
        }}>{s.title}</div>

        <div style={{ marginBottom: 22 }}>{s.content}</div>

        {/* dots */}
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 18 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} aria-label={`Ir al paso ${i + 1}`} style={{
              width: i === step ? 22 : 7, height: 7, borderRadius: 4, padding: 0, border: 'none', cursor: 'pointer',
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
          }}>{last ? '¡A JUGAR! ⚽' : 'SIGUIENTE ›'}</button>
        </div>
      </div>
    </div>
  );
}
