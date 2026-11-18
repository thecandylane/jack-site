// node --test src/lib
// Each lab must be solvable against the engine as shipped, and unsolvable against the same
// engine with the fix on. That is the whole claim of defender mode.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createForge } from './index.js';
import { parse } from './parser.js';
import { HEADER } from './heap.js';
import { slotOffset } from './maps.js';
import { ptrOffset, smi, smiValue } from './values.js';

const forge = (lab, defend = false) => createForge({ heapBytes: 1 << 16, parse, lab, defend, flag: 'FORGE{test}' });
const touched = (f) => smiValue(f.vm.get(f.canary, 'touched'));

const POLLUTION = `var payload = { "__proto__": { "shell": true } };
merge({}, payload);
var view = exec({});
print(read(view));`;

test('pollution: the payload works, then the guard refuses the key', () => {
  const open = forge('pollution');
  const out = open.run(POLLUTION);
  assert.equal(out.ok, true, out.error);
  assert.deepEqual(out.log, ['FORGE{test}']);

  const fixed = forge('pollution', true);
  const after = fixed.run(POLLUTION);
  assert.equal(after.ok, true, after.error);
  assert.deepEqual(after.log, ['exec: refused, no shell option', 'undefined']);
  assert.equal(fixed.host.opened, 0);
});

test('bounds: the length walks into the canary, then the resize keeps the write inside', () => {
  const index = (() => {
    const f = forge('bounds');
    const xs = f.vm.globals.get('xs');
    const elems = ptrOffset(f.heap.elemAt(ptrOffset(xs)));
    return (ptrOffset(f.canary) + slotOffset(1) - (elems + HEADER)) / 4;
  })();
  const source = `xs.length = 64; xs[${index}] = 1;`;

  const open = forge('bounds');
  assert.equal(open.run(source).ok, true);
  assert.equal(touched(open), 1);

  const fixed = forge('bounds', true);
  assert.equal(fixed.run(source).ok, true);
  assert.equal(touched(fixed), 0, 'the resized block must absorb the write');
});

test('escape: the retargeted view reads handle 3, then the capability check refuses', () => {
  const index = (() => {
    const probe = forge('escape');
    probe.run('var xs = [1, 2, 3, 4]; var v = open();');
    const view = probe.objects().find((o) => o.mapId === probe.vm.MAP_VIEW);
    const arr = probe.objects().find((o) => o.mapId === probe.vm.MAP_ARRAY_SMI);
    const elems = ptrOffset(probe.heap.elemAt(arr.offset));
    return (view.offset + slotOffset(1) - (elems + HEADER)) / 4;
  })();
  const source = `var xs = [1, 2, 3, 4]; var v = open(); xs.length = 512; xs[${index}] = 3; print(read(v));`;

  const open = forge('escape');
  const out = open.run(source);
  assert.deepEqual(out.log, ['native:0x7f3a2c10']);
  assert.equal(open.host.reads.includes(3), true);

  // With the length fixed, the same source cannot reach the slot at all: the resize absorbed
  // the write, so the view still names handle 1 and the secret is never read.
  const fixed = forge('escape', true);
  const after = fixed.run(source);
  assert.equal(after.ok, true, after.error);
  assert.deepEqual(after.log, ['/bin/sh']);
  assert.equal(fixed.host.reads.includes(3), false);

  // The capability check on its own: give an attacker the write directly, and read still refuses.
  const cap = forge('escape', true);
  const v = cap.vm.allocView(1);
  cap.vm.heap.writeU32(ptrOffset(v) + slotOffset(1), smi(3));
  cap.vm.bindGlobal('v', v);
  const denied = cap.run('print(read(v));');
  assert.deepEqual(denied.log, ['read: refused, this view never held that capability', 'undefined']);
  assert.deepEqual(cap.host.reads, []);
});

test('defender mode changes nothing about a benign program', () => {
  const source = 'var n = 0; for (var i = 0; i < 5; i = i + 1) n = n + i; print(n);';
  const open = forge('pollution').run(source);
  const fixed = forge('pollution', true).run(source);
  assert.deepEqual(open.log, fixed.log);
  assert.deepEqual(open.log, ['10']);
});
