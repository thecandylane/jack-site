import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from './lexer.js';

const kinds = (src) => tokenize(src).map((t) => `${t.type}:${t.value}`);

test('lexer: numbers, idents, keywords, punctuation, eof', () => {
  assert.deepEqual(kinds('let x = 1.5 === 2;'), [
    'keyword:let', 'ident:x', 'punct:=', 'num:1.5', 'punct:===', 'num:2', 'punct:;', 'eof:',
  ]);
  assert.deepEqual(kinds('a<=b !== c += 1'), [
    'ident:a', 'punct:<=', 'ident:b', 'punct:!==', 'ident:c', 'punct:+=', 'num:1', 'eof:',
  ]);
});

test('lexer: both comment styles are skipped and lines are counted', () => {
  const t = tokenize('// one\n/* two\nthree */ x');
  assert.equal(t[0].value, 'x');
  assert.equal(t[0].line, 3);
  assert.equal(t[0].col, 10);
});

test('lexer: string escapes', () => {
  const t = tokenize(String.raw`'a\nb\t\\ \' \"' "q"`);
  assert.equal(t[0].value, 'a\nb\t\\ \' "');
  assert.equal(t[1].value, 'q');
});

test('lexer: bad input throws SyntaxError with line:col', () => {
  assert.throws(() => tokenize('x\n  @'), (e) => e instanceof SyntaxError && /^2:3 /.test(e.message));
  assert.throws(() => tokenize('"abc'), /^SyntaxError: 1:1 unterminated string/);
  assert.throws(() => tokenize('/* open'), /unterminated comment/);
  assert.throws(() => tokenize('"\\q"'), /bad escape/);
});
