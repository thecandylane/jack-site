// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { createForge } from './index.js';
import { POLLUTION_LAB } from './labs/pollution.js';

const B = (value) => ({ type: 'Bool', value });
const Obj = (props = []) => ({ type: 'Object', props: props.map(([key, value]) => ({ key, value })) });
const Id = (name) => ({ type: 'Ident', name });
const Var = (id, init) => ({ type: 'VarDecl', kind: 'let', decls: [{ id, init }] });
const Call = (callee, args = []) => ({ type: 'Call', callee, args });
const Expr = (expr) => ({ type: 'ExprStmt', expr });
const Program = (body) => ({ type: 'Program', body });

const forge = (flag) => createForge({ heapBytes: 1 << 16, flag });

test('exec refuses when the option object is clean', () => {
  const f = forge();
  const out = f.exec(
    Program([Var('view', Call(Id('exec'), [Obj()])), Expr(Call(Id('print'), [Call(Id('read'), [Id('view')])]))]),
  );
  assert.equal(out.ok, true);
  assert.equal(f.host.opened, 0);
  assert.deepEqual(f.host.reads, []);
});

test('merge pollutes Object.prototype and exec takes the native path', () => {
  const f = forge('FORGE{test_flag}');
  const out = f.exec(
    Program([
      Var('payload', Obj([['__proto__', Obj([['shell', B(true)]])]])),
      Var('target', Obj()),
      Expr(Call(Id('merge'), [Id('target'), Id('payload')])),
      Var('view', Call(Id('exec'), [Obj()])),
      Expr(Call(Id('print'), [Call(Id('read'), [Id('view')])])),
    ]),
  );
  assert.equal(out.ok, true, out.error);
  assert.deepEqual(out.log, ['FORGE{test_flag}']);
  assert.equal(f.host.opened, 1);
  assert.deepEqual(f.host.reads, [0]);
  assert.equal(POLLUTION_LAB.check(f).solved, true);
});

test('the checker refuses a run that never reached the native path', () => {
  const f = forge();
  const out = f.exec(Program([Var('target', Obj()), Expr(Call(Id('merge'), [Id('target'), Obj([['a', B(true)]])]))]));
  assert.equal(out.ok, true, out.error);
  const verdict = POLLUTION_LAB.check(f);
  assert.equal(verdict.solved, false);
  assert.match(verdict.why, /native exec path/);
});

test('an own __proto__ property shadows the prototype link, as JSON.parse does', () => {
  const f = forge();
  const out = f.exec(
    Program([
      Var('payload', Obj([['__proto__', Obj([['shell', B(true)]])]])),
      Var('viaOwn', { type: 'Member', object: Id('payload'), property: { type: 'Ident', name: '__proto__' }, computed: false }),
      Expr(Call(Id('print'), [Call(Id('String'), [Id('viaOwn')])])),
    ]),
  );
  assert.equal(out.ok, true, out.error);
  assert.deepEqual(out.log, ['[object]']); // the payload object, not the prototype
});

test('pollution inside the cage never reaches this page', () => {
  const f = forge();
  f.exec(
    Program([
      Var('payload', Obj([['__proto__', Obj([['shell', B(true)], ['polluted', B(true)]])]])),
      Var('target', Obj()),
      Expr(Call(Id('merge'), [Id('target'), Id('payload')])),
    ]),
  );
  assert.equal({}.shell, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});
