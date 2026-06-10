// wc-intro.jsx v2 — Epic FIFA-style intro + Auth + Player Select

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────────
function Particles({ count = 200, footballs = true }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const onR = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onR);

    const balls = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h + 80,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 1.6 + 0.4),
      r: Math.random() * 2.5 + 0.5,
      a: Math.random() * 0.8 + 0.2,
      color: i % 7 === 0 ? '#C9A62C' : i % 5 === 0 ? '#FFFFFF' : i % 3 === 0 ? '#FFD700' : 'rgba(255,255,255,0.6)',
      decay: 0.0015 + Math.random() * 0.003,
      isFootball: footballs && Math.random() > 0.93,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of balls) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.a);
        if (p.isFootball) {
          ctx.font = `${p.r * 8}px serif`;
          ctx.fillText('⚽', p.x, p.y);
        } else {
          ctx.shadowColor = p.color; ctx.shadowBlur = p.r * 8;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.a -= p.decay;
        if (p.a <= 0 || p.y < -20) {
          Object.assign(p, { x: Math.random() * w, y: h + 20, a: 0.6 + Math.random() * 0.4, vy: -(Math.random() * 1.6 + 0.4) });
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
function Confetti({ active }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const cols = ['#FFD700','#FF6B35','#22C55E','#3B82F6','#EC4899','#FFFFFF','#C9A62C'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 300,
      y: h / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 12 + 4),
      g: 0.35, a: 1, w: 8 + Math.random() * 8, h: 6 + Math.random() * 6,
      color: cols[Math.floor(Math.random() * cols.length)],
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.25,
    }));
    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of pieces) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.a -= 0.012;
        if (p.a <= 0) continue; alive++;
        ctx.save();
        ctx.globalAlpha = p.a; ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />;
}
window.Confetti = Confetti;

// ─── INTRO ANIMATION ─────────────────────────────────────────────────────────
function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 5000),
      setTimeout(() => setPhase(6), 6200),
      setTimeout(() => setPhase(7), 7400),
      setTimeout(() => onComplete(), 8400),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onComplete]);

  const ease = 'cubic-bezier(0.22,1,0.36,1)';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* WC-6 groups image — faint background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(uploads/WC-6.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: phase >= 2 ? 0.08 : 0, transition: 'opacity 3s',
        filter: 'blur(2px) saturate(0.5)',
      }} />

      {/* Stadium radial light sweep */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(201,166,44,0.07) 15deg, transparent 30deg, rgba(201,166,44,0.04) 50deg, transparent 70deg, rgba(201,166,44,0.07) 120deg, transparent 140deg)',
        animation: 'wc-rotateSlow 30s linear infinite',
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 2s',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
        animation: 'wc-scan 4s linear infinite',
        opacity: phase >= 2 ? 0.6 : 0, transition: 'opacity 1s',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <Particles count={220} footballs={true} />

      {/* Gold radial glow */}
      <div style={{
        position: 'absolute',
        width: '70vw', height: '70vw', maxWidth: 700, maxHeight: 700,
        background: 'radial-gradient(circle, rgba(201,166,44,0.25) 0%, rgba(201,166,44,0.08) 35%, transparent 65%)',
        borderRadius: '50%',
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 2.5s',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Trophy */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center',
        transform: phase >= 2
          ? 'translateY(0) scale(1)'
          : phase >= 1
          ? 'translateY(60px) scale(0.7)'
          : 'translateY(140px) scale(0.5)',
        opacity: phase >= 1 ? 1 : 0,
        transition: `transform 2.4s ${ease}, opacity 1.5s`,
        filter: phase >= 3
          ? 'drop-shadow(0 0 50px rgba(255,215,0,0.95)) drop-shadow(0 0 100px rgba(255,165,0,0.55))'
          : 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
        animation: phase >= 3 ? 'wc-float 3.5s ease-in-out infinite' : 'none',
        marginBottom: 8,
      }}>
        <img src="uploads/pasted-1781013290237-0.png" alt="FIFA World Cup Trophy"
          style={{ width: 'min(280px,48vw)', display: 'block', margin: '0 auto' }} />
      </div>

      {/* FIFA WC 2026 subtitle */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center',
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.9s ${ease} 0.1s`,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: 'clamp(12px,2vw,22px)', color: 'rgba(255,255,255,0.55)',
          letterSpacing: 7, textTransform: 'uppercase',
        }}>FIFA WORLD CUP 2026™</div>
      </div>

      {/* POLLA MUNDIALISTA */}
      <div style={{
        position: 'relative', zIndex: 3, textAlign: 'center', marginTop: 4,
        opacity: phase >= 4 ? 1 : 0,
        transform: phase >= 4 ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(30px)',
        transition: 'all 1.1s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          fontFamily: "'Anton',sans-serif",
          fontSize: 'clamp(44px,10vw,116px)',
          lineHeight: 0.9,
          background: 'linear-gradient(180deg, #FFE566 0%, #C9A62C 45%, #FFD700 75%, #9A7200 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 6,
          filter: 'drop-shadow(0 4px 24px rgba(201,166,44,0.6))',
          animation: phase >= 4 ? 'wc-goldPulseText 2.5s ease-in-out infinite' : 'none',
        }}>
          POLLA<br />MUNDIALISTA
        </div>
      </div>

      {/* Host nations */}
      <div style={{
        position: 'relative', zIndex: 3, display: 'flex', gap: 16,
        alignItems: 'center', marginTop: 22,
        opacity: phase >= 5 ? 1 : 0,
        transform: phase >= 5 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.8s ease 0.15s',
      }}>
        {[['🇺🇸','USA'],['🇨🇦','CANADA'],['🇲🇽','MÉXICO']].map(([flag,name],i) => (
          <div key={i} style={{
            textAlign: 'center',
            opacity: phase >= 5 ? 1 : 0,
            transition: `opacity 0.6s ${i * 0.12 + 0.2}s`,
          }}>
            <div style={{ fontSize: 32, lineHeight: 1 }}>{flag}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 2, marginTop: 3 }}>{name}</div>
          </div>
        ))}
      </div>

      {/* Tagline badge */}
      <div style={{
        position: 'relative', zIndex: 3, marginTop: 18,
        opacity: phase >= 6 ? 1 : 0,
        transition: 'opacity 0.8s 0.2s',
      }}>
        <div style={{
          background: 'linear-gradient(90deg, rgba(201,166,44,0.15), rgba(201,166,44,0.3), rgba(201,166,44,0.15))',
          border: '1px solid rgba(255,215,0,0.4)',
          padding: '8px 28px', borderRadius: 2,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          fontSize: 13, letterSpacing: 4, color: '#FFD700',
        }}>
          ⚽ APUESTA · COMPITE · GANA LA BOLSA ⚽
        </div>
      </div>

      {/* White flash out */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 8,
        background: '#fff',
        opacity: phase === 7 ? 0.5 : 0,
        transition: phase === 7 ? 'opacity 0.1s' : 'opacity 1.5s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 8,
        background: '#000',
        opacity: phase >= 7 ? 0.7 : 0,
        transition: 'opacity 1.2s 0.15s',
        pointerEvents: 'none',
      }} />

      <button onClick={onComplete} style={{
        position: 'absolute', bottom: 28, right: 28, zIndex: 10,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
        color: 'rgba(255,255,255,0.5)', padding: '8px 22px', borderRadius: 4,
        fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, letterSpacing: 3, fontWeight: 700, cursor: 'pointer',
      }}>SALTAR ›</button>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode]   = React.useState('login');
  const [form, setForm]   = React.useState({ username: '', email: '', password: '', joinPool: true });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault(); setError('');
    if (!form.email || !form.password) { setError('Completa todos los campos'); return; }
    if (mode === 'register' && !form.username) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === 'login') onLogin(form.email, form.password);
      else onRegister({ username: form.username, email: form.email, password: form.password, joinPool: form.joinPool });
    }, 600);
  };

  const inp = {
    width: '100%', padding: '14px 16px', fontSize: 16,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#fff', outline: 'none',
    fontFamily: "'Barlow',sans-serif", transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* BG layers */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(201,166,44,0.14) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(0,40,120,0.1) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('uploads/pasted-1781013290237-0.png')", backgroundSize: '38%', backgroundPosition: 'center 55%', backgroundRepeat: 'no-repeat', opacity: 0.04, filter: 'grayscale(1)' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <img src="uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 72, display: 'block', margin: '0 auto 14px', filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.7))' }} />
        <div style={{
          fontFamily: "'Anton',sans-serif", fontSize: 'clamp(30px,6vw,52px)',
          background: 'linear-gradient(180deg,#FFE566 0%,#C9A62C 55%,#FFD700 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 5, lineHeight: 0.95,
        }}>POLLA<br />MUNDIALISTA</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 4, marginTop: 8, fontFamily: "'Barlow Condensed',sans-serif" }}>FIFA WORLD CUP 2026™</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '28px 28px 24px', backdropFilter: 'blur(24px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        {/* Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[['login', 'INICIAR SESIÓN'], ['register', 'REGISTRARSE']].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '11px 0', border: 'none', borderRadius: 9,
              background: mode === m ? '#FFD700' : 'transparent',
              color: mode === m ? '#000' : 'rgba(255,255,255,0.4)',
              fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
              fontSize: 12, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.25s',
            }}>{lbl}</button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input placeholder="Nombre de usuario" value={form.username} onChange={e => set('username', e.target.value)} style={inp} />
          )}
          <input type="email" placeholder="Correo electrónico" value={form.email} onChange={e => set('email', e.target.value)} style={inp} />
          <input type="password" placeholder="Contraseña" value={form.password} onChange={e => set('password', e.target.value)} style={inp} />

          {mode === 'register' && (
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.22)', borderRadius: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.joinPool} onChange={e => set('joinPool', e.target.checked)} style={{ marginTop: 2, accentColor: '#FFD700', width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>🏆 UNIRME A LA BOLSA GENERAL</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>$100.000 COP · El ganador se lleva todo</div>
              </div>
            </label>
          )}

          {error && <div style={{ color: '#FF6B6B', fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            padding: '16px', marginTop: 4,
            background: loading ? '#8a7200' : 'linear-gradient(135deg,#FFE566,#C9A62C)',
            border: 'none', borderRadius: 12, color: '#000',
            fontFamily: "'Anton',sans-serif", fontSize: 19, letterSpacing: 3,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 24px rgba(201,166,44,0.4)',
          }}>{loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={() => onLogin('demo@polla.com', 'demo123')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.22)', fontSize: 12, cursor: 'pointer', fontFamily: "'Barlow',sans-serif", textDecoration: 'underline' }}>
            Acceso demo rápido →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FIFA PLAYER CARD ─────────────────────────────────────────────────────────
function FifaCard({ player, selected, onClick }) {
  const { FLAGS } = window.WC_DATA;
  const tierStyles = {
    legend: { bg: 'linear-gradient(160deg,#2a1a00,#5a3800,#2a1a00)', border: '2px solid #FFD700', glow: 'rgba(255,200,0,0.7)', badge: '#FFD700', badgeTxt: '#000' },
    gold:   { bg: 'linear-gradient(160deg,#1a1a00,#3a3000,#1a1a00)', border: '1.5px solid #C9A62C', glow: 'rgba(201,166,44,0.55)', badge: '#C9A62C', badgeTxt: '#000' },
    silver: { bg: 'linear-gradient(160deg,#111520,#1e2540,#111520)', border: '1.5px solid rgba(192,192,192,0.6)', glow: 'rgba(192,192,192,0.3)', badge: '#aaa', badgeTxt: '#000' },
    bronze: { bg: 'linear-gradient(160deg,#1a1000,#2a2010,#1a1000)', border: '1.5px solid rgba(205,127,50,0.6)', glow: 'rgba(205,127,50,0.3)', badge: '#CD7F32', badgeTxt: '#000' },
  };
  const ts = tierStyles[player.tier] || tierStyles.bronze;
  const flag = FLAGS[player.country] || '🏴';

  return (
    <div onClick={onClick} style={{
      width: 130, position: 'relative', cursor: 'pointer',
      background: ts.bg,
      border: selected ? '2.5px solid #FFD700' : ts.border,
      borderRadius: 14, padding: '14px 10px 12px',
      textAlign: 'center',
      transform: selected ? 'scale(1.08) translateY(-6px)' : 'scale(1)',
      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: selected
        ? `0 16px 48px ${ts.glow}, 0 0 30px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)`
        : `0 4px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
      overflow: 'hidden',
    }}>
      {/* Card inner shine */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.06),transparent)', borderRadius: '14px 14px 0 0', pointerEvents: 'none' }} />

      {/* Tier badge */}
      <div style={{ position: 'absolute', top: 8, left: 8, background: ts.badge, color: ts.badgeTxt, fontFamily: "'Anton',sans-serif", fontSize: 10, letterSpacing: 1, padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
        {player.tier === 'legend' ? 'LEYENDA' : player.tier.toUpperCase()}
      </div>

      {/* Jersey number */}
      <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 52, lineHeight: 1, color: player.tier === 'legend' || player.tier === 'gold' ? '#FFD700' : 'rgba(255,255,255,0.55)', textShadow: `0 0 20px ${ts.glow}` }}>
        {player.number}
      </div>

      {/* Flag */}
      <div style={{ fontSize: 30, margin: '4px 0', lineHeight: 1 }}>{flag}</div>

      {/* Silhouette SVG */}
      <div style={{ margin: '6px auto 2px', width: 52, height: 68 }}>
        <svg viewBox="0 0 60 90" width="52" height="68" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill={player.tier === 'legend' || player.tier === 'gold' ? '#FFD700' : player.kitA} opacity="0.85"
            dangerouslySetInnerHTML={{ __html: player.silhouette || '' }} />
        </svg>
      </div>

      {/* Kit color stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${player.kitA},${player.kitB||player.kitA})`, borderRadius: 2, margin: '4px 0 6px' }} />

      {/* Name */}
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: 1, lineHeight: 1.1 }}>
        {player.name}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 1 }}>
        {player.role.toUpperCase()}
      </div>

      {/* Selected check */}
      {selected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000' }}>✓</div>
      )}
    </div>
  );
}

// ─── PLAYER SELECT SCREEN ─────────────────────────────────────────────────────
function PlayerSelectScreen({ onSelect, currentPlayerId }) {
  const [sel, setSel] = React.useState(currentPlayerId || null);
  const { PLAYERS } = window.WC_DATA;
  const tierOrder = { legend: 0, gold: 1, silver: 2, bronze: 3 };
  const sorted = [...PLAYERS].sort((a, b) => (tierOrder[a.tier] || 9) - (tierOrder[b.tier] || 9));

  return (
    <div style={{ minHeight: '100vh', padding: '40px 16px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,166,44,0.1) 0%, transparent 60%)' }} />

      <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 'clamp(22px,5vw,42px)', background: 'linear-gradient(135deg,#FFE566,#C9A62C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 5 }}>ELIGE TU JUGADOR</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8, fontFamily: "'Barlow',sans-serif" }}>Tu ídolo te representará en la Polla Mundialista</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 860, position: 'relative', zIndex: 1 }}>
        {sorted.map(p => (
          <FifaCard key={p.id} player={p} selected={sel === p.id} onClick={() => setSel(p.id)} />
        ))}
      </div>

      <button onClick={() => sel && onSelect(sel)} disabled={!sel} style={{
        marginTop: 40, padding: '17px 60px', position: 'relative', zIndex: 1,
        background: sel ? 'linear-gradient(135deg,#FFE566,#C9A62C)' : 'rgba(255,255,255,0.07)',
        border: 'none', borderRadius: 12,
        color: sel ? '#000' : 'rgba(255,255,255,0.2)',
        fontFamily: "'Anton',sans-serif", fontSize: 22, letterSpacing: 4,
        cursor: sel ? 'pointer' : 'not-allowed', transition: 'all 0.3s',
        boxShadow: sel ? '0 6px 28px rgba(201,166,44,0.5)' : 'none',
      }}>CONFIRMAR SELECCIÓN</button>
    </div>
  );
}

Object.assign(window, { IntroAnimation, AuthScreen, PlayerSelectScreen, FifaCard, Particles, Confetti });
