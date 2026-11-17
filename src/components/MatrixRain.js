'use client';

import { useEffect, useRef } from 'react';

// Phosphor characters falling behind every page. Pressing empty space drops a small log into the rain: each
// character that reaches it is flung off to the side, like water off a log. Nothing new is spawned; only the
// streams' own characters move. Dragging moves the log; after you let go it stays a moment, then fades.
// Reduced motion draws one still frame.
const CELL = 18, PER_COL = 2, GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>/{}=$#';
const LOG_W = 90, LOG_HOLD = 1400, MAX_BITS = 600, GRAVITY = 0.25;
const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export default function MatrixRain() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, streams = [], bits = [], log = null, accent = '#5dff8a', tick = 0;
    const family = getComputedStyle(canvas).fontFamily || 'monospace'; // canvas fonts can't read CSS variables

    const stream = (x, fresh) => ({
      x,
      y: fresh ? -Math.random() * h * 0.5 : Math.random() * h * 1.2, // head position in px
      v: 1.2 + Math.random() * 2.6, // px per frame
      len: 8 + ((Math.random() * 22) | 0), // trail length in cells
      chars: Array.from({ length: 40 }, pick),
    });
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.ceil(w / CELL);
      streams = Array.from({ length: cols * PER_COL }, (_, i) => stream((i % cols) * CELL + CELL / 2, false));
    };
    const under = (x, y) => log && Math.abs(x - log.x) < LOG_W / 2 && y > log.y;

    const draw = () => {
      if (tick++ % 30 === 0) accent = getComputedStyle(canvas).color;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `${CELL - 4}px ${family}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = accent;
      for (const s of streams) {
        for (let k = 0; k < s.len; k++) {
          const y = s.y - k * CELL;
          if (y < -CELL || y > h + CELL || under(s.x, y)) continue; // the log shadows what is below it
          ctx.globalAlpha = k === 0 ? 0.32 : 0.13 * (1 - k / s.len);
          ctx.fillText(s.chars[k % s.chars.length], s.x, y);
        }
      }
      for (const b of bits) {
        ctx.globalAlpha = Math.min(0.32, b.life / 300);
        ctx.fillText(b.ch, b.x, b.y);
      }
      if (log) {
        ctx.globalAlpha = 0.45 * log.fade;
        ctx.fillRect(log.x - LOG_W / 2, log.y - 1.5, LOG_W, 3);
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      if (log && !log.held) {
        log.fade = Math.max(0, 1 - (performance.now() - log.at) / LOG_HOLD);
        if (log.fade === 0) log = null;
      }
      for (const s of streams) {
        s.y += s.v;
        // Each of this stream's characters that just crossed the log is flung off the nearer end.
        if (log && Math.abs(s.x - log.x) < LOG_W / 2) {
          for (let k = 0; k < s.len && bits.length < MAX_BITS; k++) {
            const y = s.y - k * CELL;
            if (y >= log.y && y - s.v < log.y) {
              const side = s.x === log.x ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(s.x - log.x);
              bits.push({ x: s.x, y: log.y - 2, vx: side * (1.5 + Math.random() * 2.5), vy: -(0.5 + Math.random() * 2), ch: s.chars[k % s.chars.length], life: 100 + Math.random() * 60 });
            }
          }
        }
        if (Math.random() < 0.04) s.chars[(Math.random() * s.chars.length) | 0] = pick();
        if (s.y - s.len * CELL > h) Object.assign(s, stream(s.x, true));
      }
      for (const b of bits) { b.vy += GRAVITY; b.vx *= 0.98; b.x += b.vx; b.y += b.vy; b.life -= 1; }
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
