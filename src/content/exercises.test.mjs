import { test as nodeTest } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as ex from './exercises.js';

// Runs an exercise the way <Playground/> does: the code, then its tests, in one scope.
function run(code, tests) {
  const results = [], logs = [];
  const show = (v) => (typeof v === 'string' ? v : JSON.stringify(v));
  const eq = (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`got ${show(a)}, expected ${show(b)}`); };
  const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, why: e.message }); } };
  vm.runInNewContext(`${code}\n;\n${tests}`, { test, eq, console: { log: (...a) => logs.push(a.join(' ')) }, TextEncoder, crypto });
  return { results, logs };
}

// Reference fixes. They live here, not in the posts, so the exercises aren't spoiled.
const fixes = {
  forge: (c) => c.replace('i < input.length', 'i < Math.min(input.length, BUF)'),
  ashen: (c) => c.replace("return !s.includes(';');", "return s.length <= 253 && s.split('.').every((l) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(l));"),
  warCamp: (c) => c.replace(/function safeJoin[\s\S]*?\n}\n/, `function safeJoin(root, entry) {
  if (entry.startsWith('/') || entry.includes('\\\\')) return null;
  const parts = [];
  for (const p of entry.split('/')) {
    if (p === '..') { if (!parts.length) return null; parts.pop(); } else if (p && p !== '.') parts.push(p);
  }
  return parts.length ? root + '/' + parts.join('/') : null;
}
`),
  kingsSeal: (c) => c.replace(/function verify[\s\S]*?\n}\n/, `function verify(token) {
  const { alg, kid } = token.header;
  if (alg !== 'HS256' || !Object.hasOwn(KEYS, kid)) return false;
  return token.sig === sign(KEYS[kid], JSON.stringify(token.payload));
}
`),
  bindingCircle: (c) => c.replace(/return SAFE\.some.*\n/, 'return SAFE.includes(cmd);\n'),
  familiar: (c) => c.replace(/function checkCall[\s\S]*?\n}\n/, `function checkCall(call) {
  if (call?.name !== 'run_diagnostic') return null;
  const a = call.args;
  if (!a || typeof a !== 'object' || Object.keys(a).join() !== 'check' || !Object.hasOwn(CHECKS, a.check)) return null;
  return CHECKS[a.check];
}
`),
  fingerprintBits: (c) => c.replace('return 0; // TODO', 'return -Math.log2(share);'),
  typing: (c) => c.replace('return { dwell: [], flight: [] }; // TODO', `const presses = [], dwell = [];
  for (const e of events) {
    if (e.type === 'down') presses.push({ key: e.key, down: e.t });
    else { const p = presses.findLast((q) => q.key === e.key && q.up === undefined); p.up = e.t; dwell.push(e.t - p.down); }
  }
  return { dwell, flight: presses.slice(1).map((p, i) => p.down - presses[i].up) };`),
  pwned: (c) => c.replace('return 0; // TODO', `const suffix = hash.toUpperCase().slice(5);
  const line = response.split(String.fromCharCode(10)).map((l) => l.trim()).find((l) => l.split(':')[0] === suffix);
  return line ? Number(line.split(':')[1]) : 0;`),
  safeName: (c) => c.replace('  return name;', "  return [...new TextEncoder().encode(name)].map((b) => (b >= 0x20 && b <= 0x7e && b !== 0x5c ? String.fromCharCode(b) : '\\\\x' + b.toString(16).padStart(2, '0'))).join('');"),
};

for (const [name, fix] of Object.entries(fixes)) {
  nodeTest(`${name}: the starter fails at least one test`, () => {
    const { results } = run(ex[name].code, ex[name].tests);
    assert.ok(results.length > 0 && results.some((r) => !r.ok), JSON.stringify(results));
  });
  nodeTest(`${name}: the fix passes every test`, () => {
    const fixed = fix(ex[name].code);
    assert.notEqual(fixed, ex[name].code, 'fix did not apply');
    const { results } = run(fixed, ex[name].tests);
    assert.deepEqual(results.filter((r) => !r.ok), []);
  });
}

nodeTest('entropy: text is low and random bytes are near 8', () => {
  const { logs } = run(ex.entropy.code, '');
  const bits = Object.fromEntries(logs.map((l) => [l.split(/\s+/)[0], parseFloat(l.split(/\s+/)[1])]));
  assert.ok(bits.readme < 5 && bits.random > 7.9, JSON.stringify(bits));
});
