import test from 'node:test';
import assert from 'node:assert/strict';
import { largestRegion, traceOutline, fieldOutline, area, acres } from './mask2poly.js';

// Builds a w*h mask from rows of '#' (on) and '.' (off).
const grid = (...rows) => ({ w: rows[0].length, h: rows.length, mask: Uint8Array.from(rows.join(''), (c) => (c === '#' ? 1 : 0)) });

test('a square traces to its four corners and its pixel area', () => {
  const { mask, w, h } = grid('.....', '.###.', '.###.', '.###.', '.....');
  const ring = traceOutline(mask, w, h);
  assert.deepEqual(ring, [[1, 1], [4, 1], [4, 4], [1, 4]]);
  assert.equal(area(ring), 9);
});

test('an L-shape keeps its six corners', () => {
  const { mask, w, h } = grid('#...', '#...', '####');
  const ring = traceOutline(mask, w, h);
  assert.deepEqual(ring, [[0, 0], [1, 0], [1, 2], [4, 2], [4, 3], [0, 3]]);
  assert.equal(area(ring), 6);
  assert.equal(fieldOutline(mask, w, h, 0.5).length, 6); // a tolerance under one pixel keeps the thin arm
});

test('of two blobs, the larger one is kept', () => {
  const { mask, w, h } = grid('##....', '##.###', '...###', '...###');
  const big = largestRegion(mask, w, h);
  assert.equal(big.reduce((a, b) => a + b, 0), 9);
  assert.equal(big[0], 0);
  assert.equal(area(fieldOutline(mask, w, h)), 9);
});

test('a 201 m square field at 1 m per pixel reads 9.98 acres', () => {
  const w = 210, h = 210, mask = new Uint8Array(w * h);
  for (let y = 4; y < 205; y++) for (let x = 4; x < 205; x++) mask[y * w + x] = 1;
  const ring = fieldOutline(mask, w, h);
  assert.equal(ring.length, 4);
  assert.equal(acres(area(ring), 1).toFixed(2), '9.98'); // 40,401 m2 / 4,046.86 m2 per acre
  assert.equal(acres(area(ring), 2).toFixed(1), '39.9'); // the same mask at 2 m per pixel covers four times the ground
});

test('an empty mask gives no outline', () => {
  const { mask, w, h } = grid('...', '...');
  assert.deepEqual(fieldOutline(mask, w, h), []);
});
