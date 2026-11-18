// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, parseDom, evaluate } from './html.js';

test('the first pass strips id and name from tags it can see', () => {
  const s = sanitize('<a id="config" mode="evil">');
  assert.equal(s.blocked, false);
  assert.deepEqual(s.stripped, ['id=config']);
  assert.equal(s.html.includes('id='), false);
  assert.equal(evaluate('<a id="config" mode="evil">').solved, false);
});

test('svg content is invisible to the first pass, but live in the second', () => {
  const result = evaluate('<svg><a id="config" mode="evil"></svg>');
  assert.equal(result.blocked, false);
  assert.deepEqual(result.stripped, []);
  assert.equal(result.config?.tag, 'a');
  assert.equal(result.mode, 'evil');
  assert.equal(result.solved, true);
});

test('the strict pass parses svg too and strips the smuggled id', () => {
  const result = evaluate('<svg><a id="config" mode="evil"></svg>', { strict: true });
  assert.deepEqual(result.stripped, ['id=config']);
  assert.equal(result.config, null);
  assert.equal(result.solved, false);
});

test('script, event handlers and javascript: URLs are refused', () => {
  for (const payload of [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)" id="config" mode="evil">',
  ]) {
    const result = evaluate(payload);
    assert.equal(result.blocked, true, payload);
    assert.equal(result.solved, false);
  }
});

test('named properties cannot pollute the host page', () => {
  const named = parseDom('<a id="__proto__" name="constructor">');
  assert.equal(Object.getPrototypeOf(named), null);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});
