import { useState, useEffect, useMemo } from 'react';
import { GROUPS, TBD, fmtDate, type Match } from '../lib/data';
import { groupStandings, FINAL_DATE } from '../lib/standings';
import { bracketRounds, type BracketTie, type BracketRound } from '../lib/bracket';
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

// Approximate window for each knockout round (FIFA 2026 host schedule).
const ROUND_DATES: Record<string, string> = {
  r32: '28 jun – 3 jul', r16: '4 – 7 jul', qf: '9 – 11 jul',
  sf: '14 – 15 jul', third: '18 jul', final: '19 jul',
};

// One side of a tie. Greys out while still "Por definir"; the advancing team is
// highlighted green (or marked ✓ once the tie is decided).
function TieTeam({ team, score, winner, decided }: { team: string; score?: number; winner: boolean; decided: boolean }) {
  const tbd = team === TBD || !team;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
      background: winner ? 'rgba(34,197,94,0.10)' : 'transparent',
    }}>
      {tbd ? (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>?</div>
      ) : (
        <FlagBadge country={team} size={22} />
      )}
      <span style={{
        flex: 1, minWidth: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13,
        color: tbd ? 'rgba(255,255,255,0.3)' : winner ? '#fff' : 'rgba(255,255,255,0.7)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{tbd ? 'Por definir' : team}{winner && decided ? ' ✓' : ''}</span>
      {score != null && (
        <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 16, width: 20, textAlign: 'center', color: winner ? '#22C55E' : '#fff' }}>{score}</span>
      )}
    </div>
  );
}

function TieCard({ tie, highlight }: { tie: BracketTie; highlight?: boolean }) {
  const decided = !!tie.winner;
  const live = tie.status === 'live';
  const pens = tie.homePens != null && tie.awayPens != null;
  return (
    <div style={{
      background: highlight
        ? 'linear-gradient(135deg,rgba(201,166,44,0.14),rgba(201,166,44,0.03))'
        : 'rgba(255,255,255,0.03)',
      border: highlight ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 5, marginBottom: 8,
    }}>
      <TieTeam team={tie.home} score={tie.homeScore} winner={decided && tie.winner === tie.home} decided={decided} />
      <TieTeam team={tie.away} score={tie.awayScore} winner={decided && tie.winner === tie.away} decided={decided} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 10px 1px', fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow Condensed',sans-serif" }}>
        <span>{fmtDate(tie.date)}</span>
        {live ? (
          <span style={{ color: '#22C55E', fontWeight: 700 }}>● EN VIVO</span>
        ) : pens ? (
          <span style={{ color: '#FFD700' }}>PENALES {tie.homePens}–{tie.awayPens}</span>
        ) : null}
      </div>
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

  // The live bracket: App already resolved the knockout, so this just reshapes
  // the matches into rounds. Updates automatically as results come in.
  const rounds = useMemo(() => bracketRounds(matches), [matches]);
  const champion = rounds.find(r => r.key === 'final')?.ties[0]?.winner;

  // Rounds with no known team yet start collapsed to keep the view tidy.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isOpen = (r: BracketRound) =>
    r.key in collapsed ? !collapsed[r.key] : r.ties.some(t => t.home !== TBD || t.away !== TBD);

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

      {/* Champion banner — only once the final is decided */}
      {champion && (
        <div style={{
          background: 'linear-gradient(135deg,rgba(201,166,44,0.25),rgba(201,166,44,0.05))',
          border: '1px solid rgba(255,215,0,0.5)', borderRadius: 18, padding: '18px',
          marginBottom: 22, textAlign: 'center', boxShadow: '0 0 30px rgba(255,215,0,0.2)',
        }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.5)' }}>🏆 CAMPEÓN DEL MUNDO</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            <FlagBadge country={champion} size={40} />
            <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, letterSpacing: 1, background: 'linear-gradient(90deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{champion}</span>
          </div>
        </div>
      )}

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

      {/* ── Knockout bracket (live) ─────────────────────────────────── */}
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: 3, color: '#fff', marginBottom: 4 }}>CAMINO A LA FINAL</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", marginBottom: 14 }}>
        Los cruces se llenan solos a medida que avanza el torneo
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rounds.map(round => {
          const open = isOpen(round);
          const decided = round.ties.filter(t => t.winner).length;
          const isFinal = round.key === 'final';
          return (
            <div key={round.key} style={{ marginBottom: 8 }}>
              <button onClick={() => setCollapsed(p => ({ ...p, [round.key]: open }))} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                padding: '12px 16px', borderRadius: 14, textAlign: 'left',
                background: isFinal ? 'linear-gradient(135deg,rgba(201,166,44,0.18),rgba(201,166,44,0.04))' : 'rgba(255,255,255,0.04)',
                border: isFinal ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: 11,
                  background: isFinal ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isFinal ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Anton',sans-serif", fontSize: isFinal ? 20 : 14,
                  color: isFinal ? '#FFD700' : 'rgba(255,255,255,0.6)',
                }}>{isFinal ? '🏆' : round.ties.length}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: isFinal ? 17 : 15, letterSpacing: 1.5, color: isFinal ? '#FFD700' : '#fff' }}>{round.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", marginTop: 2 }}>
                    {ROUND_DATES[round.key]} · {decided}/{round.ties.length} definido{round.ties.length === 1 ? '' : 's'}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
              </button>

              {open && (
                <div style={{ padding: '8px 2px 0' }}>
                  {round.ties.map(t => <TieCard key={t.id} tie={t} highlight={isFinal} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
