import { useRef, useEffect } from 'react';

export function Particles({ count = 200, footballs = true }: { count?: number; footballs?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
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

    let raf = 0;
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
  }, [count, footballs]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
}

export function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d')!;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const cols = ['#FFD700', '#FF6B35', '#22C55E', '#3B82F6', '#EC4899', '#FFFFFF', '#C9A62C'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 300,
      y: h / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 12 + 4),
      g: 0.35, a: 1, w: 8 + Math.random() * 8, h: 6 + Math.random() * 6,
      color: cols[Math.floor(Math.random() * cols.length)],
      rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.25,
    }));
    let raf = 0;
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
