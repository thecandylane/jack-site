import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { llmsText, postMetas } from './llms.js';

const root = path.join(import.meta.dirname, '../..');
const posts = postMetas(path.join(root, 'src/content/posts'));

test('llms.txt lists every post with its title and lede', () => {
  const text = fs.readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
  assert.equal(text, llmsText(posts));
  assert.ok(posts.length >= 12);
  for (const p of posts) {
    assert.match(text, new RegExp(p.slug));
    assert.ok(text.includes(p.title));
  }
});
