'use client';

import { useEffect, useRef, useState } from 'react';
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';
import { gaps } from '@/lib/flow';

// A paragraph that Pretext lays out line by line around a draggable radar disc, without DOM measuring.
// Before hydration (and without JS) it is a plain paragraph.
export default function FlowText({ text }) {
  const box = useRef(null);
  const [m, setM] = useState(null); // { prepared, w, lh }: what Pretext needs, re-read when the width changes
  const [pos, setPos] = useState(null);

  useEffect(() => {
    const el = box.current;
    let alive = true, lastW = -1;
    const measure = () => {
      const w = el.clientWidth;
      if (!alive || w === lastW) return; // our own height changes also fire the observer
      lastW = w;
      const cs = getComputedStyle(el);
      setM({ prepared: prepareWithSegments(text, `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`), w, lh: parseFloat(cs.lineHeight) });
    };
    const ro = new ResizeObserver(measure);
    document.fonts.ready.then(() => alive && ro.observe(el));
    return () => { alive = false; ro.disconnect(); };
  }, [text]);

  if (!m) return <p ref={box} className="flow">{text}</p>;

  const r = Math.round(Math.min(96, Math.max(48, m.w * 0.09)));
  // ponytail: y capped at 600px, so the disc can't be dragged far below the text
  const c = { x: Math.min(Math.max(pos?.x ?? m.w - r - 8, r), m.w - r), y: Math.min(Math.max(pos?.y ?? r + m.lh / 2, r), 600), r };
  const lines = [];
  let cursor, y = 0;
  rows: for (; y < 20000; y += m.lh) {
    // One run of text a row, on the wider side of the disc: a line split across the disc reads as two columns.
    const [a, b] = gaps(m.w, y, m.lh, { ...c, r: r + 14 }, 4 * m.lh).toSorted((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0] ?? [];
    if (a === undefined) continue;
    const line = layoutNextLine(m.prepared, b - a, cursor);
    if (!line) break rows;
    lines.push({ text: line.text, x: a, y });
    cursor = line.end;
  }
  const height = Math.max(lines.length ? lines.at(-1).y + m.lh : 0, c.y + r);

  const drag = (e) => {
    const orb = e.currentTarget, at = box.current.getBoundingClientRect();
    const dx = e.clientX - at.left - c.x, dy = e.clientY - at.top - c.y;
    orb.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const now = box.current.getBoundingClientRect();
      setPos({ x: ev.clientX - now.left - dx, y: ev.clientY - now.top - dy });
    };
    const up = () => { orb.removeEventListener('pointermove', move); orb.removeEventListener('pointerup', up); orb.removeEventListener('pointercancel', up); };
    orb.addEventListener('pointermove', move);
    orb.addEventListener('pointerup', up);
    orb.addEventListener('pointercancel', up);
  };

  return (
    <p ref={box} className="flow" style={{ height }}>
      {lines.map((l, i) => <span key={i} style={{ left: l.x, top: l.y }}>{l.text}</span>)}
      <span className="orb" aria-hidden="true" onPointerDown={drag} style={{ left: c.x - r, top: c.y - r, width: 2 * r, height: 2 * r }} />
    </p>
  );
}
