// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { createForge } from './index.js';
import { parse } from './parser.js';
import { BOUNDS_LAB } from './labs/bounds.js';
import { ESCAPE_LAB } from './labs/escape.js';
import { HEADER, HEAP_START } from './heap.js';
import { slotOffset } from './maps.js';
import { ptrOffset } from './values.js';

const forge = (lab) => createForge({ heapBytes: 1 << 16, parse, lab });

test('bounds: an index computed from the panel lands in the canary', () => {
  const f = forge('bounds');
  const xs = f.vm.globals.get('xs');
  const elems = ptrOffset(f.heap.elemAt(ptrOffset(xs)));
  const index = (ptrOffset(f.canary) + slotOffset(1) - (elems + HEADER)) / 4;
  assert.equal(Number.isInteger(index), true, 'the canary slot must sit on an element boundary');

  const out = f.run(`xs.length = 64; xs[${index}] = 1;`);
  assert.equal(out.ok, true, out.error);
  assert.equal(BOUNDS_LAB.check(f).solved, true);
});

test('bounds: without the length the write is refused, so the solve needs the bug', () => {
  const f = forge('bounds');
  const xs = f.vm.globals.get('xs');
  const elems = ptrOffset(f.heap.elemAt(ptrOffset(xs)));
  const index = (ptrOffset(f.canary) + slotOffset(1) - (elems + HEADER)) / 4;

  const out = f.run(`xs[${index}] = 1;`);
  assert.equal(out.ok, false);
  assert.match(out.error, /out of range/);
  assert.equal(BOUNDS_LAB.check(f).solved, false);
});

test('escape: a view allocated after the array can be retargeted to handle 3', () => {
  // Probe run: same allocation sequence as the exploit, so the offsets carry over.
  const probe = forge('escape');
  probe.run('var xs = [1, 2, 3, 4]; var v = open();');
  const view = probe.objects().find((o) => o.mapId === probe.vm.MAP_VIEW);
  const arr = probe.objects().find((o) => o.mapId === probe.vm.MAP_ARRAY_SMI);
  assert.ok(view && arr, 'the probe must allocate both a view and an array');
  const elems = ptrOffset(probe.heap.elemAt(arr.offset));
  const index = (view.offset + slotOffset(1) - (elems + HEADER)) / 4;
  assert.equal(Number.isInteger(index), true);

  const f = forge('escape');
  const out = f.run(`var xs = [1, 2, 3, 4]; var v = open(); xs.length = 512; xs[${index}] = 3; print(read(v));`);
  assert.equal(out.ok, true, out.error);
  assert.deepEqual(out.log, ['native:0x7f3a2c10']);
  assert.deepEqual(f.host.reads, [3]);
  assert.equal(ESCAPE_LAB.check(f).solved, true);
});

test('escape: reading the view as opened only reaches handle 1', () => {
  const f = forge('escape');
  const out = f.run('var v = open(); print(read(v));');
  assert.deepEqual(out.log, ['/bin/sh']);
  assert.equal(ESCAPE_LAB.check(f).solved, false);
});

test('a lab is seeded only when it is selected', () => {
  const plain = createForge({ heapBytes: 1 << 16 });
  assert.equal(plain.vm.globals.size, 0);
  assert.equal(plain.canary, undefined);
});
