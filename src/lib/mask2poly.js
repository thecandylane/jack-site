// A segmentation mask to a field outline: keep the biggest blob, trace its edge, simplify it, measure it.
// The steps follow the raster-to-vector idea in gh:opengeos/segment-geospatial (MIT), studied for shape only;
// the code here is written from scratch. Masks are w*h arrays of 0/1, row by row.

export const M2_PER_ACRE = 4046.8564224;

// The largest 4-connected region of the mask, as a new 0/1 mask.
export function largestRegion(mask, w, h) {
  const label = new Int32Array(w * h);
  const stack = [];
  let id = 0, best = 0, bestN = 0;
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i]) continue;
    label[i] = ++id;
    stack.push(i);
    let n = 0;
    while (stack.length) {
      const j = stack.pop(), x = j % w;
      n++;
      const visit = (k) => { if (mask[k] && !label[k]) { label[k] = id; stack.push(k); } };
      if (x > 0) visit(j - 1);
      if (x < w - 1) visit(j + 1);
      if (j >= w) visit(j - w);
      if (j < w * (h - 1)) visit(j + w);
    }
    if (n > bestN) { bestN = n; best = id; }
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = best && label[i] === best ? 1 : 0;
  return out;
}

// The outer edge of the region, walked clockwise along pixel corners (so a full pixel counts as area 1).
// Only the corners where the edge turns are kept. Assumes one region (run largestRegion first).
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // right, down, left, up (y grows downwards)
export function traceOutline(mask, w, h) {
  const start = mask.indexOf(1);
  if (start < 0) return [];
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const x0 = start % w, y0 = (start - x0) / w;
  const pts = [[x0, y0]];
  let x = x0 + 1, y = y0, d = 0;
  while (x !== x0 || y !== y0) {
    const dx = DX[d], dy = DY[d], rx = -dy, ry = dx; // r points to the right of travel, where the region is
    const aheadLeft = on(Math.floor(x + (dx - rx) / 2), Math.floor(y + (dy - ry) / 2));
    const aheadRight = on(Math.floor(x + (dx + rx) / 2), Math.floor(y + (dy + ry) / 2));
    const nd = aheadLeft ? (d + 3) % 4 : aheadRight ? d : (d + 1) % 4;
    if (nd !== d) pts.push([x, y]);
    d = nd;
    x += DX[d];
    y += DY[d];
  }
  return pts;
}

// Douglas-Peucker on a closed ring: split it at the vertex farthest from the first, simplify both halves.
export function simplify(ring, eps) {
  if (ring.length < 4) return ring;
  let far = 0, fd = -1;
  ring.forEach(([x, y], i) => { const dd = (x - ring[0][0]) ** 2 + (y - ring[0][1]) ** 2; if (dd > fd) { fd = dd; far = i; } });
  return [...dp(ring.slice(0, far + 1), eps).slice(0, -1), ...dp([...ring.slice(far), ring[0]], eps).slice(0, -1)];
}
function dp(p, eps) {
  if (p.length < 3) return p;
  const [ax, ay] = p[0], [bx, by] = p[p.length - 1];
  const len = Math.hypot(bx - ax, by - ay);
  let idx = 0, max = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const [px, py] = p[i];
    const dist = len ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len : Math.hypot(px - ax, py - ay);
    if (dist > max) { max = dist; idx = i; }
  }
  if (max <= eps) return [p[0], p[p.length - 1]];
  return [...dp(p.slice(0, idx + 1), eps).slice(0, -1), ...dp(p.slice(idx), eps)];
}

// Shoelace area of a ring, in square pixels.
export function area(ring) {
  let s = 0;
  ring.forEach(([x1, y1], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; s += x1 * y2 - x2 * y1; });
  return Math.abs(s) / 2;
}

export const acres = (px2, mpp) => (px2 * mpp * mpp) / M2_PER_ACRE;

// The whole chain: mask -> simplified outline of its largest region (eps in pixels).
export const fieldOutline = (mask, w, h, eps = 1.5) => simplify(traceOutline(largestRegion(mask, w, h), w, h), eps);
