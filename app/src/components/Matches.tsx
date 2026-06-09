import { useState, useEffect, type CSSProperties } from 'react';
import { GROUPS, calculatePoints, canBet, fmtDate, type Match } from '../lib/data';
import type { User, Bet } from '../lib/state';
import { FlagBadge } from './Shared';

interface MatchBetCardProps {
  match: Match;
  bet?: Bet;
  canBetNow: boolean;
  onBet: (home: number, away: number) => void;
}

export function MatchBetCard({ match, bet, canBetNow, onBet }: MatchBetCardProps) {
  const [homeVal, setHomeVal] = useState(bet != null ? String(bet.home) : '');
  const [awayVal, setAwayVal] = useState(bet != null ? String(bet.away) : '');
  const [editing, setEditing] = useState(!bet && match.status === 'upcoming' && canBetNow);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (bet != null) { setHomeVal(String(bet.home)); setAwayVal(String(bet.away)); }
  }, [bet]);

  const groupColor = GROUPS[match.group]?.color || '#FFD700';
  const isLive = match.status === 'live';
  const isDone = match.status === 'finished';

  const save = () => {
    const h = parseInt(homeVal), a = parseInt(awayVal);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onBet(h, a); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const pts = isDone && bet != null ? calculatePoints(bet.home, bet.away, match.homeScore!, match.awayScore!) : null;
  const ptsColor = pts === 3 ? '#22C55E' : pts === 1 ? '#FFD700' : '#6B7280';

  const numInp: CSSProperties = {
    width: 56, height: 56, textAlign: 'center', fontSize: 28,
    background: 'rgba(255,255,255,0.08)', border: `1.5px solid ${groupColor}66`,
    borderRadius: 10, color: '#FFD700', fontFamily: "'Anton',sans-serif", outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      background: isLive ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.035)',
      border: isLive ? '1px solid rgba(239,68,68,0.35)' : bet ? '1px solid rgba(255,215,0,0.15)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, marginBottom: 12, overflow: 'hidden',
      boxShadow: isLive ? '0 0 24px rgba(239,68,68,0.1)' : 'none',
    }}>
      {/* Color bar top */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${groupColor},${groupColor}55,transparent)` }} />

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header: group + venue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, color: groupColor, padding: '3px 9px', border: `1px solid ${groupColor}55`, borderRadius: 5 }}>GRUPO {match.group}</span>
            {isLive && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#EF4444', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'wc-livePulse 1s infinite' }} />{match.minute}'
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontFamily: "'Barlow',sans-serif", textAlign: 'right', maxWidth: 160, lineHeight: 1.3 }}>
            {match.date.split('T')[1]?.slice(0, 5) || ''} · {match.venue}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Home */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.home} size={52} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>{match.home}</div>
          </div>

          {/* Score / Input / VS */}
          <div style={{ textAlign: 'center', minWidth: 120, flexShrink: 0 }}>
            {match.status !== 'upcoming' ? (
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 44, color: '#fff', lineHeight: 1, letterSpacing: 2 }}>
                {match.homeScore}
                <span style={{ color: 'rgba(255,255,255,0.22)', margin: '0 6px', fontSize: 32 }}>–</span>
                {match.awayScore}
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

          {/* Away */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FlagBadge country={match.away} size={52} />
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 1.2 }}>{match.away}</div>
          </div>
        </div>

        {/* Action area */}
        {match.status === 'upcoming' && (
          <div style={{ marginTop: 14 }}>
            {canBetNow ? (
              editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={save} style={{
                    flex: 1, padding: '13px',
                    background: saved ? 'linear-gradient(135deg,#16a34a,#22C55E)' : 'linear-gradient(135deg,#FFE566,#C9A62C)',
                    border: 'none', borderRadius: 10, color: '#000',
                    fontFamily: "'Anton',sans-serif", fontSize: 16, letterSpacing: 2, cursor: 'pointer',
                    transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(201,166,44,0.4)',
                  }}>
                    {saved ? '✓ APUESTA GUARDADA' : bet != null ? 'ACTUALIZAR APUESTA' : '⚽ APOSTAR'}
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
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.22)', fontFamily: "'Barlow',sans-serif", padding: '8px 0' }}>
                🔒 Cierre de apuestas — falta menos de 5 min
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
    </div>
  );
}

interface MatchesScreenProps {
  user: User;
  bets: Record<string, Record<string, Bet>>;
  matches: Match[];
  onBet: (matchId: string, home: number, away: number) => void;
}

export function MatchesScreen({ user, bets, matches, onBet }: MatchesScreenProps) {
  const [activeGroup, setActiveGroup] = useState('all');
  const userBets = bets[user.id] || {};

  const filtered = activeGroup === 'all' ? matches : matches.filter(m => m.group === activeGroup);
  const byDay = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    const day = m.date.split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(m); return acc;
  }, {});

  const tabs = [{ key: 'all', label: 'TODOS', color: '#FFD700' }, ...Object.entries(GROUPS).map(([k, v]) => ({ key: k, label: k, color: v.color }))];

  return (
    <div style={{ padding: '82px 0 100px', position: 'relative', zIndex: 1 }}>
      {/* Group tabs */}
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

      <div style={{ padding: '12px 16px 0', maxWidth: 600, margin: '0 auto' }}>
        {Object.entries(byDay).map(([day, dayMatches]) => (
          <div key={day} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                {fmtDate(day + 'T12:00')}
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            {dayMatches.map(m => (
              <MatchBetCard key={m.id} match={m} bet={userBets[m.id]}
                canBetNow={canBet(m.date, m.status)}
                onBet={(h, a) => onBet(m.id, h, a)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
