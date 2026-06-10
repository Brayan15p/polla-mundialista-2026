import { useState, useEffect, type CSSProperties } from 'react';
import { GROUPS, calculatePoints, canBet, winProbability, type Match } from '../lib/data';
import type { User, Bet } from '../lib/state';
import { FlagBadge } from './Shared';
import { GoldBurst } from './Particles';

interface OtherBet { username: string; bet: Bet; }

interface MatchBetCardProps {
  match: Match;
  bet?: Bet;
  canBetNow: boolean;
  onBet: (home: number, away: number) => void;
  otherBets?: OtherBet[];
}

export function MatchBetCard({ match, bet, canBetNow, onBet, otherBets }: MatchBetCardProps) {
  const [homeVal, setHomeVal] = useState(bet != null ? String(bet.home) : '');
  const [awayVal, setAwayVal] = useState(bet != null ? String(bet.away) : '');
  const [editing, setEditing] = useState(!bet && match.status === 'upcoming' && canBetNow);
  const [saved, setSaved] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [showBets, setShowBets] = useState(false);

  useEffect(() => {
    if (bet != null) { setHomeVal(String(bet.home)); setAwayVal(String(bet.away)); }
  }, [bet]);

  const groupColor = GROUPS[match.group]?.color || '#FFD700';
  const isLive = match.status === 'live';
  const isDone = match.status === 'finished';
  const prob = winProbability(match.home, match.away);

  const save = () => {
    const h = parseInt(homeVal), a = parseInt(awayVal);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onBet(h, a); setEditing(false); setSaved(true);
    setBurstKey(k => k + 1);
    setTimeout(() => setSaved(false), 2800);
  };

  const pts = isDone && bet != null ? calculatePoints(bet.home, bet.away, match.homeScore!, match.awayScore!) : null;
  const ptsColor = pts === 3 ? '#22C55E' : pts === 1 ? '#FFD700' : '#6B7280';

  const numInp: CSSProperties = {
    width: 58, height: 58, textAlign: 'center', fontSize: 30,
    background: 'rgba(255,255,255,0.08)', border: `2px solid ${groupColor}66`,
    borderRadius: 12, color: '#FFD700', fontFamily: "'Anton',sans-serif", outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{
      background: isLive ? 'rgba(239,68,68,0.07)' : saved ? 'rgba(255,215,0,0.04)' : 'rgba(255,255,255,0.032)',
      border: isLive
        ? '1px solid rgba(239,68,68,0.35)'
        : saved
          ? '1px solid rgba(255,215,0,0.3)'
          : bet
            ? '1px solid rgba(255,215,0,0.15)'
            : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, marginBottom: 12, overflow: 'hidden',
      boxShadow: saved ? '0 0 32px rgba(255,215,0,0.15)' : isLive ? '0 0 24px rgba(239,68,68,0.1)' : 'none',
      transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
    }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${groupColor},${groupColor}55,transparent)` }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, color: groupColor, padding: '3px 9px', border: `1px solid ${groupColor}55`, borderRadius: 5 }}>GRUPO {match.group}</span>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#EF4444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'wc-livePulse 1s infinite' }} />{match.minute}'
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: "'Barlow',sans-serif", textAlign: 'right', maxWidth: 170, lineHeight: 1.4 }}>
            {match.date.split('T')[1]?.slice(0, 5)} · {match.venue}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.home} size={48} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#fff', marginTop: 7, lineHeight: 1.2 }}>{match.home}</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: 120, flexShrink: 0 }}>
            {match.status !== 'upcoming' ? (
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 44, color: '#fff', lineHeight: 1, letterSpacing: 2 }}>
                {match.homeScore}<span style={{ color: 'rgba(255,255,255,0.22)', margin: '0 6px', fontSize: 32 }}>–</span>{match.awayScore}
              </div>
            ) : editing && canBetNow ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <input type="number" min="0" max="20" value={homeVal} onChange={e => setHomeVal(e.target.value)} style={numInp} />
                <span style={{ color: 'rgba(255,255,255,0.25)', fontFamily: "'Anton',sans-serif", fontSize: 26 }}>–</span>
                <input type="number" min="0" max="20" value={awayVal} onChange={e => setAwayVal(e.target.value)} style={numInp} />
              </div>
            ) : bet != null ? (
              <div>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 34, color: '#FFD700', letterSpacing: 2 }}>{bet.home}–{bet.away}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, fontFamily: "'Barlow Condensed',sans-serif", marginTop: 2 }}>TU APUESTA</div>
              </div>
            ) : (
              <div style={{ padding: '12px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 26, color: 'rgba(255,255,255,0.18)', letterSpacing: 3 }}>VS</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', fontFamily: "'Barlow',sans-serif", marginTop: 2 }}>sin apostar</div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.away} size={48} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 12, color: '#fff', marginTop: 7, lineHeight: 1.2 }}>{match.away}</div>
          </div>
        </div>

        {/* Probability bar — upcoming only */}
        {match.status === 'upcoming' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
              <div style={{ flex: prob.home, background: 'rgba(34,197,94,0.65)' }} />
              <div style={{ flex: prob.draw, background: 'rgba(255,215,0,0.45)' }} />
              <div style={{ flex: prob.away, background: 'rgba(239,68,68,0.65)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginTop: 3, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 0.5 }}>
              <span style={{ color: 'rgba(34,197,94,0.7)' }}>{prob.home}%</span>
              <span style={{ color: 'rgba(255,215,0,0.5)' }}>EMP {prob.draw}%</span>
              <span style={{ color: 'rgba(239,68,68,0.7)' }}>{prob.away}%</span>
            </div>
          </div>
        )}

        {/* Action area */}
        {match.status === 'upcoming' && (
          <div style={{ marginTop: 14 }}>
            {canBetNow ? (
              editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={save} style={{
                    flex: 1, padding: '13px',
                    background: saved
                      ? 'linear-gradient(135deg,#16a34a,#22C55E)'
                      : 'linear-gradient(135deg,#FFE566,#C9A62C)',
                    border: 'none', borderRadius: 10, color: '#000',
                    fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: 2, cursor: 'pointer',
                    transition: 'all 0.35s',
                    boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.5)' : '0 4px 20px rgba(201,166,44,0.45)',
                  }}>
                    {saved ? '✓ ¡APUESTA GUARDADA!' : bet != null ? 'ACTUALIZAR APUESTA' : '⚽ APOSTAR'}
                  </button>
                  {bet != null && (
                    <button onClick={() => setEditing(false)} style={{ padding: '13px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  )}
                </div>
              ) : (
                <button onClick={() => setEditing(true)} style={{
                  width: '100%', padding: '12px',
                  background: `rgba(${groupColor === '#FFD700' ? '255,215,0' : '255,255,255'},0.07)`,
                  border: `1px solid ${groupColor}44`, borderRadius: 10, color: groupColor,
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 2, cursor: 'pointer',
                }}>
                  {bet != null ? '✏️ MODIFICAR APUESTA' : '+ PONER APUESTA · $3.000 COP'}
                </button>
              )
            ) : (
              // Beautiful lockout UI
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(255,80,0,0.05))',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                animation: 'wc-lockPulse 3s ease-in-out infinite',
                border: '1px solid rgba(239,68,68,0.25)',
              }}>
                <div style={{
                  width: 42, height: 42, flexShrink: 0,
                  background: 'rgba(239,68,68,0.13)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, border: '1px solid rgba(239,68,68,0.3)',
                }}>🔒</div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#EF4444', lineHeight: 1 }}>APUESTAS CERRADAS</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif", marginTop: 4, lineHeight: 1.4 }}>
                    Cierre 5 min antes del pitazo inicial.<br />Las apuestas ya no se pueden cambiar.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Who bet — revealed once betting is locked */}
        {!canBetNow && otherBets && otherBets.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={() => setShowBets(s => !s)} style={{
              width: '100%', padding: '9px 14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, letterSpacing: 1,
            }}>
              <span>👥 {otherBets.length} {otherBets.length === 1 ? 'apuesta' : 'apuestas'} de otros jugadores</span>
              <span style={{ transition: 'transform 0.2s', transform: showBets ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
            </button>
            {showBets && (
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                {otherBets.map(ob => (
                  <div key={ob.username} style={{
                    padding: '8px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'Barlow',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{ob.username}</span>
                    <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 18, color: '#FFD700', letterSpacing: 1, flexShrink: 0 }}>{ob.bet.home}–{ob.bet.away}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Points result */}
        {pts !== null && bet != null && (
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 10,
            background: `rgba(${pts === 3 ? '34,197,94' : pts === 1 ? '255,215,0' : '107,114,128'},0.1)`,
            border: `1px solid rgba(${pts === 3 ? '34,197,94' : pts === 1 ? '255,215,0' : '107,114,128'},0.2)`,
          }}>
            <div>
              <div style={{ fontSize: 13, color: ptsColor, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                {pts === 3 ? '🎯 ¡Marcador exacto!' : pts === 1 ? '✅ Acertaste el ganador' : '❌ Sin puntos'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                Tu apuesta: {bet.home}–{bet.away} · Real: {match.homeScore}–{match.awayScore}
              </div>
            </div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 32, color: ptsColor, lineHeight: 1 }}>+{pts}</div>
          </div>
        )}
      </div>

      {burstKey > 0 && <GoldBurst key={burstKey} />}
    </div>
  );
}

interface MatchesScreenProps {
  user: User;
  bets: Record<string, Record<string, Bet>>;
  users: User[];
  matches: Match[];
  onBet: (matchId: string, home: number, away: number) => void;
}

export function MatchesScreen({ user, bets, users, matches, onBet }: MatchesScreenProps) {
  const [activeGroup, setActiveGroup] = useState('all');
  const [myBetsOnly, setMyBetsOnly] = useState(false);
  const userBets = bets[user.id] || {};

  const filtered = matches
    .filter(m => activeGroup === 'all' || m.group === activeGroup)
    .filter(m => !myBetsOnly || !!userBets[m.id]);

  const byDay = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    const day = m.date.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(m); return acc;
  }, {});

  const totalBets = Object.keys(userBets).length;
  const tabs = [{ key: 'all', label: 'TODOS', color: '#FFD700' }, ...Object.entries(GROUPS).map(([k, v]) => ({ key: k, label: k, color: v.color }))];

  return (
    <div style={{ padding: '82px 0 100px', position: 'relative', zIndex: 1 }}>
      {/* Group filter tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '0 16px 12px', scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(g => (
          <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 20, border: 'none',
            background: activeGroup === g.key ? g.color : 'rgba(255,255,255,0.07)',
            color: activeGroup === g.key && g.key !== 'all' ? '#fff' : activeGroup === g.key ? '#000' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12,
            letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: activeGroup === g.key ? 900 : 700,
          }}>{g.key === 'all' ? 'TODOS' : `GRP ${g.label}`}</button>
        ))}
      </div>

      {/* Toolbar: stats + "Mis apuestas" toggle */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>
          <span style={{ color: totalBets > 0 ? '#FFD700' : undefined }}>{totalBets}</span> / {matches.length} APOSTADOS
        </div>
        <button onClick={() => setMyBetsOnly(v => !v)} style={{
          padding: '7px 16px', borderRadius: 20, border: 'none',
          background: myBetsOnly
            ? 'linear-gradient(135deg,#FFE566,#C9A62C)'
            : 'rgba(255,255,255,0.07)',
          color: myBetsOnly ? '#000' : 'rgba(255,255,255,0.5)',
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11,
          letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
        }}>
          ⭐ MIS APUESTAS
        </button>
      </div>

      <div style={{ padding: '16px 16px 0', maxWidth: 600, margin: '0 auto' }}>
        {Object.entries(byDay).map(([day, dayMatches]) => {
          const date = new Date(day + 'T12:00');
          const dayNum = date.getDate();
          const month = date.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
          const weekday = date.toLocaleDateString('es-CO', { weekday: 'long' }).toUpperCase();
          const betCount = dayMatches.filter(m => userBets[m.id]).length;
          const allBet = betCount === dayMatches.length;

          return (
            <div key={day} style={{ marginBottom: 36 }}>
              {/* Premium date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  minWidth: 54, textAlign: 'center', flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(201,166,44,0.18),rgba(201,166,44,0.06))',
                  border: '1px solid rgba(255,215,0,0.22)',
                  borderRadius: 12, padding: '8px 10px',
                }}>
                  <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, color: '#FFD700', lineHeight: 1 }}>{dayNum}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: 'rgba(255,215,0,0.6)', letterSpacing: 2, marginTop: 2 }}>{month}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 2, lineHeight: 1 }}>{weekday}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif", marginTop: 3 }}>
                    {dayMatches.length} {dayMatches.length === 1 ? 'partido' : 'partidos'}
                    {betCount > 0 && <span style={{ color: '#FFD700', marginLeft: 6 }}>· {betCount} apostados</span>}
                  </div>
                </div>
                {/* Progress ring */}
                {betCount > 0 && (
                  <div style={{
                    width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
                    border: `2px solid rgba(255,215,0,${allBet ? '0.7' : '0.3'})`,
                    background: allBet ? 'rgba(255,215,0,0.12)' : 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 12, color: '#FFD700', lineHeight: 1 }}>{betCount}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,215,0,0.5)', lineHeight: 1 }}>/{dayMatches.length}</div>
                  </div>
                )}
              </div>

              {dayMatches.map(m => {
                const notBettable = !canBet(m.date, m.status);
                const otherBets: OtherBet[] = notBettable
                  ? users.filter(u => u.id !== user.id && bets[u.id]?.[m.id]).map(u => ({ username: u.username, bet: bets[u.id][m.id] }))
                  : [];
                return (
                  <MatchBetCard key={m.id} match={m} bet={userBets[m.id]}
                    canBetNow={canBet(m.date, m.status)}
                    onBet={(h, a) => onBet(m.id, h, a)}
                    otherBets={otherBets}
                  />
                );
              })}
            </div>
          );
        })}

        {Object.keys(byDay).length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'rgba(255,255,255,0.18)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>⚽</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, letterSpacing: 3 }}>
              {myBetsOnly ? 'AÚN NO HAS APOSTADO' : 'SIN PARTIDOS'}
            </div>
            {myBetsOnly && (
              <div style={{ fontSize: 12, marginTop: 8, fontFamily: "'Barlow',sans-serif", opacity: 0.7 }}>
                Toca "TODOS" para ver todos los partidos y apostar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
