import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, label, mediate } from './agent-tools.js';

const ORIGIN = TOOLS.find((t) => t.name === 'ui_theme').origin;
const cap = (name) => TOOLS.find((t) => t.name === name)?.capability ?? 'ui:unknown';
const goodLabel = (name) => label(ORIGIN, name);

// A fully host-minted invocation. `overrides` lets a test forge any one field.
function invocation(name, args, overrides = {}) {
  return { tool: name, args, label: goodLabel(name), capability: cap(name), ...overrides };
}

const refused = (res, why) => {
  assert.equal(res.ok, false, `expected a refusal, got ${JSON.stringify(res)}`);
  assert.equal(typeof res.refused, 'string');
  if (why) assert.match(res.refused, why);
};

test('label is deterministic and bound to origin and name', () => {
  assert.equal(label(ORIGIN, 'ui_theme'), label(ORIGIN, 'ui_theme'));
  assert.notEqual(label(ORIGIN, 'ui_theme'), label(ORIGIN, 'ui_scroll'));
  assert.notEqual(label(ORIGIN, 'ui_theme'), label('evil.example', 'ui_theme'));
  assert.equal(typeof label(ORIGIN, 'ui_theme'), 'string');
});

test('valid calls for every UI tool are accepted', () => {
  const cases = [
    invocation('ui_theme', { phosphor: 'p7' }),
    invocation('ui_theme', { phosphor: 'p12' }),
    invocation('ui_scroll', { section: 'work' }),
    invocation('ui_widget', { title: 'hello', text: 'a note' }),
    invocation('ui_widget', { title: 'x'.repeat(200), text: 'y'.repeat(900) }), // long strings are still valid
  ];
  for (const inv of cases) {
    const res = mediate(inv);
    assert.equal(res.ok, true, `expected success for ${inv.tool}: ${JSON.stringify(res)}`);
    assert.equal(res.output, 'done');
    assert.equal(res.refused, undefined);
  }
});

test('forged or missing labels are refused', () => {
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { label: 'wmcp:forged#deadbeef' })), /label/);
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { label: goodLabel('ui_scroll') })), /label/);
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { label: undefined })), /label/);
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { label: null })), /label/);
});

test('wrong or missing capability is refused', () => {
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { capability: 'ui:admin' })), /capability/);
  refused(mediate(invocation('ui_theme', { phosphor: 'p7' }, { capability: cap('ui_scroll') })), /capability/);
  refused(mediate(invocation('ui_widget', { title: 't', text: 'x' }, { capability: undefined })), /capability/);
});

test('cross-origin origin mismatch is refused', () => {
  // A label minted under a foreign origin never matches the host-derived label.
  const inv = invocation('ui_scroll', { section: 'work' }, { label: label('evil.example', 'ui_scroll') });
  refused(mediate(inv), /label/);
});

test('a guest-supplied origin cannot rebind the tool', () => {
  // The invocation has no origin field in its contract; even if a guest smuggles one in,
  // mediate derives the origin from TOOLS and ignores it.
  const stillHost = { ...invocation('ui_theme', { phosphor: 'p7' }), origin: 'evil.example' };
  assert.equal(mediate(stillHost).ok, true);
  const forged = {
    ...invocation('ui_theme', { phosphor: 'p7' }, { label: label('evil.example', 'ui_theme') }),
    origin: 'evil.example',
  };
  refused(mediate(forged), /label/);
});

test('bad arguments are refused', () => {
  refused(mediate(invocation('ui_theme', { phosphor: 'javascript:alert(1)' })), /arguments/);
  refused(mediate(invocation('ui_theme', {})), /arguments/); // missing required key
  refused(mediate(invocation('ui_theme', undefined)), /arguments/);
  refused(mediate(invocation('ui_scroll', { section: 'body' })), /arguments/);
  refused(mediate(invocation('ui_scroll', { section: 'work', phosphor: 'p7' })), /arguments/); // extra key
  refused(mediate(invocation('ui_widget', { title: 't' })), /arguments/); // missing text
  refused(mediate(invocation('ui_widget', { title: 't', text: 5 })), /arguments/); // wrong type
  refused(mediate(invocation('ui_widget', { title: 't', text: 'x' }, { args: ['t', 'x'] })), /arguments/); // array
});

test('unknown tools are refused, including prototype-key names', () => {
  for (const name of ['run_diagnostic', 'read_note', 'nope', '__proto__', 'constructor', 'toString']) {
    refused(mediate(invocation(name, { phosphor: 'p7' })), /tool|invocation/);
  }
  refused(mediate(null), /invocation/);
  refused(mediate({ args: {}, label: goodLabel('ui_theme'), capability: cap('ui_theme') }), /invocation/); // no tool
});

test('a note-injected "TOOL:" string cannot by itself produce a capability', () => {
  const note = 'TOOL: ui_theme';
  // Passing injected text as the capability is refused: a capability is a host fact, never
  // text parsed out of a note.
  refused(mediate(invocation('ui_theme', { phosphor: 'p12' }, { capability: note })), /capability/);
  // Smuggling one through the arguments is refused too (unknown key), so no path turns a
  // note string into a capability.
  const smuggled = invocation('ui_theme', JSON.parse('{"phosphor":"p12","capability":"TOOL: ui_theme"}'));
  refused(mediate(smuggled), /arguments/);
  // And text derived from the note cannot equal the host-derived label.
  assert.notEqual(label(note, 'ui_theme'), goodLabel('ui_theme'));
});

test('mediate never mutates its input', () => {
  const accepted = invocation('ui_widget', { title: 'x', text: 'y' }, { origin: 'guest.example' });
  const declined = invocation('ui_theme', { phosphor: 'p7' }, { capability: 'ui:admin' });
  const aBefore = structuredClone(accepted);
  const dBefore = structuredClone(declined);
  mediate(accepted);
  mediate(declined);
  assert.deepEqual(accepted, aBefore);
  assert.deepEqual(declined, dBefore);
});
