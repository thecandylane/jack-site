// node --test src/lib
// Never import next.config.mjs here: importing it runs initOpenNextCloudflareForDev().
import test from 'node:test';
import assert from 'node:assert/strict';
import { SECURITY_HEADERS, CSP_DIRECTIVES } from './security-headers.js';

// The exact array next.config.mjs used before the data moved here, joined the same way. This pins the
// refactor to a byte-for-byte identical CSP header without ever importing the config.
const ORIGINAL_CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `font-src 'self'`,
  `img-src 'self' data:`,
  `connect-src 'self' https://ref.lookit.space https://api.pwnedpasswords.com https://registry.npmjs.org`,
  `frame-src https://ref.lookit.space https://www.youtube-nocookie.com`, // the FarmMind showcase's click-to-load videos
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'none'`,
  `form-action 'self' https://ref.lookit.space`,
  `frame-ancestors 'none'`,
  `require-trusted-types-for 'script'`,
].join('; ');

const CSP = CSP_DIRECTIVES.map(({ directive, value }) => `${directive} ${value}`).join('; ');

test('every CSP directive has a note and a valid strength', () => {
  const strengths = new Set(['strong', 'weak', 'info']);
  for (const d of CSP_DIRECTIVES) {
    assert.equal(typeof d.directive, 'string');
    assert.ok(d.directive.length > 0);
    assert.equal(typeof d.value, 'string');
    assert.ok(d.value.length > 0);
    assert.equal(typeof d.note, 'string', `${d.directive} has a note`);
    assert.ok(d.note.length > 0, `${d.directive} note is not empty`);
    assert.ok(strengths.has(d.strength), `${d.directive} strength is strong|weak|info`);
  }
});

test('the joined CSP is byte-for-byte the header the config sends', () => {
  assert.equal(CSP, ORIGINAL_CSP);
});

test('the CSP allows no standalone unsafe-eval but keeps wasm-unsafe-eval', () => {
  // Match the quoted source expression, not the substring: 'wasm-unsafe-eval' (YARA-X) is allowed
  // on purpose, so a bare includes('unsafe-eval') check would false-positive.
  assert.ok(!CSP_DIRECTIVES.some(({ value }) => value.split(/\s+/).includes(`'unsafe-eval'`)));
  assert.ok(!CSP.includes(`'unsafe-eval'`));
  assert.ok(CSP.includes(`'wasm-unsafe-eval'`));
});

test('the CSP enforces Trusted Types and locks down the dangerous sinks', () => {
  assert.ok(CSP.includes(`require-trusted-types-for 'script'`));
  assert.ok(CSP.includes(`object-src 'none'`));
  assert.ok(CSP.includes(`base-uri 'none'`));
  assert.ok(CSP.includes(`frame-ancestors 'none'`));
});

test('SECURITY_HEADERS contains the expected keys and each has a note', () => {
  assert.deepEqual(SECURITY_HEADERS.map((h) => h.key), [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
  ]);
  for (const h of SECURITY_HEADERS) {
    assert.equal(typeof h.value, 'string');
    assert.ok(h.value.length > 0);
    assert.equal(typeof h.note, 'string', `${h.key} has a note`);
    assert.ok(h.note.length > 0, `${h.key} note is not empty`);
  }
  // HSTS is deliberately absent: it belongs in Cloudflare, not the app.
  assert.ok(!SECURITY_HEADERS.some((h) => h.key === 'Strict-Transport-Security'));
});
