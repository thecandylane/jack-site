// Forge lexer: source text to tokens. Pure; no eval, no host lookups keyed by guest text.

const KEYWORDS = new Set([
  'let', 'const', 'var', 'function', 'if', 'else', 'while', 'for', 'return', 'throw', 'try',
  'catch', 'new', 'typeof', 'true', 'false', 'null', 'undefined',
]);
const PUNCT3 = ['===', '!=='];
const PUNCT2 = ['<=', '>=', '+=', '-=', '&&', '||'];
const PUNCT1 = '+-*/%<>=!?:;,.(){}[]';

export function syntaxError(message, line, col) {
  const err = new SyntaxError(`${line}:${col} ${message}`);
  err.line = line;
  err.col = col;
  return err;
}

const isDigit = (c) => c >= '0' && c <= '9';
const isIdStart = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';

export function tokenize(src) {
  src = String(src);
  const out = [];
  let i = 0, line = 1, col = 1;
  const adv = () => {
    if (src[i] === '\n') { line++; col = 1; } else col++;
    i++;
  };
  const push = (type, value, l, c) => out.push({ type, value, line: l, col: c });

  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { adv(); continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') adv();
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const l = line, cl = col;
      adv(); adv();
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) adv();
      if (i >= src.length) throw syntaxError('unterminated comment', l, cl);
      adv(); adv();
      continue;
    }
    const l = line, cl = col;
    if (isDigit(c)) {
      let s = '';
      while (isDigit(src[i] ?? '')) { s += src[i]; adv(); }
      if (src[i] === '.' && isDigit(src[i + 1] ?? '')) {
        s += '.'; adv();
        while (isDigit(src[i] ?? '')) { s += src[i]; adv(); }
      }
      if (isIdStart(src[i] ?? '')) throw syntaxError('bad number', l, cl);
      push('num', Number(s), l, cl);
      continue;
    }
    if (isIdStart(c)) {
      let s = '';
      while (i < src.length && (isIdStart(src[i]) || isDigit(src[i]))) { s += src[i]; adv(); }
      push(KEYWORDS.has(s) ? 'keyword' : 'ident', s, l, cl);
      continue;
    }
    if (c === '"' || c === "'") {
      adv();
      let s = '';
      for (;;) {
        if (i >= src.length || src[i] === '\n') throw syntaxError('unterminated string', l, cl);
        const ch = src[i];
        if (ch === c) { adv(); break; }
        if (ch === '\\') {
          adv();
          const e = src[i];
          if (e === 'n') s += '\n';
          else if (e === 't') s += '\t';
          else if (e === '\\' || e === '"' || e === "'") s += e;
          else throw syntaxError('bad escape', line, col - 1);
          adv();
        } else { s += ch; adv(); }
      }
      push('str', s, l, cl);
      continue;
    }
    const p3 = src.slice(i, i + 3), p2 = src.slice(i, i + 2);
    const p = PUNCT3.includes(p3) ? p3 : PUNCT2.includes(p2) ? p2 : PUNCT1.includes(c) ? c : null;
    if (p === null) throw syntaxError(`unexpected character '${c}'`, l, cl);
    for (let k = 0; k < p.length; k++) adv();
    push('punct', p, l, cl);
  }
  push('eof', '', line, col);
  return out;
}
