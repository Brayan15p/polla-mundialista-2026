import { canBet, teamsKnown, pointsFor, type Match, type BetKind } from '../lib/data';
import type { User, Bet } from '../lib/state';
import { MatchBetCard, type BetPayload } from './Matches';

interface MyBetsScreenProps {
  user: User;
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matches: Match[];
  onBet: (matchId: string, payload: BetPayload) => void;
}

export function MyBetsScreen({ user, users, bets, matches, onBet }: MyBetsScreenProps) {
  const userBets = bets[user.id] || {};
  const mine = matches
    .filter(m => userBets[m.id])
    .sort((a, b) => a.date.localeCompare(b.date));

  let pts = 0, exact = 0, played = 0, pending = 0;
  mine.forEach(m => {
    if (m.status === 'finished') { const p = pointsFor(userBets[m.id], m); pts += p; if (p === 3) exact++; played++; }
    else pending++;
  });

  const stat = (value: number | string, label: string, color: string) => (
    <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 6px' }}>
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, fontFamily: "'Barlow Condensed',sans-serif", marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, background: 'linear-gradient(135deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 4 }}>MIS APUESTAS</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 2, fontFamily: "'Barlow',sans-serif" }}>Todo lo que has jugado, {user.username}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {stat(pts, 'PUNTOS', '#FFD700')}
        {stat(exact, 'EXACTOS', '#22C55E')}
        {stat(mine.length, 'APUESTAS', '#3B82F6')}
        {stat(pending, 'PENDIENTES', '#EC4899')}
      </div>

      {mine.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎟️</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, letterSpacing: 3 }}>AÚN NO HAS APOSTADO</div>
          <div style={{ fontSize: 13, marginTop: 8, fontFamily: "'Barlow',sans-serif", opacity: 0.7 }}>Ve a PARTIDOS y haz tu primera apuesta ⚽</div>
        </div>
      ) : (
        <>
          {pending > 0 && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>
              ⏳ POR JUGARSE ({pending})
            </div>
          )}
          {mine.filter(m => m.status !== 'finished').map(m => (
            <MatchBetCard key={m.id} match={m} bet={userBets[m.id]} canBetNow={canBet(m.date, m.status) && teamsKnown(m)} onBet={p => onBet(m.id, p)} />
          ))}

          {played > 0 && (
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', margin: '20px 0 12px' }}>
              ✅ YA JUGADOS ({played})
            </div>
          )}
          {mine.filter(m => m.status === 'finished').map(m => {
            const participants = users
              .map(u => {
                const b = bets[u.id]?.[m.id];
                return { username: u.username, isMe: u.id === user.id, home: b?.home ?? 0, away: b?.away ?? 0, kind: (b?.kind ?? 'score') as BetKind, pick: b?.pick, hasBet: !!b, isDefault: !b, points: pointsFor(b, m) };
              })
              .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
            return (
              <MatchBetCard key={m.id} match={m} bet={userBets[m.id]} canBetNow={false} onBet={p => onBet(m.id, p)} participants={participants} />
            );
          })}
        </>
      )}
    </div>
  );
}
