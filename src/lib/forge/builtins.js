// Guest-visible builtins that touch the host. Keys here are host-built strings from the
// parser or from map metadata; guest text is only ever compared, never used to index a host
// object.
//
// BUG-2 lives in mergeInto: it copies every own key of `source` without skipping __proto__,
// and it merges into whatever `target[key]` already resolves to. That combination is the
// real-world pollution-to-gadget path: target.__proto__ is Object.prototype, so the payload
// is written onto the shared prototype, and exec() then reads opts.shell off the chain.

import { isPtr, ptr, ptrOffset, smiValue } from './values.js';
import { KIND, slotOffset } from './maps.js';

export function installHostBuiltins(vm, host) {
  vm.defineBuiltin('merge', (args) => {
    const target = args[0];
    const source = args[1];
    if (!isPtr(target) || !isPtr(source)) return target ?? vm.undef;
    mergeInto(vm, target, source, 0);
    return target;
  });

  vm.defineBuiltin('exec', (args) => {
    const opts = isPtr(args[0]) ? args[0] : ptr(vm.allocObject(vm.MAP_OBJECT, ptr(vm.objectProto)));
    const shell = vm.get(opts, 'shell'); // walks the prototype chain: the gadget reads this
    if (vm.truthy(shell)) return vm.allocView(host.openNative());
    vm.log.push('exec: refused, no shell option');
    return vm.undef;
  });

  // A view on handle 1 and nothing more. The escape lab's whole job is to make it name 3.
  vm.defineBuiltin('open', () => vm.allocView(1));

  vm.defineBuiltin('read', (args) => {
    const view = args[0];
    if (!isPtr(view)) return vm.undef;
    const off = ptrOffset(view);
    if (vm.maps.get(vm.heap.mapIdAt(off))?.kind !== KIND.VIEW) return vm.undef;
    const index = smiValue(vm.heap.readU32(off + slotOffset(1)));
    if (vm.defend && !host.mayRead(off, index)) {
      // FIX-3: the slot is only a hint. What the view may name was recorded when it was made.
      vm.log.push('read: refused, this view never held that capability');
      return vm.undef;
    }
    const value = host.read(index);
    return value == null ? vm.undef : vm.str(value);
  });
}

const DANGEROUS = new Set(['__proto__', 'constructor', 'prototype']);

function mergeInto(vm, target, source, depth) {
  if (depth > 8) return;
  const map = vm.maps.get(vm.heap.mapIdAt(ptrOffset(source)));
  if (!map) return;
  for (const prop of map.props) {
    const key = prop.key;
    // FIX-2: no key that can change a prototype, and never recurse into an inherited value.
    if (vm.defend && DANGEROUS.has(key)) continue;
    const sourceValue = vm.get(source, key);
    if (isPtr(sourceValue) && vm.mapOf(sourceValue)?.kind === KIND.OBJECT) {
      const targetValue = vm.get(target, key);
      const owned = !vm.defend || vm.maps.indexOf(vm.heap.mapIdAt(ptrOffset(target)), key) >= 0;
      if (owned && isPtr(targetValue) && vm.mapOf(targetValue)?.kind === KIND.OBJECT) {
        mergeInto(vm, targetValue, sourceValue, depth + 1); // BUG-2: __proto__ gets here
      } else {
        vm.set(target, key, sourceValue);
      }
    } else {
      vm.set(target, key, sourceValue);
    }
  }
}
