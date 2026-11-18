// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { createForge, LABS } from './index.js';
import { CLOBBER_LAB } from './labs/clobber.js';

const PAYLOAD = '<svg><a id="config" mode="evil"></svg>';

test('the clobber lab is registered with a seed, a language and three hints', () => {
  assert.equal(LABS.length, 4);
  assert.equal(CLOBBER_LAB.kind, 'html');
  assert.equal(CLOBBER_LAB.language, 'html');
  assert.ok(CLOBBER_LAB.seed.includes('id="config"'));
  assert.equal(CLOBBER_LAB.hints.length, 3);
  for (const lab of LABS) {
    assert.ok(lab.seed, `${lab.id} needs a seed`);
    assert.equal(lab.hints.length, 3, `${lab.id} needs three hints`);
  }
});

test('the svg payload solves, and the strict pass refuses the same bytes', () => {
  const open = createForge({ lab: 'clobber' });
  const out = CLOBBER_LAB.evaluate(PAYLOAD, open, false);
  assert.equal(out.ok, true, out.error);
  assert.equal(CLOBBER_LAB.check(open).solved, true);

  const fixed = createForge({ lab: 'clobber', defend: true });
  const after = CLOBBER_LAB.evaluate(PAYLOAD, fixed, true);
  assert.equal(after.ok, true, after.error);
  assert.equal(CLOBBER_LAB.check(fixed).solved, false);
  assert.ok(fixed.htmlState.stripped.includes('id=config'));
});

test('a payload the sanitizer refuses is reported as an error', () => {
  const f = createForge({ lab: 'clobber' });
  const out = CLOBBER_LAB.evaluate('<script>alert(1)</script>', f, false);
  assert.equal(out.ok, false);
  assert.match(out.error, /refused/);
  assert.equal(CLOBBER_LAB.check(f).solved, false);
});
