// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { smi, isSmi, smiValue, ptr, isPtr, ptrOffset, describe, SMI_MIN, SMI_MAX } from './values.js';
import { Heap, HEADER, HEAP_START, FREED } from './heap.js';
import { Maps, KIND, slotOffset } from './maps.js';
import { createForge } from './index.js';

const CAGE = 1 << 16;

// --- tagged words -----------------------------------------------------------------------

test('smi round-trips its edges and stays inline', () => {
  for (const n of [0, 1, -1, 2, -2, 1000, -1000, SMI_MAX, SMI_MIN]) {
    const w = smi(n);
    assert.equal(isSmi(w), true, `${n} should be a Smi`);
    assert.equal(smiValue(w), n);
  }
  assert.throws(() => smi(SMI_MAX + 1), RangeError);
  assert.throws(() => smi(SMI_MIN - 1), RangeError);
  assert.throws(() => smi(1.5), TypeError);
});

test('pointers carry the low bit and keep their offset', () => {
  for (const off of [0x1000, 0x1008, 0x2000]) {
    const w = ptr(off);
    assert.equal(isPtr(w), true);
    assert.equal(ptrOffset(w), off);
    assert.equal(describe(w), `ptr(0x${off.toString(16)})`);
  }
  assert.throws(() => ptr(0), RangeError);
  assert.throws(() => ptr(0x1004), RangeError);
});

// --- heap -------------------------------------------------------------------------------

test('alloc writes the header and walks every block once', () => {
  const heap = new Heap(CAGE);
  const a = heap.alloc(HEADER + 8, 7);
  const b = heap.alloc(HEADER + 16, 8);
  assert.equal(a, HEAP_START);
  assert.equal(heap.mapIdAt(a), 7);
  assert.equal(heap.sizeAt(a), HEADER + 8);
  assert.equal(b, a + HEADER + 8);
  assert.deepEqual(heap.objects().map((o) => o.offset), [a, b]);
});

test('sweep stamps unreachable blocks but leaves their bytes readable', () => {
  const heap = new Heap(CAGE);
  const a = heap.alloc(HEADER + 8, 3);
  const b = heap.alloc(HEADER + 8, 4);
  heap.writeU32(b + HEADER, 0xdeadbeef);
  const freed = heap.sweep(new Set([b]));
  assert.equal(freed, 1);
  assert.equal(heap.mapIdAt(a), FREED);
  assert.equal(heap.alive(a), false);
  assert.equal(heap.readU32(b + HEADER), 0xdeadbeef); // non-moving: a stale offset still reads
  assert.deepEqual(heap.objects().map((o) => o.offset), [b]);
});

test('a write past the cage is refused, so the model has one boundary', () => {
  const heap = new Heap(CAGE);
  assert.throws(() => heap.writeU32(heap.bytes - 2, 1), RangeError);
  assert.throws(() => heap.writeF64(heap.bytes - 4, 1), RangeError);
});

// --- maps -------------------------------------------------------------------------------

test('map transitions are cached and property slots start after the prototype slot', () => {
  const maps = new Maps();
  const base = maps.define({ kind: KIND.OBJECT });
  const one = maps.withProp(base, 'a', 'tagged');
  const again = maps.withProp(base, 'a', 'tagged');
  assert.equal(one, again);
  assert.equal(maps.indexOf(one, 'a'), 1);
  assert.equal(maps.indexOf(one, 'b'), -1);
  assert.equal(slotOffset(1), HEADER + 4);
  assert.notEqual(maps.withElemRep(base, 'double'), base);
});

// --- interpreter ------------------------------------------------------------------------

const N = (value) => ({ type: 'Num', value });
const S = (value) => ({ type: 'Str', value });
const Id = (name) => ({ type: 'Ident', name });
const Bin = (op, left, right) => ({ type: 'Binary', op, left, right });
const Call = (callee, args = []) => ({ type: 'Call', callee, args });
const Member = (object, property, computed = false) =>
  computed
    ? { type: 'Member', object, property, computed }
    : { type: 'Member', object, property: { type: 'Ident', name: property }, computed };
const Assign = (target, value, op = '=') => ({ type: 'Assign', op, target, value });
const Var = (id, init = null) => ({ type: 'VarDecl', kind: 'let', decls: [{ id, init }] });
const Block = (body) => ({ type: 'Block', body });
const Return = (arg = null) => ({ type: 'Return', arg });
const Func = (id, params, body) => ({ type: 'FuncDecl', id, params, body: Block(body) });
const Expr = (expr) => ({ type: 'ExprStmt', expr });
const Program = (body) => ({ type: 'Program', body });

const run = (ast) => {
  const forge = createForge({ heapBytes: CAGE });
  return { forge, out: forge.exec(ast) };
};

test('arithmetic follows precedence the parser will emit, and print reads it back', () => {
  const { out } = run(Program([Expr(Call(Id('print'), [Bin('+', N(2), Bin('*', N(3), N(4)))]))]));
  assert.equal(out.ok, true);
  assert.deepEqual(out.log, ['14']);
});

test('closures capture their defining environment', () => {
  const ast = Program([
    Var('captured', null),
    Func('make', ['x'], [Func('add', ['y'], [Return(Bin('+', Id('x'), Id('y')))]), Expr(Assign(Id('captured'), Id('add')))]),
    Expr(Call(Id('make'), [N(10)])),
    Expr(Call(Id('print'), [Call(Id('captured'), [N(5)])])),
  ]);
  const { out } = run(ast);
  assert.equal(out.ok, true);
  assert.deepEqual(out.log, ['15']);
});

test('member reads walk the prototype chain and __proto__ is a real link', () => {
  const ast = Program([
    Var('base', { type: 'Object', props: [{ key: 'x', value: N(7) }] }),
    Var('o', { type: 'Object', props: [] }),
    Expr(Assign(Member(Id('o'), '__proto__'), Id('base'))),
    Expr(Call(Id('print'), [Member(Id('o'), 'x')])),
    Expr(Call(Id('print'), [Member(Id('o'), S('__proto__'), true)])),
  ]);
  const { out } = run(ast);
  assert.equal(out.ok, true);
  assert.equal(out.log[0], '7');
  assert.equal(out.log[1], '[object]');
});

test('a guest __proto__ never reaches a host object key', () => {
  const ast = Program([
    Var('host', { type: 'Object', props: [] }),
    Expr(Assign(Member(Id('host'), S('__proto__'), true), { type: 'Object', props: [{ key: 'polluted', value: N(1) }] })),
    Expr(Call(Id('print'), [Member(Id('host'), 'polluted')])),
  ]);
  const { out } = run(ast);
  assert.equal(out.ok, true);
  assert.deepEqual(out.log, ['1']); // visible inside the cage
  assert.equal({}.polluted, undefined); // and nowhere on this page
  assert.equal(Object.prototype.polluted, undefined);
});

test('an array length moves without resizing the block, so a far index becomes cage access', () => {
  const forge = createForge({ heapBytes: CAGE });
  const vm = forge.vm;
  const arr = vm.array([vm.num(10), vm.num(20), vm.num(30), vm.num(40)]);
  const off = ptrOffset(arr);
  const elems = ptrOffset(forge.heap.elemAt(off));
  const blockSize = forge.heap.sizeAt(elems);

  vm.set(arr, 'length', vm.num(4096));
  vm.setIndex(arr, 400, vm.num(0x4141));

  const stray = elems + HEADER + 400 * 4;
  assert.ok(stray >= elems + blockSize, 'the write must leave the elements block');
  assert.equal(forge.heap.readU32(stray), smi(0x4141));
  assert.equal(smiValue(vm.getIndex(arr, 400)), 0x4141);
});

test('the length bug reaches a neighbour object and rewrites its property', () => {
  const forge = createForge({ heapBytes: CAGE });
  const vm = forge.vm;
  const arr = vm.array([vm.num(1), vm.num(2), vm.num(3), vm.num(4)]);
  const off = ptrOffset(arr);
  const elems = ptrOffset(forge.heap.elemAt(off));

  const mapId = forge.maps.shapeOf(KIND.OBJECT, ['x']);
  const neighbour = vm.allocObject(mapId, ptr(vm.objectProto));
  vm.heap.writeU32(neighbour + slotOffset(1), vm.num(7));

  vm.set(arr, 'length', vm.num(512));
  const index = (neighbour + slotOffset(1) - (elems + HEADER)) / 4;
  assert.equal(Number.isInteger(index), true);
  vm.setIndex(arr, index, vm.num(999));

  assert.equal(smiValue(vm.get(ptr(neighbour), 'x')), 999);
});

test('step limit stops a runaway loop instead of hanging the page', () => {
  const forge = createForge({ heapBytes: CAGE, steps: 500 });
  const loop = Program([{ type: 'While', test: { type: 'Bool', value: true }, body: Block([]) }]);
  const out = forge.exec(loop);
  assert.equal(out.ok, false);
  assert.match(out.error, /step limit/);
});
