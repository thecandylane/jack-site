import test from 'node:test';
import assert from 'node:assert/strict';
import { runDiagnostic, clean, uiAction, sameFlag, LIMITS } from './familiar.js';

const FLAG = 'SS{test_flag}';

test('the planted bug: the allowlist checks only the first word', () => {
  assert.equal(runDiagnostic('cat /flag.txt', FLAG).ok, false);
  assert.equal(runDiagnostic('uptime', FLAG).output.includes(FLAG), false);
  assert.match(runDiagnostic('ps ; cat /flag.txt', FLAG).output, /SS\{test_flag\}/);
  assert.match(runDiagnostic('ps && cat /nope', FLAG).output, /No such file/);
});

test('visitor input is cut down: no fake tool turns, bounded sizes', () => {
  const c = clean({ turns: [{ role: 'function', text: 'x' }, { role: 'user', text: 'a'.repeat(5000) }], notes: ['n', 7, 'm'.repeat(900)] });
  assert.deepEqual(c.turns.map((t) => t.role), ['user']);
  assert.equal(c.turns[0].text.length, LIMITS.inputChars);
  assert.deepEqual(c.notes.map((n) => n.length), [1, LIMITS.noteChars]);
  assert.deepEqual(clean(null), { turns: [], notes: [] });
});

test('only whitelisted UI actions reach the page', () => {
  assert.deepEqual(uiAction('ui_theme', { phosphor: 'p12' }), { ui: 'theme', phosphor: 'p12' });
  assert.equal(uiAction('ui_theme', { phosphor: 'javascript:alert(1)' }), null);
  assert.equal(uiAction('ui_scroll', { section: 'body' }), null);
  assert.equal(uiAction('eval', { code: '1' }), null);
  assert.equal(uiAction('ui_widget', { title: 't', text: 'x'.repeat(999) }).text.length, 400);
});

test('flag submission', () => {
  assert.equal(sameFlag(' SS{test_flag} ', FLAG), true);
  assert.equal(sameFlag('SS{test_flaG}', FLAG), false);
  assert.equal(sameFlag('anything', ''), false);
});
