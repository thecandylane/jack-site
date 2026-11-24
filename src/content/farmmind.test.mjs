import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as fm from './farmmind.js';

const PUBLIC = new URL('../../public', import.meta.url).pathname;

// Every string in the module, however deep.
const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const all = strings(fm);
const local = all.filter((s) => s.startsWith('/'));
const urls = all.filter((s) => /^[a-z]+:\/\//i.test(s));

test('every local path exists under public/', () => {
  assert.ok(local.length > 80);
  for (const p of local) assert.ok(existsSync(PUBLIC + p), p);
});

test('every link is https', () => {
  for (const u of urls) assert.match(u, /^https:\/\//, u);
});

test('every video has a YouTube id and a poster', () => {
  const ids = [...fm.VIDEOS.map((v) => v.id), ...fm.BUILT.flatMap((b) => b.videos), ...fm.PRESS.flatMap((p) => p.video ?? [])];
  for (const id of ids) {
    assert.match(id, /^[A-Za-z0-9_-]{11}$/, id);
    assert.ok(existsSync(`${PUBLIC}/farmmind/yt/${id}.jpg`), id);
    assert.ok(fm.VIDEOS.some((v) => v.id === id), `${id} is not in VIDEOS`);
  }
});

test('the tutorial library has all 109 pages', () => {
  assert.equal(Object.values(fm.TUTORIALS).reduce((n, s) => n + s.items.length, 0), 109);
});

test('no banned words', () => {
  // The spotlight URL's slug is FarmMind's, so only text (not links) is checked for "intern".
  for (const s of all) {
    assert.doesNotMatch(s, /anyfarms|livekit|openrouter|farmer al\b/i, s);
    if (!urls.includes(s)) assert.doesNotMatch(s, /\bintern/i, s);
  }
});
