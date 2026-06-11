import { useState, type CSSProperties } from 'react';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  joinPool: boolean;
}

interface AuthScreenProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (payload: RegisterPayload) => void;
  onForgotPassword?: (email: string) => Promise<{ error?: string }>;
}

export function AuthScreen({ onLogin, onRegister, onForgotPassword }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', joinPool: true });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setNotice('');
    if (!form.email || !form.password) { setError('Completa todos los campos'); return; }
    if (mode === 'register' && !form.username) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === 'login') onLogin(form.email, form.password);
      else onRegister({ username: form.username, email: form.email, password: form.password, joinPool: form.joinPool });
    }, 600);
  };

  const forgot = async () => {
    setError(''); setNotice('');
    if (!form.email) { setError('Escribe tu correo arriba y vuelve a tocar “¿Olvidaste tu contraseña?”'); return; }
    if (!onForgotPassword) return;
    setLoading(true);
    const res = await onForgotPassword(form.email);
    setLoading(false);
    if (res.error) setError(res.error);
    else setNotice('📧 Te enviamos un correo con el enlace para crear una nueva contraseña. Revisa tu bandeja (y el spam).');
  };

  const inp: CSSProperties = {
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
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/uploads/pasted-1781013290237-0.png')", backgroundSize: '38%', backgroundPosition: 'center 55%', backgroundRepeat: 'no-repeat', opacity: 0.04, filter: 'grayscale(1)' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <img src="/uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 72, display: 'block', margin: '0 auto 14px', filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.7))' }} />
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
          {([['login', 'INICIAR SESIÓN'], ['register', 'REGISTRARSE']] as const).map(([m, lbl]) => (
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
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Contraseña" value={form.password} onChange={e => set('password', e.target.value)} style={{ ...inp, paddingRight: 52 }} />
            <button type="button" onClick={() => setShowPw(s => !s)} title={showPw ? 'Ocultar' : 'Ver'} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 8, lineHeight: 1,
            }}>{showPw ? '🙈' : '👁️'}</button>
          </div>

          {mode === 'register' && (
            <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.22)', borderRadius: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.joinPool} onChange={e => set('joinPool', e.target.checked)} style={{ marginTop: 2, accentColor: '#FFD700', width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div style={{ color: '#FFD700', fontWeight: 700, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1 }}>🏆 UNIRME A LA BOLSA GENERAL</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>$100.000 COP · El ganador se lleva todo</div>
              </div>
            </label>
          )}

          {error && <div style={{ color: '#FF6B6B', fontSize: 13, lineHeight: 1.4 }}>{error}</div>}
          {notice && <div style={{ color: '#7CE0A0', fontSize: 13, lineHeight: 1.4, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 12px' }}>{notice}</div>}

          <button type="submit" disabled={loading} style={{
            padding: '16px', marginTop: 4,
            background: loading ? '#8a7200' : 'linear-gradient(135deg,#FFE566,#C9A62C)',
            border: 'none', borderRadius: 12, color: '#000',
            fontFamily: "'Anton',sans-serif", fontSize: 19, letterSpacing: 3,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 24px rgba(201,166,44,0.4)',
          }}>{loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}</button>

          {mode === 'login' && onForgotPassword && (
            <button type="button" onClick={forgot} style={{
              background: 'none', border: 'none', color: 'rgba(255,215,0,0.7)', fontSize: 13, cursor: 'pointer',
              fontFamily: "'Barlow',sans-serif", marginTop: 2,
            }}>¿Olvidaste tu contraseña?</button>
          )}
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

// Shown when the user arrives from the password-recovery email.
export function ResetPasswordScreen({ onSubmit }: { onSubmit: (newPassword: string) => Promise<{ error?: string }> }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inp: CSSProperties = {
    width: '100%', padding: '14px 16px', fontSize: 16,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: '#fff', outline: 'none', fontFamily: "'Barlow',sans-serif",
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (pw.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (pw !== pw2) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const res = await onSubmit(pw);
    setLoading(false);
    if (res.error) setError(res.error);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(201,166,44,0.14) 0%, transparent 70%)' }} />
      <img src="/uploads/pasted-1781013290237-0.png" alt="Copa" style={{ width: 64, marginBottom: 16, filter: 'drop-shadow(0 0 16px rgba(255,215,0,0.7))', position: 'relative' }} />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, backdropFilter: 'blur(24px)' }}>
        <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 24, color: '#FFD700', letterSpacing: 2, marginBottom: 4 }}>NUEVA CONTRASEÑA</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontFamily: "'Barlow',sans-serif" }}>Elige tu nueva contraseña para entrar.</div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} placeholder="Nueva contraseña" value={pw} onChange={e => setPw(e.target.value)} style={{ ...inp, paddingRight: 52 }} />
            <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 8 }}>{show ? '🙈' : '👁️'}</button>
          </div>
          <input type={show ? 'text' : 'password'} placeholder="Repite la contraseña" value={pw2} onChange={e => setPw2(e.target.value)} style={inp} />
          {error && <div style={{ color: '#FF6B6B', fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            padding: 16, marginTop: 4, background: loading ? '#8a7200' : 'linear-gradient(135deg,#FFE566,#C9A62C)',
            border: 'none', borderRadius: 12, color: '#000', fontFamily: "'Anton',sans-serif", fontSize: 18, letterSpacing: 2,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? '...' : 'GUARDAR Y ENTRAR'}</button>
        </form>
      </div>
    </div>
  );
}
