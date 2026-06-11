import { PLAYERS, pointsFor, type Match } from '../lib/data';
import type { User, Bet } from '../lib/state';
import { AvatarBubble } from './Shared';

interface LeaderboardScreenProps {
  users: User[];
  bets: Record<string, Record<string, Bet>>;
  matches: Match[];
  currentUser: User;
}

const GREY = 'rgba(255,255,255,0.25)';

export function LeaderboardScreen({ users, bets, matches, currentUser }: LeaderboardScreenProps) {
  const scored = [...users].map(u => {
    const ub = bets[u.id] || {};
    // Every finished match counts; missing bets play as the 0–0 default.
    let pts = 0, exact = 0, correct = 0, total = 0, placed = 0;
    matches.forEach(m => {
      if (m.status !== 'finished') return;
      total++;
      if (ub[m.id]) placed++;
      const p = pointsFor(ub[m.id], m);
      pts += p; if (p === 3) exact++; if (p >= 1) correct++;
    });
    return { ...u, pts, exact, correct, total, placed };
  }).sort((a, b) => b.pts - a.pts || a.username.localeCompare(b.username));

  // Tie-aware competition ranking: equal points share the same position
  // (e.g. two leaders both #1, the next is #3).
  const rankings = scored.map((u, i, arr) => {
    const rank = i > 0 && arr[i - 1].pts === u.pts ? (arr[i - 1] as any)._rank : i + 1;
    return { ...u, _rank: rank };
  });

  // Has anyone actually scored yet? Drives the whole "pre-kickoff" look.
  const started = rankings.some(u => u.pts > 0);

  const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalFor = (rank: number) => (started && rank <= 3 ? medals[rank - 1] : GREY);

  const podiumH = [140, 185, 110];
  const podiumOrder = rankings.length >= 3 ? [rankings[1], rankings[0], rankings[2]] : rankings;
  const podiumRanks = [2, 1, 3];

  return (
    <div style={{ padding: '82px 16px 100px', maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <img src="/uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 60, filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.8))', animation: 'wc-float 3.5s ease-in-out infinite', marginBottom: 6 }} />
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 34, background: 'linear-gradient(135deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 5 }}>CLASIFICACIÓN</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4, fontFamily: "'Barlow',sans-serif" }}>
          {started ? 'Tabla en tiempo real' : 'Aún sin puntos'} · {rankings.length} participantes
        </div>
      </div>

      {/* Pre-kickoff banner — shown until the first points land */}
      {!started && (
        <div style={{
          textAlign: 'center', margin: '18px auto 22px', maxWidth: 420,
          padding: '14px 18px', borderRadius: 14,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          fontFamily: "'Barlow',sans-serif",
        }}>
          <div style={{ fontSize: 22 }}>🏁</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 0.5, marginTop: 2 }}>
            EL TORNEO ESTÁ POR COMENZAR
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
            Todos empatados en 0 pts · el podio aparece con el primer resultado
          </div>
        </div>
      )}

      {/* Podium — only once there's a real score to show */}
      {started && rankings.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 28, justifyContent: 'center', marginTop: 20 }}>
          {podiumOrder.map((u, i) => {
            const rank = podiumRanks[i];
            const c = medals[rank - 1];
            const pl = PLAYERS.find(p => p.id === u.playerId);
            return (
              <div key={u.id} style={{ flex: 1, maxWidth: 155, textAlign: 'center' }}>
                <AvatarBubble player={pl} size={rank === 1 ? 56 : 44} />
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingBottom: 2 }}>{u.username}</div>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 20, color: c, marginBottom: 6 }}>{u.pts} pts</div>
                <div style={{
                  height: podiumH[i], background: `linear-gradient(to top, ${c}22, ${c}44)`,
                  border: `2px solid ${c}`, borderBottom: 'none',
                  borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "'Anton',sans-serif", fontSize: 52, color: c, opacity: 0.55 }}>#{u._rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {rankings.map((u, i) => {
        const pl = PLAYERS.find(p => p.id === u.playerId);
        const isMe = u.id === currentUser.id;
        const c = medalFor(u._rank);
        const onPodium = started && u._rank <= 3;
        return (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px', marginBottom: 8,
            background: isMe ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.03)',
            border: isMe ? '1px solid rgba(255,215,0,0.28)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            animation: started && i === 0 ? 'wc-cardGlow 3s ease-in-out infinite' : 'none',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: onPodium ? `${c}18` : 'rgba(255,255,255,0.04)',
              border: `2px solid ${onPodium ? c : 'rgba(255,255,255,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Anton',sans-serif", fontSize: 13,
              color: onPodium ? c : 'rgba(255,255,255,0.3)',
            }}>#{u._rank}</div>
            <AvatarBubble player={pl} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {u.username}
                {isMe && <span style={{ fontSize: 9, color: '#FFD700', letterSpacing: 1 }}>▸ TÚ</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'Barlow',sans-serif" }}>
                {started
                  ? `${u.exact} exactos · ${u.correct} acertados · ${u.placed}/${u.total} con apuesta`
                  : 'Listo para jugar'}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, color: onPodium ? c : '#fff', lineHeight: 1 }}>{u.pts}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>PTS</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
