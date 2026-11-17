import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAME, cmp, previous, compare } from './npmdiff.js';

const levels = (f) => f.map((x) => x.level);

test('semver order, prereleases below their release', () => {
  assert.equal(cmp('1.10.0', '1.9.9'), 1);
  assert.equal(cmp('2.0.0-rc.1', '2.0.0'), -1);
  assert.equal(cmp('2.0.0-rc.10', '2.0.0-rc.9'), 1);
  assert.equal(cmp('1.2.3', '1.2.3'), 0);
});

test('previous skips prereleases unless the version is one', () => {
  const v = ['1.0.0', '1.1.0', '1.2.0-beta.1', '1.2.0', '2.0.0-rc.1'];
  assert.equal(previous(v, '1.2.0'), '1.1.0');
  assert.equal(previous(v, '2.0.0-rc.1'), '1.2.0');
  assert.equal(previous(v, '1.0.0'), null);
});

test('package names', () => {
  assert.ok(NAME.test('chalk') && NAME.test('@tanstack/react-query'));
  assert.ok(!NAME.test('../etc') && !NAME.test('Chalk') && !NAME.test('a b'));
});

test('a clean patch release has no findings', () => {
  const a = { name: 'x', version: '1.0.0', dependencies: { y: '^1.0.0' }, dist: { unpackedSize: 10000, fileCount: 5 }, _npmUser: { name: 'me' } };
  assert.deepEqual(compare(a, { ...a, version: '1.0.1' }), []);
});

test('the Shai-Hulud shape trips several checks', () => {
  const a = {
    name: 'x', version: '1.0.0', scripts: { test: 'node test' }, dependencies: { y: '^1.0.0' },
    dist: { unpackedSize: 20000, fileCount: 8, attestations: { provenance: { predicateType: 'https://slsa.dev/provenance/v1' } } }, _npmUser: { name: 'me' },
  };
  const b = {
    name: 'x', version: '1.0.1', scripts: { test: 'node test', preinstall: 'node setup.mjs' }, dependencies: { y: '^1.0.0', z: 'github:someone/z' },
    dist: { unpackedSize: 4000000, fileCount: 10 }, _npmUser: { name: 'someone-else' },
  };
  const f = compare(a, b);
  assert.equal(levels(f).filter((l) => l === 'high').length, 3, JSON.stringify(f)); // hook, remote dep, provenance gone
  assert.ok(f.some((x) => /different account/.test(x.text)));
  assert.ok(f.some((x) => /Unpacked size/.test(x.text)));
});

test('a new native build and a new bin are caught', () => {
  const a = { name: 'x', version: '1.0.0' };
  const f = compare(a, { name: 'x', version: '1.1.0', gypfile: true, bin: 'cli.js' });
  assert.deepEqual(levels(f), ['high', 'warn']);
});

test('a first version lists hooks and dependencies without comparing', () => {
  const f = compare(null, { name: 'x', version: '0.0.1', scripts: { postinstall: 'node i.js' }, dependencies: { y: '1' } });
  assert.deepEqual(levels(f), ['high', 'info']);
});

test('an unchanged install hook is listed as info, not a flag', () => {
  const a = { name: 'x', version: '1.0.0', scripts: { postinstall: 'node install.js' } };
  assert.deepEqual(levels(compare(a, { ...a, version: '1.0.1' })), ['info']);
});
