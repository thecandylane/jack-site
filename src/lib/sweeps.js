// Does the segment (x0,y0)→(x1,y1) touch the box |x| <= hw, |y| <= hh? (Liang–Barsky clipping.)
// Used in the log's frame of reference, so a fast swipe still hits every character it passes through.
export function sweeps(x0, y0, x1, y1, hw, hh) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p, q] of [[-dx, x0 + hw], [dx, hw - x0], [-dy, y0 + hh], [dy, hh - y0]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
