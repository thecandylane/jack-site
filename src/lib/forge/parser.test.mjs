import test from 'node:test';
import assert from 'node:assert/strict';
import { createForge } from './index.js';
import { parse } from './parser.js';

const run = (src) => createForge({ heapBytes: 1 << 16, parse }).run(src);
const log = (src) => {
  const out = run(src);
  assert.equal(out.ok, true, out.error);
  return out.log;
};
const expr = (src) => parse(`${src};`).body[0].expr;

test('parser: * binds tighter than +, and 2 + 3 * 4 runs to 14', () => {
  assert.deepEqual(log('print(2 + 3 * 4);'), ['14']);
  assert.deepEqual(log('print((2 + 3) * 4);'), ['20']);
  assert.deepEqual(log('print(10 - 4 - 3);'), ['3']);
});

test('parser: precedence tiers and associativity in the AST', () => {
  const e = expr('a < b + c * d === e');
  assert.equal(e.op, '===');
  assert.equal(e.left.op, '<');
  assert.equal(e.left.right.op, '+');
  assert.equal(e.left.right.right.op, '*');
  const a = expr('a = b = 1');
  assert.equal(a.type, 'Assign');
  assert.equal(a.value.type, 'Assign');
  assert.equal(expr('a || b && c').type, 'Logical');
  assert.equal(expr('x ? 1 : y ? 2 : 3').alt.type, 'Conditional');
  assert.equal(expr('-x + 1').left.type, 'Unary');
  assert.equal(expr('typeof a.b(1)').arg.type, 'Call');
});

test('parser: new takes members, then its own args', () => {
  const n = expr('new Uint8Array(4)');
  assert.equal(n.type, 'New');
  assert.equal(n.args.length, 1);
  assert.equal(expr('new A(1).b').type, 'Member');
});

test('parser: factorial in source prints 120', () => {
  assert.deepEqual(log(`
    function fact(n) { if (n <= 1) { return 1; } return n * fact(n - 1); }
    print(fact(5));
  `), ['120']);
});

test('parser: closure in source', () => {
  assert.deepEqual(log(`
    function counter() {
      let n = 0;
      function inc() { n += 1; return n; }
      return inc;
    }
    const c = counter();
    c(); c();
    print(c());
  `), ['3']);
});

test('parser: object and array literals', () => {
  assert.deepEqual(log(`
    const o = { a: 1, "b c": [1, 2, 3], d: { e: 'x' } };
    print(o.a, o["b c"][2], o.d.e);
  `), ['1 3 x']);
  assert.equal(expr('[1, 2,]').elements.length, 2);
  assert.deepEqual(expr('({ a: 1, "b": 2 })').props.map((q) => q.key), ['a', 'b']);
});

test('parser: loops, try/catch, throw, ternary', () => {
  assert.deepEqual(log(`
    let s = 0;
    for (let i = 0; i < 5; i += 1) { s += i; }
    var k = 0;
    while (k < 3) k += 1;
    try { throw 'boom'; } catch (e) { print(e); }
    print(s, k, s > 5 ? 'big' : 'small');
  `), ['boom', '10 3 big']);
});

test('parser: semicolons required, optional before } and at EOF', () => {
  assert.equal(parse('function f() { return 1 }\nprint(f())').body.length, 2);
  assert.throws(() => parse('let a = 1\nlet b = 2;'), /^SyntaxError: 2:1 expected ';'/);
});

test('parser: syntax errors carry line:col', () => {
  assert.throws(() => parse('let x = 1;\nlet y = ;'), (e) => e instanceof SyntaxError && e.line === 2 && e.col === 9 && /^2:9 /.test(e.message));
  assert.throws(() => parse('print(1;'), /^SyntaxError: 1:8 expected '\)'/);
  assert.throws(() => parse('if (x) {'), /expected '}'/);
  assert.throws(() => parse('1 = 2;'), /invalid assignment target/);
  assert.throws(() => run('x = ;'), SyntaxError);
});

test('parser: guest keys like __proto__ stay plain strings in the AST', () => {
  const o = expr('({ "__proto__": 1, constructor: 2 })');
  assert.deepEqual(o.props.map((q) => q.key), ['__proto__', 'constructor']);
});
