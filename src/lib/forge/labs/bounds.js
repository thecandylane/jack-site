// Lab B: the length primitive. The array is seeded into the global environment, then a canary
// object is allocated immediately after it, so an index past the elements block lands on the
// canary's property slot. The guest reads offsets from the heap panel, not from this file.
//
// Checked from heap state: the canary's own slot, never the guest's source.

import { ptr, smiValue } from '../values.js';
import { KIND, slotOffset } from '../maps.js';

export const BOUNDS_LAB = {
  id: 'bounds',
  title: 'Out of bounds',
  brief: [
    'xs is four numbers. Its length slot and its elements block are separate: writing xs.length moves the slot and leaves the block the size it was.',
    'Then an index past the block writes whatever lives next. The panel lists blocks in address order:',
    'an element i sits at elements + 16 + i*4, and a declared property sits at object + 16 + slot*4, where slot 1 is the first property.',
    'Goal: make the canary object\'s touched property read 1.',
  ].join('\n'),

  start(forge) {
    const vm = forge.vm;
    const xs = vm.array([vm.num(1), vm.num(2), vm.num(3), vm.num(4)]);
    vm.bindGlobal('xs', xs);
    const canary = vm.allocObject(forge.maps.shapeOf(KIND.OBJECT, ['touched']), ptr(vm.objectProto));
    vm.heap.writeU32(canary + slotOffset(1), vm.num(0));
    forge.canary = ptr(canary);
  },

  check(forge) {
    const value = smiValue(forge.vm.get(forge.canary, 'touched'));
    return value === 1
      ? { solved: true, why: 'the canary read back the value you wrote past the block' }
      : { solved: false, why: `the canary still reads ${value}` };
  },
};
