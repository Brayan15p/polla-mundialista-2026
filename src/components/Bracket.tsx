import { useState, useEffect } from 'react';
import { GROUPS, type Match } from '../lib/data';
import { groupStandings, KNOCKOUT_ROUNDS, FINAL_DATE } from '../lib/standings';
import { FlagBadge } from './Shared';

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        background: 'linear-gradient(135deg,rgba(201,166,44,0.2),rgba(201,166,44,0.05))',
        border: '1px solid rgba(255,215,0,0.25)', borderRadius: 12,
        padding: '12px 4px', fontFamily: "'Anton',sans-serif", fontSize: 'clamp(26px,7vw,40px)',
        color: '#FFD700', lineHeight: 1,
      }}>{String(value).padStart(2, '0')}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif", marginTop: 6 }}>{label}</div>
    </div>
  );
}

interface BracketScreenProps { matches: Match[]; }

export function BracketScreen({ matches }: BracketScreenProps) {
  const cd = useCountdown(FINAL_DATE);
  const [activeGroup, setActiveGroup] = useState('A');
  const standings = groupStandings(activeGroup, matches);
  const groupColor = GROUPS[activeGroup]?.color || '#FFD700';
  const anyPlayed = standings.some(r => r.played > 0);

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      {/* Countdown to the final */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(201,166,44,0.12),rgba(5,5,8,0))',
        border: '1px solid rgba(255,215,0,0.3)', borderRadius: 18, padding: '20px 18px', marginBottom: 22,
        animation: 'wc-cardGlow 4s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
          <img src="/uploads/pasted-1781013290237-0.png" alt="" style={{ width: 30, filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.7))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.4)' }}>CUENTA REGRESIVA</div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: 2, background: 'linear-gradient(90deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GRAN FINAL · 19 JUL 2026</div>
          </div>
        </div>
        {cd.done ? (
          <div style={{ textAlign: 'center', fontFamily: "'Anton',sans-serif", fontSize: 26, color: '#FFD700', padding: '10px 0' }}>¡ES HOY! ⚽🏆</div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <CountdownBox value={cd.days} label="DÍAS" />
            <CountdownBox value={cd.hours} label="HORAS" />
            <CountdownBox value={cd.mins} label="MIN" />
            <CountdownBox value={cd.secs} label="SEG" />
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif", marginTop: 12 }}>
          MetLife Stadium · Nueva York / Nueva Jersey
        </div>
      </div>

      {/* ── Cuadrangulares (group tables) ───────────────────────────── */}
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: 3, color: '#fff', marginBottom: 4 }}>CUADRANGULARES</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", marginBottom: 14 }}>
        Tablas en vivo · se actualizan con cada resultado
      </div>

      {/* Group selector */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 14, scrollbarWidth: 'none', paddingBottom: 2 }}>
        {Object.entries(GROUPS).map(([k, g]) => (
          <button key={k} onClick={() => setActiveGroup(k)} style={{
            flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeGroup === k ? g.color : 'rgba(255,255,255,0.06)',
            color: activeGroup === k ? '#000' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Anton',sans-serif", fontSize: 16, transition: 'all 0.2s',
          }}>{k}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${groupColor}33`, borderRadius: 16, overflow: 'hidden', marginBottom: 26 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,${groupColor},${groupColor}44,transparent)` }} />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width: 20 }}>#</span>
          <span style={{ flex: 1 }}>EQUIPO</span>
          <span style={{ width: 26, textAlign: 'center' }}>PJ</span>
          <span style={{ width: 34, textAlign: 'center' }}>DG</span>
          <span style={{ width: 32, textAlign: 'center', color: '#FFD700' }}>PTS</span>
        </div>
        {standings.map((r, i) => {
          const qualifies = i < 2; // top 2 advance directly
          return (
            <div key={r.team} style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              borderBottom: i < standings.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              background: qualifies && anyPlayed ? 'rgba(34,197,94,0.05)' : 'transparent',
            }}>
              <span style={{
                width: 20, fontFamily: "'Anton',sans-serif", fontSize: 13,
                color: qualifies && anyPlayed ? '#22C55E' : 'rgba(255,255,255,0.3)',
              }}>{i + 1}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <FlagBadge country={r.team} size={22} />
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team}</span>
              </div>
              <span style={{ width: 26, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Barlow',sans-serif" }}>{r.played}</span>
              <span style={{ width: 34, textAlign: 'center', fontSize: 13, color: r.gd > 0 ? '#22C55E' : r.gd < 0 ? '#EF4444' : 'rgba(255,255,255,0.5)', fontFamily: "'Barlow',sans-serif" }}>{r.gd > 0 ? '+' : ''}{r.gd}</span>
              <span style={{ width: 32, textAlign: 'center', fontFamily: "'Anton',sans-serif", fontSize: 17, color: '#FFD700' }}>{r.points}</span>
            </div>
          );
        })}
        {!anyPlayed && (
          <div style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Barlow',sans-serif", textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            Aún sin partidos jugados — la tabla se llena cuando entren resultados
          </div>
        )}
      </div>

      {/* ── Knockout bracket ───────────────────────────────────────── */}
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: 3, color: '#fff', marginBottom: 14 }}>CAMINO A LA FINAL</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {KNOCKOUT_ROUNDS.map((round, idx) => {
          const isFinal = round.key === 'final';
          return (
            <div key={round.key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: isFinal ? '18px 18px' : '14px 18px',
              borderRadius: 16,
              background: isFinal
                ? 'linear-gradient(135deg,rgba(201,166,44,0.18),rgba(201,166,44,0.04))'
                : 'rgba(255,255,255,0.03)',
              border: isFinal ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
              boxShadow: isFinal ? '0 0 24px rgba(255,215,0,0.12)' : 'none',
            }}>
              <div style={{
                width: 46, height: 46, flexShrink: 0, borderRadius: 12,
                background: isFinal ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isFinal ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Anton',sans-serif", fontSize: isFinal ? 22 : 15,
                color: isFinal ? '#FFD700' : 'rgba(255,255,255,0.6)',
              }}>{isFinal ? '🏆' : round.slots}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
                  fontSize: isFinal ? 18 : 15, letterSpacing: 2,
                  color: isFinal ? '#FFD700' : '#fff',
                }}>{round.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", marginTop: 2 }}>
                  {isFinal ? 'El ganador se lleva la Copa del Mundo' : `${round.slots} ${round.slots === 1 ? 'llave' : 'llaves'} · ${round.slots * 2} equipos`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: isFinal ? '#FFD700' : 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>{round.dateRange}</div>
                {idx < KNOCKOUT_ROUNDS.length - 1 && <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>▼</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
