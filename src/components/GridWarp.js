'use client';

import { useEffect, useRef } from 'react';

// The phosphor grid behind every page, bent like a lens around the pointer; a click sends rings out from it. Without a pointer it drifts slowly;
// with reduced motion it is drawn once and stays still.
const STEP = 32, R = 220, PULL = 26, RING_MS = 1100;

export default function GridWarp() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rings = [];
    let w = 0, h = 0, raf = 0, t = 0, px = -1e4, py = -1e4, tx = -1e4, ty = -1e4;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // A grid point pushed away from the pointer, strongest at the centre of the lens.
    const bend = (x, y) => {
      const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
      if (d >= R || d === 0) return [x, y];
      const k = (1 - d / R) ** 2 * PULL / d;
      return [x + dx * k, y + dy * k];
    };
    const draw = () => {
      const accent = getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      const off = (t * 0.15) % STEP;
      for (const vertical of [true, false]) {
        for (let a = -STEP; a <= (vertical ? w : h) + STEP; a += STEP) {
          ctx.globalAlpha = 0.09;
          ctx.beginPath();
          for (let b = -STEP; b <= (vertical ? h : w) + STEP; b += 8) {
            const [x, y] = bend(vertical ? a + off : b, vertical ? b : a + off);
            b === -STEP ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      const now = performance.now(); // a click sends two rings out across the grid
      rings = rings.filter((r) => now - r.t < RING_MS);
      for (const r of rings) {
        const k = (now - r.t) / RING_MS;
        for (const scale of [1, 0.6]) {
          ctx.globalAlpha = 0.5 * (1 - k);
          ctx.beginPath(); ctx.arc(r.x, r.y, 20 + k * 420 * scale, 0, 2 * Math.PI); ctx.stroke();
        }
      }
      if (px > -1e3) { // the lens itself: a faint phosphor bloom
        const g = ctx.createRadialGradient(px, py, 0, px, py, R);
        g.addColorStop(0, accent); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.06; ctx.fillStyle = g; ctx.fillRect(px - R, py - R, 2 * R, 2 * R);
      }
    };
    const frame = () => {
      t += 1;
      px += (tx - px) * 0.12; py += (ty - py) * 0.12; // ease toward the pointer
      draw();
      raf = requestAnimationFrame(frame);
    };
    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (px < -1e3) { px = tx; py = ty; }
    };
    const leave = () => { tx = ty = px = py = -1e4; };
    const click = (e) => {
      const r = canvas.getBoundingClientRect();
      rings.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
    };

    size();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(canvas);
    if (still) draw();
    else {
      raf = requestAnimationFrame(frame);
      addEventListener('pointermove', move, { passive: true });
      document.addEventListener('pointerleave', leave);
      addEventListener('pointerdown', click, { passive: true });
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', move); removeEventListener('pointerdown', click); document.removeEventListener('pointerleave', leave); };
  }, []);

  return <canvas ref={ref} className="warp" aria-hidden="true" />;
}
