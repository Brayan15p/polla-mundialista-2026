import { useState, type CSSProperties } from 'react';
import { FLAGS, type Match } from '../lib/data';
import { cloudDiagnose } from '../lib/cloud';

interface AdminScreenProps {
  matches: Match[];
  onClose: () => void;
  onUpdateResult: (matchId: string, home: number, away: number, homePens?: number, awayPens?: number) => void;
  onSyncMatches?: () => Promise<{ error?: string }>;
  onExport?: () => void;
}

export function AdminScreen({ matches, onClose, onUpdateResult, onSyncMatches, onExport }: AdminScreenProps) {
  const [vals, setVals] = useState<Record<string, { home: string; away: string; hp?: string; ap?: string }>>(
    Object.fromEntries(matches.map(m => [m.id, {
      home: m.homeScore?.toString() ?? '', away: m.awayScore?.toString() ?? '',
      hp: m.homePens?.toString() ?? '', ap: m.awayPens?.toString() ?? '',
    }]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [syncMsg, setSyncMsg] = useState('');
  const [diagLines, setDiagLines] = useState<string[] | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);

  const sync = async () => {
    if (!onSyncMatches) return;
    setSyncMsg('Sincronizando…');
    const res = await onSyncMatches();
    setSyncMsg(res.error ? `Error: ${res.error}` : '✓ Partidos sincronizados — bloqueo de apuestas activo');
    setTimeout(() => setSyncMsg(''), 4000);
  };

  const save = (id: string) => {
    const v = vals[id];
    const h = parseInt(v.home), a = parseInt(v.away);
    if (isNaN(h) || isNaN(a)) return;
    // A knockout tie level after 90' is decided on penalties; capture them so the
    // bracket can advance the right team. Ignored for non-draws / group games.
    const m = matches.find(x => x.id === id);
    let hp: number | undefined, ap: number | undefined;
    if (m?.stage && h === a) {
      const ph = parseInt(v.hp ?? ''), pa = parseInt(v.ap ?? '');
      if (!isNaN(ph) && !isNaN(pa)) { hp = ph; ap = pa; }
    }
    onUpdateResult(id, h, a, hp, ap);
    setSaved(p => ({ ...p, [id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [id]: false })), 2200);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030306', zIndex: 300, overflowY: 'auto', padding: '24px 16px 100px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, padding: 0 }}>←</button>
          <div>
            <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, color: '#FFD700', letterSpacing: 3 }}>ADMIN — RESULTADOS</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: "'Barlow',sans-serif" }}>Ingresa los resultados para calcular puntos</div>
          </div>
        </div>

        {onSyncMatches && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.22)', borderRadius: 14 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#FFD700', letterSpacing: 1 }}>🛡️ ANTI-FRAUDE</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Barlow',sans-serif", margin: '4px 0 10px', lineHeight: 1.5 }}>
              Sincroniza los horarios de los partidos a la nube para activar el bloqueo de apuestas (5 min antes del pitazo) en el servidor.
            </div>
            <button onClick={sync} style={{
              padding: '10px 18px', background: 'linear-gradient(135deg,#FFE566,#C9A62C)', border: 'none',
              borderRadius: 10, color: '#000', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}>🔄 SINCRONIZAR PARTIDOS</button>
            {syncMsg && <span style={{ marginLeft: 12, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: "'Barlow',sans-serif" }}>{syncMsg}</span>}
          </div>
        )}
        {/* Backup panel */}
        {onExport && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 14 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#22C55E', letterSpacing: 1 }}>💾 RESPALDO (BACKUP)</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Barlow',sans-serif", margin: '4px 0 10px', lineHeight: 1.5 }}>
              Descarga un JSON con todos los jugadores, apuestas y resultados. Guárdalo seguro: es un respaldo manual además de los backups de Supabase.
            </div>
            <button onClick={onExport} style={{
              padding: '10px 18px', background: 'linear-gradient(135deg,#4ADE80,#16A34A)', border: 'none',
              borderRadius: 10, color: '#000', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: 1, cursor: 'pointer',
            }}>💾 DESCARGAR BACKUP (JSON)</button>
          </div>
        )}
        {/* Diagnostics panel */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 14 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#3B82F6', letterSpacing: 1 }}>🔍 DIAGNÓSTICO DE LA NUBE</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Barlow',sans-serif", margin: '4px 0 10px', lineHeight: 1.5 }}>
            Verifica que Supabase esté bien configurado: auth, tablas, permisos de lectura/escritura.
          </div>
          <button onClick={async () => { setDiagRunning(true); setDiagLines(await cloudDiagnose()); setDiagRunning(false); }} disabled={diagRunning} style={{
            padding: '10px 18px', background: diagRunning ? '#555' : 'linear-gradient(135deg,#60A5FA,#3B82F6)', border: 'none',
            borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: 1, cursor: diagRunning ? 'wait' : 'pointer',
          }}>{diagRunning ? '⏳ VERIFICANDO…' : '🔍 EJECUTAR DIAGNÓSTICO'}</button>
          {diagLines && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderRadius: 10, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8, color: '#E2E8F0', whiteSpace: 'pre-wrap' }}>
              {diagLines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
        </div>

        {matches.map(m => {
          const v = vals[m.id] || { home: '', away: '', hp: '', ap: '' };
          const inpS: CSSProperties = { width: 52, height: 48, textAlign: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8, color: '#FFD700', fontFamily: "'Anton',sans-serif", fontSize: 26, outline: 'none' };
          const penInpS: CSSProperties = { width: 40, height: 36, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 7, color: '#93C5FD', fontFamily: "'Anton',sans-serif", fontSize: 18, outline: 'none' };
          // Penalty inputs appear only for a knockout tie entered as a draw.
          const h = parseInt(v.home), a = parseInt(v.away);
          const koDraw = !!m.stage && !isNaN(h) && !isNaN(a) && h === a;
          return (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>
                  {FLAGS[m.home]} {m.home} vs {m.away} {FLAGS[m.away]}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {m.group && `Grupo ${m.group} · `}{m.stage && `${m.stage} · `}{m.status} · {m.date.split('T')[0]}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min="0" max="20" value={v.home} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, home: e.target.value } }))} style={inpS} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Anton',sans-serif", fontSize: 22 }}>–</span>
                  <input type="number" min="0" max="20" value={v.away} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, away: e.target.value } }))} style={inpS} />
                  <button onClick={() => save(m.id)} style={{
                    padding: '10px 14px', background: saved[m.id] ? '#22C55E' : '#FFD700',
                    border: 'none', borderRadius: 8, color: '#000',
                    fontFamily: "'Anton',sans-serif", fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
                  }}>{saved[m.id] ? '✓' : 'OK'}</button>
                </div>
                {koDraw && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 11, color: '#60A5FA', letterSpacing: 1 }}>PENALES</span>
                    <input type="number" min="0" max="30" placeholder="0" value={v.hp ?? ''} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, hp: e.target.value } }))} style={penInpS} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Anton',sans-serif", fontSize: 16 }}>–</span>
                    <input type="number" min="0" max="30" placeholder="0" value={v.ap ?? ''} onChange={e => setVals(p => ({ ...p, [m.id]: { ...v, ap: e.target.value } }))} style={penInpS} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
