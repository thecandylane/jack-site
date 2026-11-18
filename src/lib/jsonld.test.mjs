import assert from 'node:assert/strict';
import test from 'node:test';
import { jsonLdScript, personJsonLd, postJsonLd } from './jsonld.js';

test('person json-ld matches the public contact facts', () => {
  const p = personJsonLd();
  assert.equal(p.name, 'Jack Schliewe');
  assert.equal(p.address.addressLocality, 'Baton Rouge');
  assert.ok(p.sameAs.includes('https://github.com/thecandylane'));
  assert.ok(p.sameAs.includes('https://www.linkedin.com/in/thecandylane/'));
  assert.equal(jsonLdScript(p).includes('<'), false);
});

test('a post json-ld uses that post and nothing else', () => {
  const p = postJsonLd({
    title: 'ref-radar',
    lede: 'Prior art.',
    date: '2026-11-18',
    slug: 'ref-radar',
  });
  assert.equal(p.headline, 'ref-radar');
  assert.equal(p.datePublished, '2026-11-18');
  assert.equal(p.url, 'https://schliewesystems.com/blog/ref-radar');
  assert.equal(p.author.name, 'Jack Schliewe');
});
