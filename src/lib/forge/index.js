// The Forge's public surface. Everything a page or a lab touches goes through this file, so
// the memory model can change without breaking the terminal, the editor or the checkers.

import { Heap } from './heap.js';
import { Maps } from './maps.js';
import { Interpreter } from './interp.js';
import { Host } from './host.js';
import { installHostBuiltins } from './builtins.js';
import { POLLUTION_LAB } from './labs/pollution.js';
import { BOUNDS_LAB } from './labs/bounds.js';
import { ESCAPE_LAB } from './labs/escape.js';
import { isSmi, isPtr, smiValue, ptrOffset } from './values.js';

export const LABS = [POLLUTION_LAB, BOUNDS_LAB, ESCAPE_LAB];
export const labById = (id) => LABS.find((lab) => lab.id === id) ?? null;

/**
 * @param {object} options
 * @param {number} [options.heapBytes] cage size, 1 MiB by default
 * @param {(src: string) => object} options.parse  the parser; required only for run(src)
 * @param {number} [options.steps] instruction ceiling for one run
 * @param {string} [options.flag] the host's flag value
 * @param {string|object} [options.lab] a lab id, or the lab itself; its start() seeds the cage
 */
export function createForge({ heapBytes = 1 << 20, parse = null, steps, flag, lab = null } = {}) {
  const heap = new Heap(heapBytes);
  const maps = new Maps();
  const vm = new Interpreter(heap, maps, steps ? { steps } : {});
  const host = new Host(flag);
  installHostBuiltins(vm, host);

  const api = {
    heap,
    maps,
    vm,
    host,

    /** Run an AST the caller already has. Tests and labs use this; the parser is not needed. */
    exec(ast) {
      return vm.exec(ast);
    },

    /** Compile and run source. The parser is injected so this module never imports one. */
    run(src) {
      if (typeof parse !== 'function') throw new Error('run(src) needs a parser: createForge({ parse })');
      return vm.exec(parse(String(src)));
    },

    snapshot() {
      return heap.snapshot();
    },

    /** Tag and map information for one word, for the heap inspector. */
    inspect(word) {
      if (isSmi(word)) return { tag: 'smi', value: smiValue(word) };
      if (!isPtr(word)) return { tag: 'invalid' };
      const offset = ptrOffset(word);
      if (offset + 16 > heap.bytes || offset >= heap.top) return { tag: 'ptr', offset, kind: 'outside' };
      const mapId = heap.mapIdAt(offset);
      const map = maps.get(mapId);
      return { tag: 'ptr', offset, mapId, kind: map ? map.kind : 'freed', size: heap.sizeAt(offset) };
    },

    /** Every live block, for the inspector's list. */
    objects() {
      return heap.objects();
    },

    /** Bytes the allocator has handed out, for the cage bar. */
    used() {
      return heap.top;
    },

    labs() {
      return LABS;
    },
  };

  const selected = typeof lab === 'string' ? labById(lab) : lab;
  if (selected) selected.start(api);
  return api;
}
