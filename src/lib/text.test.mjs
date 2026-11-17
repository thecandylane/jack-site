// node --test src/lib
import test from 'node:test';
import assert from 'node:assert/strict';
import { headings, slug, minutes } from './text.js';
import { gaps } from './flow.js';

test('toc ids match heading ids, code fences skipped', () => {
  const src = '## Stage 0: `repo` triggers\n```sh\n## not a heading\n```\n### [Pretext](https://x.y) *flow*\n';
  assert.deepEqual(headings(src), [
    { depth: 2, text: 'Stage 0: repo triggers', id: 'stage-0-repo-triggers' },
    { depth: 3, text: 'Pretext flow', id: 'pretext-flow' },
  ]);
  assert.equal(slug('Stage 3a: vscode-bootstrap.sh (macOS)'), 'stage-3a-vscode-bootstrapsh-macos');
  assert.equal(minutes('word '.repeat(441)), 3);
});

test('text flows on both sides of the disc, full width away from it', () => {
  const c = { x: 500, y: 100, r: 50 };
  assert.deepEqual(gaps(1000, 0, 20, c), [[0, 1000]]); // row 0-20 is above the disc (top at 50)
  assert.deepEqual(gaps(1000, 90, 20, c), [[0, 450], [550, 1000]]); // the row through the centre
  assert.deepEqual(gaps(1000, 90, 20, { x: 30, y: 100, r: 50 }), [[80, 1000]]); // left gap too narrow, dropped
});
