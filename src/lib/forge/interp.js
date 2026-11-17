// The tree-walker. Every runtime value it moves around is a u32 word from values.js, and every
// object it builds lives in the cage from heap.js. Nothing here holds guest data in a host JS
// object keyed by guest text: environments are keyed by identifiers the parser produced, maps
// are keyed by host-built strings, and guest strings are decoded from the cage when read.
//
// Two paths in here are deliberately wrong, and both are real bugs in this code rather than
// switches a lab flips. They are marked BUG so a reader can find them, and so a later edit
// that "cleans them up" fails the lab tests instead of silently deleting the lesson:
//   BUG-1  set() writes an array's length without resizing its elements block, so every
//          later index walks the cage. Real engines ship this as a corrupted JSArray length;
//          it is the primitive CVE-2026-79236 ends in.
//   BUG-2  merge() in builtins.js copies keys without a __proto__ guard. M2.

import { smi, isSmi, smiValue, ptr, isPtr, ptrOffset } from './values.js';
import { HEADER, Heap } from './heap.js';
import { Maps, KIND, PROTO_SLOT, slotOffset } from './maps.js';

const ELEM_BASE = HEADER; // element 0 starts after the block header
const MAX_SLOTS = 8;
const DEFAULT_STEPS = 2_000_000;

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}
class ThrowSignal {
  constructor(value) {
    this.value = value;
  }
}

export class Interpreter {
  constructor(heap = new Heap(), maps = new Maps(), { steps = DEFAULT_STEPS } = {}) {
    this.heap = heap;
    this.maps = maps;
    this.steps = steps;
    this.used = 0;
    this.log = [];
    this.fns = [];
    this.builtinWords = new Map();
    this.boot();
  }

  // --- boot -----------------------------------------------------------------------------

  boot() {
    this.MAP_HEAPNUM = this.maps.define({ kind: KIND.HEAPNUM });
    this.MAP_SINGLETON = this.maps.define({ kind: KIND.SINGLETON });
    this.MAP_STRING = this.maps.define({ kind: KIND.STRING });
    this.MAP_FUNC = this.maps.define({ kind: KIND.FUNC });
    this.MAP_ARRAY_SMI = this.maps.define({ kind: KIND.ARRAY, elemRep: 'smi' });
    this.MAP_ARRAY_DBL = this.maps.define({ kind: KIND.ARRAY, elemRep: 'double' });
    this.MAP_OBJECT = this.maps.define({ kind: KIND.OBJECT });
    this.MAP_ELEMS = this.maps.define({ kind: KIND.ELEMS });

    this.objectProto = this.allocObject(this.MAP_OBJECT, 0);
    this.functionProto = this.allocObject(this.MAP_OBJECT, this.objectProto);
    this.arrayProto = this.allocObject(this.MAP_OBJECT, this.objectProto);
    this.protoWord = (off) => ptr(off);

    this.undef = this.singleton('undefined');
    this.nullWord = this.singleton('null');
    this.trueWord = this.singleton('true');
    this.falseWord = this.singleton('false');

    this.installBuiltins();
  }

  singleton(name) {
    const off = this.heap.alloc(HEADER + 2 * 4, this.MAP_SINGLETON);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), this.objectProto ? ptr(this.objectProto) : 0);
    this.heap.writeU32(off + slotOffset(1), this.internHost(name));
    return ptr(off);
  }

  /** Host-built strings only. A guest string never becomes a cage allocation key. */
  internHost(s) {
    return this.str(s);
  }

  // --- allocation -----------------------------------------------------------------------

  allocObject(mapId, protoWord, slots = MAX_SLOTS) {
    const off = this.heap.alloc(HEADER + slots * 4, mapId);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), protoWord ?? 0);
    return off;
  }

  num(n) {
    if (Number.isInteger(n) && n >= -(2 ** 30) && n <= 2 ** 30 - 1) return smi(n);
    const off = this.heap.alloc(HEADER + 8, this.MAP_HEAPNUM);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), 0);
    this.heap.writeF64(off + HEADER, n);
    return ptr(off);
  }

  numValue(word) {
    if (isSmi(word)) return smiValue(word);
    return this.heap.readF64(ptrOffset(word) + HEADER);
  }

  str(s) {
    const bytes = new TextEncoder().encode(String(s));
    const data = this.heap.alloc(HEADER + bytes.length, this.MAP_ELEMS);
    this.heap.buf.set(bytes, data + HEADER);
    const off = this.heap.alloc(HEADER + 2 * 4, this.MAP_STRING);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), this.objectProto ? ptr(this.objectProto) : 0);
    this.heap.writeU32(off + slotOffset(1), smi(bytes.length));
    this.heap.setElem(off, bytes.length ? ptr(data) : 0);
    return ptr(off);
  }

  strValue(word) {
    const off = ptrOffset(word);
    const length = smiValue(this.heap.readU32(off + slotOffset(1)));
    const data = this.heap.elemAt(off);
    if (!length || !data) return '';
    const start = ptrOffset(data) + HEADER;
    return new TextDecoder().decode(this.heap.buf.subarray(start, start + length));
  }

  array(elements) {
    const allSmi = elements.every((w) => isSmi(w));
    const mapId = allSmi ? this.MAP_ARRAY_SMI : this.MAP_ARRAY_DBL;
    const stride = allSmi ? 4 : 8;
    const data = this.heap.alloc(ELEM_BASE + elements.length * stride, this.MAP_ELEMS);
    elements.forEach((w, i) => {
      if (allSmi) this.heap.writeU32(data + ELEM_BASE + i * 4, w);
      else this.heap.writeF64(data + ELEM_BASE + i * 8, this.numValue(w));
    });
    const off = this.heap.alloc(HEADER + 2 * 4, mapId);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), ptr(this.arrayProto));
    this.heap.writeU32(off + slotOffset(1), smi(elements.length));
    this.heap.setElem(off, elements.length ? ptr(data) : 0);
    return ptr(off);
  }

  func(astNode, env) {
    const id = this.fns.length;
    this.fns.push({ node: astNode, env });
    const off = this.heap.alloc(HEADER + 2 * 4, this.MAP_FUNC);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), ptr(this.functionProto));
    this.heap.writeU32(off + slotOffset(1), smi(id));
    return ptr(off);
  }

  // --- property access ------------------------------------------------------------------

  mapOf(word) {
    return this.maps.get(this.heap.mapIdAt(ptrOffset(word)));
  }

  get(objWord, key) {
    if (!isPtr(objWord)) throw this.fail(`cannot read '${key}' of ${this.typeName(objWord)}`);
    let cur = objWord;
    for (let depth = 0; depth < 32; depth++) {
      const off = ptrOffset(cur);
      if (!this.heap.alive(off)) throw this.fail(`read of '${key}' through a dead pointer`);
      const map = this.maps.get(this.heap.mapIdAt(off));
      if (key === '__proto__') {
        const proto = this.heap.readU32(off + slotOffset(PROTO_SLOT));
        return isPtr(proto) ? proto : this.nullWord;
      }
      if (map.kind === KIND.ARRAY && key === 'length') {
        return this.heap.readU32(off + slotOffset(1));
      }
      if (map.kind === KIND.STRING && key === 'length') {
        return this.heap.readU32(off + slotOffset(1));
      }
      if (map.kind === KIND.FUNC && key === 'length') return this.num(0);
      const slot = this.maps.indexOf(map.id, key);
      if (slot >= 0) return this.heap.readU32(off + slotOffset(slot));
      const proto = this.heap.readU32(off + slotOffset(PROTO_SLOT));
      if (!isPtr(proto)) break;
      cur = proto;
    }
    return this.undef;
  }

  set(objWord, key, value) {
    if (!isPtr(objWord)) throw this.fail(`cannot set '${key}' on ${this.typeName(objWord)}`);
    const off = ptrOffset(objWord);
    if (!this.heap.alive(off)) throw this.fail(`write of '${key}' through a dead pointer`);
    if (key === '__proto__') {
      this.heap.writeU32(off + slotOffset(PROTO_SLOT), isPtr(value) || value === this.nullWord ? value : 0);
      return value;
    }
    const mapId = this.heap.mapIdAt(off);
    const map = this.maps.get(mapId);
    if (map.kind === KIND.ARRAY && key === 'length') {
      // BUG-1: the length slot moves, the elements block keeps the size it was allocated
      // with. Every read and write past `oldLength` then walks the cage into whatever was
      // allocated next. Real engines have shipped the same shape as a corrupted JSArray
      // length, and it is the primitive CVE-2026-79236 ends in: controlled cage memory.
      this.heap.writeU32(off + slotOffset(1), value);
      return value;
    }
    const existing = this.maps.indexOf(mapId, key);
    if (existing >= 0) {
      this.heap.writeU32(off + slotOffset(existing), value);
      return value;
    }
    const grown = this.maps.withProp(mapId, key, 'tagged');
    const slot = this.maps.indexOf(grown, key);
    const capacity = (this.heap.sizeAt(off) - HEADER) / 4;
    if (slot >= capacity) throw this.fail(`no room for '${key}' on this object`);
    this.heap.setMapId(off, grown);
    this.heap.writeU32(off + slotOffset(slot), value);
    return value;
  }

  getIndex(arrWord, index) {
    const off = ptrOffset(arrWord);
    const map = this.maps.get(this.heap.mapIdAt(off));
    const length = smiValue(this.heap.readU32(off + slotOffset(1)));
    if (index < 0 || index >= length) return this.undef;
    const elems = this.heap.elemAt(off);
    if (!elems) return this.undef;
    const base = ptrOffset(elems) + ELEM_BASE;
    return map.elemRep === 'double' ? this.num(this.heap.readF64(base + index * 8)) : this.heap.readU32(base + index * 4);
  }

  setIndex(arrWord, index, value) {
    const off = ptrOffset(arrWord);
    const map = this.maps.get(this.heap.mapIdAt(off));
    const length = smiValue(this.heap.readU32(off + slotOffset(1)));
    if (index < 0 || index >= length) throw this.fail(`index ${index} out of range`);
    const elems = this.heap.elemAt(off);
    const double = !isSmi(value);
    if (map.elemRep === 'smi' && double) {
      const grown = this.heap.alloc(ELEM_BASE + length * 8, this.MAP_ELEMS);
      for (let i = 0; i < length; i++) {
        this.heap.writeF64(grown + ELEM_BASE + i * 8, smiValue(this.heap.readU32(ptrOffset(elems) + ELEM_BASE + i * 4)));
      }
      this.heap.setElem(off, ptr(grown));
      this.heap.setMapId(off, this.MAP_ARRAY_DBL);
      this.heap.writeF64(grown + ELEM_BASE + index * 8, this.numValue(value));
      return value;
    }
    const base = ptrOffset(elems) + ELEM_BASE;
    if (double) this.heap.writeF64(base + index * 8, this.numValue(value));
    else this.heap.writeU32(base + index * 4, value);
    return value;
  }

  // --- coercion -------------------------------------------------------------------------

  typeName(word) {
    if (isSmi(word)) return 'number';
    if (word === this.undef) return 'undefined';
    if (word === this.nullWord) return 'object';
    if (word === this.trueWord || word === this.falseWord) return 'boolean';
    if (!isPtr(word)) return 'value';
    const map = this.mapOf(word);
    if (map.kind === KIND.HEAPNUM) return 'number';
    if (map.kind === KIND.STRING) return 'string';
    if (map.kind === KIND.FUNC) return 'function';
    return 'object';
  }

  truthy(word) {
    if (isSmi(word)) return smiValue(word) !== 0;
    if (word === this.undef || word === this.nullWord || word === this.falseWord) return false;
    if (word === this.trueWord) return true;
    if (!isPtr(word)) return true;
    const map = this.mapOf(word);
    if (map.kind === KIND.HEAPNUM) return this.numValue(word) !== 0;
    if (map.kind === KIND.STRING) return this.strValue(word) !== '';
    return true;
  }

  number(word) {
    if (isSmi(word)) return smiValue(word);
    if (word === this.undef) return NaN;
    if (word === this.nullWord) return 0;
    if (word === this.trueWord) return 1;
    if (word === this.falseWord) return 0;
    if (!isPtr(word)) return NaN;
    const map = this.mapOf(word);
    if (map.kind === KIND.HEAPNUM) return this.numValue(word);
    if (map.kind === KIND.STRING) {
      const n = Number(this.strValue(word));
      return Number.isNaN(n) ? NaN : n;
    }
    return NaN;
  }

  text(word) {
    if (isSmi(word)) return String(smiValue(word));
    if (word === this.undef) return 'undefined';
    if (word === this.nullWord) return 'null';
    if (word === this.trueWord) return 'true';
    if (word === this.falseWord) return 'false';
    if (!isPtr(word)) return String(word);
    const map = this.mapOf(word);
    if (map.kind === KIND.STRING) return this.strValue(word);
    if (map.kind === KIND.HEAPNUM) return String(this.numValue(word));
    return `[${map.kind}]`;
  }

  // --- interpreter ----------------------------------------------------------------------

  fail(message) {
    const err = new Error(message);
    err.forgeError = true;
    return err;
  }

  tick() {
    if (++this.used > this.steps) throw this.fail('step limit reached');
  }

  exec(ast, env = this.globalEnv()) {
    this.used = 0;
    this.log = [];
    try {
      this.evalBlock(ast.body ?? [], env, false);
      return { ok: true, value: this.undef, log: this.log, steps: this.used };
    } catch (err) {
      if (err && err.forgeError) return { ok: false, error: err.message, log: this.log, steps: this.used };
      if (err instanceof ThrowSignal) return { ok: false, error: this.text(err.value), log: this.log, steps: this.used };
      throw err;
    }
  }

  globalEnv() {
    const env = new Env(null);
    for (const [name, word] of this.builtinWords) env.vars.set(name, word);
    return env;
  }

  evalBlock(body, env, scoped = true) {
    const scope = scoped ? new Env(env) : env;
    for (const stmt of body) if (stmt.type === 'FuncDecl') scope.vars.set(stmt.id, this.func(stmt, scope));
    for (const stmt of body) this.evalStmt(stmt, scope);
  }

  evalStmt(node, env) {
    this.tick();
    switch (node.type) {
      case 'VarDecl':
        for (const d of node.decls) env.vars.set(d.id, d.init ? this.evalExpr(d.init, env) : this.undef);
        return;
      case 'FuncDecl':
        return; // hoisted by evalBlock
      case 'Block':
        return this.evalBlock(node.body, env);
      case 'ExprStmt':
        return this.evalExpr(node.expr, env);
      case 'If':
        if (this.truthy(this.evalExpr(node.test, env))) return this.evalStmt(node.cons, env);
        if (node.alt) return this.evalStmt(node.alt, env);
        return;
      case 'While':
        while (this.truthy(this.evalExpr(node.test, env))) {
          this.tick();
          this.evalStmt(node.body, env);
        }
        return;
      case 'For': {
        const scope = new Env(env);
        if (node.init) this.evalStmt(node.init, scope);
        while (!node.test || this.truthy(this.evalExpr(node.test, scope))) {
          this.tick();
          this.evalStmt(node.body, scope);
          if (node.update) this.evalExpr(node.update, scope);
        }
        return;
      }
      case 'Return':
        throw new ReturnSignal(node.arg ? this.evalExpr(node.arg, env) : this.undef);
      case 'Throw':
        throw new ThrowSignal(this.evalExpr(node.arg, env));
      case 'Try':
        try {
          this.evalBlock(node.block.body, env);
        } catch (err) {
          if (err instanceof ReturnSignal) throw err;
          const value = err instanceof ThrowSignal ? err.value : this.str(err?.message ?? 'error');
          const scope = new Env(env);
          if (node.param) scope.vars.set(node.param, value);
          this.evalBlock(node.handler.body, scope);
        }
        return;
      default:
        throw this.fail(`unknown statement ${node.type}`);
    }
  }

  evalExpr(node, env) {
    this.tick();
    switch (node.type) {
      case 'Num':
        return this.num(node.value);
      case 'Str':
        return this.str(node.value);
      case 'Bool':
        return node.value ? this.trueWord : this.falseWord;
      case 'Null':
        return this.nullWord;
      case 'Undefined':
        return this.undef;
      case 'Ident': {
        for (let e = env; e; e = e.parent) if (e.vars.has(node.name)) return e.vars.get(node.name);
        throw this.fail(`${node.name} is not defined`);
      }
      case 'Array':
        return this.array(node.elements.map((el) => this.evalExpr(el, env)));
      case 'Object': {
        const keys = node.props.map((p) => p.key);
        const mapId = this.maps.shapeOf(KIND.OBJECT, keys);
        const off = this.allocObject(mapId, ptr(this.objectProto), Math.max(MAX_SLOTS, keys.length + 1));
        node.props.forEach((p, i) => this.heap.writeU32(off + slotOffset(i + 1), this.evalExpr(p.value, env)));
        return ptr(off);
      }
      case 'Member': {
        const base = this.evalExpr(node.object, env);
        if (node.computed) {
          const key = this.evalExpr(node.property, env);
          if (isSmi(key)) {
            if (isPtr(base) && this.mapOf(base).kind === KIND.ARRAY) return this.getIndex(base, smiValue(key));
            return this.get(base, String(smiValue(key)));
          }
          return this.get(base, this.text(key));
        }
        return this.get(base, node.property.name);
      }
      case 'Call':
        return this.call(this.evalExpr(node.callee, env), node.args.map((a) => this.evalExpr(a, env)), env);
      case 'New':
        return this.construct(this.evalExpr(node.callee, env), node.args.map((a) => this.evalExpr(a, env)), env);
      case 'Unary': {
        const v = this.evalExpr(node.arg, env);
        if (node.op === '-') return this.num(-this.number(v));
        if (node.op === '!') return this.truthy(v) ? this.falseWord : this.trueWord;
        if (node.op === 'typeof') return this.str(this.typeName(v));
        throw this.fail(`unknown unary ${node.op}`);
      }
      case 'Binary':
        return this.binary(node.op, this.evalExpr(node.left, env), this.evalExpr(node.right, env));
      case 'Logical': {
        const left = this.evalExpr(node.left, env);
        if (node.op === '&&') return this.truthy(left) ? this.evalExpr(node.right, env) : left;
        return this.truthy(left) ? left : this.evalExpr(node.right, env);
      }
      case 'Assign': {
        const value = this.evalExpr(node.value, env);
        return this.assign(node.target, node.op, value, env);
      }
      case 'Conditional':
        return this.truthy(this.evalExpr(node.test, env))
          ? this.evalExpr(node.cons, env)
          : this.evalExpr(node.alt, env);
      default:
        throw this.fail(`unknown expression ${node.type}`);
    }
  }

  assign(target, op, value, env) {
    let next = value;
    if (op !== '=') {
      const current = this.readTarget(target, env);
      next = this.binary(op[0], current, value);
    }
    if (target.type === 'Ident') {
      for (let e = env; e; e = e.parent) if (e.vars.has(target.name)) return (e.vars.set(target.name, next), next);
      env.vars.set(target.name, next);
      return next;
    }
    if (target.type === 'Member') {
      const base = this.evalExpr(target.object, env);
      if (target.computed) {
        const key = this.evalExpr(target.property, env);
        if (isSmi(key) && isPtr(base) && this.mapOf(base).kind === KIND.ARRAY) return this.setIndex(base, smiValue(key), next);
        return this.set(base, isSmi(key) ? String(smiValue(key)) : this.text(key), next);
      }
      return this.set(base, target.property.name, next);
    }
    throw this.fail('bad assignment target');
  }

  readTarget(target, env) {
    if (target.type === 'Ident') return this.evalExpr(target, env);
    return this.evalExpr(target, env);
  }

  binary(op, left, right) {
    if (op === '+') {
      if (this.typeName(left) === 'string' || this.typeName(right) === 'string') return this.str(this.text(left) + this.text(right));
      return this.num(this.number(left) + this.number(right));
    }
    if (op === '===') return this.strictEqual(left, right) ? this.trueWord : this.falseWord;
    if (op === '!==') return this.strictEqual(left, right) ? this.falseWord : this.trueWord;
    const a = this.number(left);
    const b = this.number(right);
    switch (op) {
      case '-':
        return this.num(a - b);
      case '*':
        return this.num(a * b);
      case '/':
        return this.num(a / b);
      case '%':
        return this.num(a % b);
      case '<':
        return a < b ? this.trueWord : this.falseWord;
      case '>':
        return a > b ? this.trueWord : this.falseWord;
      case '<=':
        return a <= b ? this.trueWord : this.falseWord;
      case '>=':
        return a >= b ? this.trueWord : this.falseWord;
      default:
        throw this.fail(`unknown operator ${op}`);
    }
  }

  strictEqual(left, right) {
    if (left === right) return true;
    if (isSmi(left) || isSmi(right)) return this.number(left) === this.number(right);
    if (!isPtr(left) || !isPtr(right)) return false;
    const lm = this.mapOf(left);
    const rm = this.mapOf(right);
    if (lm.kind === KIND.STRING && rm.kind === KIND.STRING) return this.strValue(left) === this.strValue(right);
    if (lm.kind === KIND.HEAPNUM && rm.kind === KIND.HEAPNUM) return this.numValue(left) === this.numValue(right);
    return false;
  }

  call(callee, args, env) {
    if (!isPtr(callee)) throw this.fail('value is not callable');
    const map = this.mapOf(callee);
    if (map.kind === KIND.FUNC) {
      const fnId = smiValue(this.heap.readU32(ptrOffset(callee) + slotOffset(1)));
      const entry = this.fns[fnId];
      if (!entry) throw this.fail('calling a function that is not there');
      if (entry.builtin) return entry.builtin(args, this);
      const scope = new Env(entry.env);
      entry.node.params.forEach((p, i) => scope.vars.set(p, args[i] ?? this.undef));
      try {
        this.evalBlock(entry.node.body.body, scope, false);
      } catch (signal) {
        if (signal instanceof ReturnSignal) return signal.value;
        throw signal;
      }
      return this.undef;
    }
    if (map.kind === KIND.SINGLETON) {
      const name = this.strValue(this.heap.readU32(ptrOffset(callee) + slotOffset(1)));
      const builtin = this.builtins.get(name);
      if (builtin) return builtin(args, this);
    }
    throw this.fail(`${this.typeName(callee)} is not callable`);
  }

  construct(callee, args, env) {
    const result = this.call(callee, args, env);
    if (isPtr(result)) return result;
    const off = this.allocObject(this.MAP_OBJECT, ptr(this.objectProto));
    return ptr(off);
  }

  installBuiltins() {
    this.defineBuiltin('print', (args, vm) => {
      vm.log.push(args.map((a) => vm.text(a)).join(' '));
      return vm.undef;
    });
    this.defineBuiltin('Number', (args, vm) => vm.num(vm.number(args[0] ?? vm.undef)));
    this.defineBuiltin('String', (args, vm) => vm.str(vm.text(args[0] ?? vm.undef)));
    const math = this.allocObject(this.MAP_OBJECT, ptr(this.objectProto), 4);
    this.heap.writeU32(math + slotOffset(1), this.nativeFn((args, vm) => vm.num(Math.floor(vm.number(args[0] ?? vm.undef)))));
    this.heap.writeU32(math + slotOffset(2), this.nativeFn((args, vm) => vm.num(Math.abs(vm.number(args[0] ?? vm.undef)))));
    this.heap.writeU32(math + slotOffset(3), this.nativeFn((args, vm) => vm.num(Math.max(...args.map((a) => vm.number(a))))));
    const mathId = this.maps.define({ kind: KIND.OBJECT, props: [{ key: 'floor' }, { key: 'abs' }, { key: 'max' }] });
    this.heap.setMapId(math, mathId);
    this.defineBuiltin('Math', () => ptr(math));
  }

  /** A builtin bound to a fixed name, so the global environment can hand it out by word. */
  defineBuiltin(name, fn) {
    const word = this.nativeFn(fn);
    this.builtinWords.set(name, word);
    return word;
  }

  /** An anonymous host function usable as a property value. */
  nativeFn(fn) {
    const id = this.fns.length;
    this.fns.push({ builtin: fn });
    const off = this.heap.alloc(HEADER + 2 * 4, this.MAP_FUNC);
    this.heap.writeU32(off + slotOffset(PROTO_SLOT), ptr(this.functionProto));
    this.heap.writeU32(off + slotOffset(1), smi(id));
    return ptr(off);
  }
}

class Env {
  constructor(parent) {
    this.vars = new Map();
    this.parent = parent;
  }
}
