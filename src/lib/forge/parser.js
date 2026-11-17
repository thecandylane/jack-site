// Forge parser: tokens to the AST in docs/forge-plan.md section 4. Recursive descent plus a
// Pratt loop for binary operators. Nodes carry no positions.

import { tokenize, syntaxError } from './lexer.js';

// Binding powers: higher binds tighter. Logical ops share one tier, per the plan.
const BINARY = new Map([
  ['*', 6], ['/', 6], ['%', 6],
  ['+', 5], ['-', 5],
  ['<', 4], ['>', 4], ['<=', 4], ['>=', 4],
  ['===', 3], ['!==', 3],
  ['&&', 2], ['||', 2],
]);
const ASSIGN = new Set(['=', '+=', '-=']);

export function parse(src) {
  const toks = tokenize(src);
  let p = 0;

  const peek = () => toks[p];
  const fail = (msg, t = peek()) => syntaxError(msg, t.line, t.col);
  const desc = (t) => (t.type === 'eof' ? 'end of input' : `'${t.value}'`);
  const is = (type, value) => peek().type === type && peek().value === value;
  const isP = (v) => is('punct', v);
  const isK = (v) => is('keyword', v);
  const next = () => toks[p++];
  const eatP = (v) => (isP(v) ? (next(), true) : false);
  const expectP = (v) => {
    if (!isP(v)) throw fail(`expected '${v}' but found ${desc(peek())}`);
    return next();
  };
  const expectK = (v) => {
    if (!isK(v)) throw fail(`expected '${v}' but found ${desc(peek())}`);
    return next();
  };
  const ident = () => {
    if (peek().type !== 'ident') throw fail(`expected a name but found ${desc(peek())}`);
    return next().value;
  };
  // A semicolon ends a statement; it may be left out before } and at EOF.
  const semi = () => {
    if (eatP(';')) return;
    if (isP('}') || peek().type === 'eof') return;
    throw fail(`expected ';' but found ${desc(peek())}`);
  };

  // --- statements ---------------------------------------------------------------------------

  function varDecl() {
    const kind = next().value;
    const decls = [];
    do {
      const id = ident();
      const init = eatP('=') ? expr() : null;
      decls.push({ id, init });
    } while (eatP(','));
    return { type: 'VarDecl', kind, decls };
  }

  function block() {
    expectP('{');
    const body = [];
    while (!isP('}')) {
      if (peek().type === 'eof') throw fail("expected '}' but found end of input");
      body.push(stmt());
    }
    next();
    return { type: 'Block', body };
  }

  function stmt() {
    const t = peek();
    if (t.type === 'punct') {
      if (t.value === '{') return block();
      if (t.value === ';') { next(); return { type: 'Block', body: [] }; }
    }
    if (t.type === 'keyword') {
      switch (t.value) {
        case 'let': case 'const': case 'var': {
          const d = varDecl();
          semi();
          return d;
        }
        case 'function': {
          next();
          const id = ident();
          expectP('(');
          const params = [];
          if (!isP(')')) do params.push(ident()); while (eatP(','));
          expectP(')');
          return { type: 'FuncDecl', id, params, body: block() };
        }
        case 'if': {
          next();
          expectP('(');
          const test = expr();
          expectP(')');
          const cons = stmt();
          let alt = null;
          if (isK('else')) { next(); alt = stmt(); }
          return { type: 'If', test, cons, alt };
        }
        case 'while': {
          next();
          expectP('(');
          const test = expr();
          expectP(')');
          return { type: 'While', test, body: stmt() };
        }
        case 'for': {
          next();
          expectP('(');
          let init = null;
          if (isP(';')) next();
          else if (isK('let') || isK('const') || isK('var')) { init = varDecl(); expectP(';'); }
          else { init = { type: 'ExprStmt', expr: expr() }; expectP(';'); }
          const test = isP(';') ? null : expr();
          expectP(';');
          const update = isP(')') ? null : expr();
          expectP(')');
          return { type: 'For', init, test, update, body: stmt() };
        }
        case 'return': {
          next();
          const arg = isP(';') || isP('}') || peek().type === 'eof' ? null : expr();
          semi();
          return { type: 'Return', arg };
        }
        case 'throw': {
          next();
          const arg = expr();
          semi();
          return { type: 'Throw', arg };
        }
        case 'try': {
          next();
          const b = block();
          expectK('catch');
          let param = null;
          if (eatP('(')) { param = ident(); expectP(')'); }
          return { type: 'Try', block: b, param, handler: block() };
        }
        default:
      }
    }
    const e = expr();
    semi();
    return { type: 'ExprStmt', expr: e };
  }

  // --- expressions --------------------------------------------------------------------------

  function expr() {
    return assignment();
  }

  // assignment is right-associative and sits below the ternary on the way down
  function assignment() {
    const left = ternary();
    if (peek().type === 'punct' && ASSIGN.has(peek().value)) {
      const opTok = next();
      if (left.type !== 'Ident' && left.type !== 'Member') throw fail('invalid assignment target', opTok);
      return { type: 'Assign', op: opTok.value, target: left, value: assignment() };
    }
    return left;
  }

  function ternary() {
    const test = binary(0);
    if (!eatP('?')) return test;
    const cons = assignment();
    expectP(':');
    return { type: 'Conditional', test, cons, alt: assignment() };
  }

  // Pratt loop: left-associative, so the right side must bind strictly tighter.
  function binary(minBp) {
    let left = unary();
    for (;;) {
      const t = peek();
      const bp = t.type === 'punct' ? BINARY.get(t.value) : undefined;
      if (bp === undefined || bp <= minBp) return left;
      next();
      const right = binary(bp);
      left = t.value === '&&' || t.value === '||'
        ? { type: 'Logical', op: t.value, left, right }
        : { type: 'Binary', op: t.value, left, right };
    }
  }

  function unary() {
    const t = peek();
    if ((t.type === 'punct' && (t.value === '-' || t.value === '!')) || (t.type === 'keyword' && t.value === 'typeof')) {
      next();
      return { type: 'Unary', op: t.value, arg: unary() };
    }
    return postfix(primary(), true);
  }

  function args() {
    expectP('(');
    const list = [];
    if (!isP(')')) do list.push(assignment()); while (eatP(','));
    expectP(')');
    return list;
  }

  // Member access and calls. A `new` callee takes members only, so `new A(1).b` is (new A(1)).b.
  function postfix(node, allowCall) {
    for (;;) {
      if (eatP('.')) {
        const t = next();
        if (t.type !== 'ident' && t.type !== 'keyword') throw fail(`expected a property name but found ${desc(t)}`, t);
        node = { type: 'Member', object: node, property: { type: 'Ident', name: t.value }, computed: false };
      } else if (eatP('[')) {
        const property = expr();
        expectP(']');
        node = { type: 'Member', object: node, property, computed: true };
      } else if (allowCall && isP('(')) {
        node = { type: 'Call', callee: node, args: args() };
      } else return node;
    }
  }

  function primary() {
    const t = next();
    switch (t.type) {
      case 'num': return { type: 'Num', value: t.value };
      case 'str': return { type: 'Str', value: t.value };
      case 'ident': return { type: 'Ident', name: t.value };
      case 'keyword':
        switch (t.value) {
          case 'true': return { type: 'Bool', value: true };
          case 'false': return { type: 'Bool', value: false };
          case 'null': return { type: 'Null' };
          case 'undefined': return { type: 'Undefined' };
          case 'new': {
            const callee = postfix(primary(), false);
            return { type: 'New', callee, args: isP('(') ? args() : [] };
          }
          default:
        }
        break;
      case 'punct':
        if (t.value === '(') {
          const e = expr();
          expectP(')');
          return e;
        }
        if (t.value === '[') {
          const elements = [];
          while (!isP(']')) {
            elements.push(assignment());
            if (!eatP(',')) break;
          }
          expectP(']');
          return { type: 'Array', elements };
        }
        if (t.value === '{') {
          const props = [];
          while (!isP('}')) {
            const k = next();
            if (k.type !== 'ident' && k.type !== 'keyword' && k.type !== 'str' && k.type !== 'num') {
              throw fail(`expected a property key but found ${desc(k)}`, k);
            }
            expectP(':');
            props.push({ key: String(k.value), value: assignment() });
            if (!eatP(',')) break;
          }
          expectP('}');
          return { type: 'Object', props };
        }
        break;
      default:
    }
    throw fail(`unexpected ${desc(t)}`, t);
  }

  const body = [];
  while (peek().type !== 'eof') body.push(stmt());
  return { type: 'Program', body };
}
