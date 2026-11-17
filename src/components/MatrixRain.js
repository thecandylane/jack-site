'use client';

import { useEffect, useRef } from 'react';

// Phosphor characters falling behind every page. Pressing drops a log into the waterfall where you press:
// the streams hit it and splash, nearby characters are thrown off, and dragging moves the log.
// After you let go the log stays a moment, then washes away. Reduced motion draws one still frame.
const CELL = 18, GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>/{}=$#';
const LOG_W = 180, LOG_HOLD = 1400, THROW_R = 140, MAX_BITS = 700, GRAVITY = 0.32;
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export default function MatrixRain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, cols = [], bits = [], log = null, accent = '#5dff8a', tick = 0;
    const family = getComputedStyle(canvas).fontFamily || 'monospace'; // canvas fonts can't read CSS variables

    const column = (i, top) => ({
      x: i * CELL + CELL / 2,
      y: top ? -Math.random() * h : Math.random() * h, // head position in px
      v: 1.2 + Math.random() * 2.6, // px per frame
      len: 8 + ((Math.random() * 22) | 0), // trail length in cells
      chars: Array.from({ length: 40 }, pick),
    });
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Array.from({ length: Math.ceil(w / CELL) }, (_, i) => column(i, false));
    };
    const blocked = (c) => log && c.x > log.x - LOG_W / 2 && c.x < log.x + LOG_W / 2 && c.y >= log.y;
    const splash = (x, y, n, power) => {
      for (let k = 0; k < n && bits.length < MAX_BITS; k++) {
        const side = x < log?.x ? -1 : 1;
        bits.push({ x, y, vx: side * (0.5 + Math.random() * power), vy: -Math.random() * power, ch: pick(), life: 90 + Math.random() * 60 });
      }
    };
    // Throws every trail character within reach of (x, y) outward, and starts those streams over from the top.
    const toss = (x, y) => {
      for (const c of cols) {
        if (Math.abs(c.x - x) > THROW_R) continue;
        for (let k = 0; k < c.len; k++) {
          const cy = c.y - k * CELL, d = Math.hypot(c.x - x, cy - y);
          if (d > THROW_R || bits.length >= MAX_BITS) continue;
          const f = (1 - d / THROW_R) * 14 + 2, a = Math.atan2(cy - y, c.x - x);
          bits.push({ x: c.x, y: cy, vx: Math.cos(a) * f, vy: Math.sin(a) * f - 3, ch: c.chars[k % c.chars.length], life: 120 + Math.random() * 60 });
        }
        if (Math.abs(c.y - y) < THROW_R + c.len * CELL) Object.assign(c, column(cols.indexOf(c), true));
      }
    };

    const draw = () => {
      if (tick++ % 30 === 0) accent = getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CELL - 4}px ${family}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = accent;
      for (const c of cols) {
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * CELL;
          if (y < -CELL || y > h + CELL) continue;
          if (log && Math.abs(c.x - log.x) < LOG_W / 2 && y > log.y) continue; // the log shadows what is below it
          ctx.globalAlpha = k === 0 ? 0.32 : 0.13 * (1 - k / c.len);
          ctx.fillText(c.chars[k % c.chars.length], c.x, y);
        }
      }
      for (const b of bits) {
        ctx.globalAlpha = Math.min(0.6, b.life / 120);
        ctx.fillText(b.ch, b.x, b.y);
      }
      if (log) { // the log: a bright bar the streams break on
        ctx.globalAlpha = 0.5 * log.fade;
        ctx.fillRect(log.x - LOG_W / 2, log.y - 3, LOG_W, 6);
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      const now = performance.now();
      if (log && !log.held) {
        log.fade = Math.max(0, 1 - (now - log.at) / LOG_HOLD);
        if (log.fade === 0) log = null;
      }
      for (const c of cols) {
        c.y += c.v;
        if (Math.random() < 0.04) c.chars[(Math.random() * c.chars.length) | 0] = pick();
        if (blocked(c)) { // the head hits the log: it splashes and the stream starts over above it
          splash(c.x, log.y - 4, 2, 4);
          c.y = log.y - CELL;
          c.v = 1.2 + Math.random() * 2.6;
        }
        if (c.y - c.len * CELL > h) Object.assign(c, column(cols.indexOf(c), true));
      }
      for (const b of bits) { b.vy += GRAVITY; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.life -= 1; }
      bits = bits.filter((b) => b.life > 0 && b.y < h + CELL && b.x > -CELL && b.x < w + CELL);
      draw();
      raf = requestAnimationFrame(frame);
    };

    const at = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    // Logs drop only on empty space, so pressing on text still selects it and links still work.
    const TEXT = 'a, button, input, textarea, select, label, summary, p, li, h1, h2, h3, pre, code, dt, dd, .orb, .term-win, .widget';
    const down = (e) => {
      if (e.button !== 0 || e.target.closest?.(TEXT)) return;
      const [x, y] = at(e);
      log = { x, y, held: true, at: performance.now(), fade: 1 };
      toss(x, y);
    };
    const move = (e) => { if (log?.held) [log.x, log.y] = at(e); };
    const up = () => { if (log) { log.held = false; log.at = performance.now(); } };

    size();
    const ro = new ResizeObserver(() => { size(); draw(); });
    ro.observe(canvas);
    if (still) draw();
    else {
      raf = requestAnimationFrame(frame);
      addEventListener('pointerdown', down, { passive: true });
      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerup', up, { passive: true });
      addEventListener('pointercancel', up, { passive: true });
    }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener('pointerdown', down); removeEventListener('pointermove', move);
      removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
    };
  }, []);

  return <canvas ref={ref} className="warp" aria-hidden="true" />;
}
