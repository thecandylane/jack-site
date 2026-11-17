/**
 * The horizontal gaps a row of text may fill beside a circle: the row is the band [y, y + lh] of a box `width` wide,
 * the circle is {x, y, r}. Returns [left, right] pairs; gaps narrower than `min` px are dropped.
 */
export function gaps(width, y, lh, c, min = 48) {
  const dy = Math.max(0, Math.abs(c.y - (y + lh / 2)) - lh / 2); // nearest point of the band to the centre
  if (dy >= c.r) return [[0, width]];
  const half = Math.sqrt(c.r * c.r - dy * dy);
  return [[0, c.x - half], [c.x + half, width]]
    .map(([a, b]) => [Math.max(0, a), Math.min(width, b)])
    .filter(([a, b]) => b - a >= min);
}
