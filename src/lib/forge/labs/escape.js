// Lab C: the escape. open() hands out a view on handle 1. Handle 3 is never handed out by any
// builtin. The guest allocates the view itself, so allocation order decides what the length
// primitive can reach — then the view's index slot names a different handle.
//
// Checked from host state: the handle that was read, never the guest's source.

export const ESCAPE_LAB = {
  id: 'escape',
  title: 'The handle you never had',
  brief: [
    'read(v) follows the handle index stored in v\'s first slot. open() gives you a view on handle 1, which reads /bin/sh.',
    'Handles 0 and 3 are never handed out. Make a view, then use the array length primitive to point it somewhere else.',
    'Order matters: allocate the view after the array, and the walk forward reaches it. The panel shows both offsets.',
    'Goal: have read(v) return the secret, handle 3.',
  ].join('\n'),
  language: 'js',
  seed: '// open() gives you a view on handle 1. Make it name another handle.\nvar xs = [1, 2, 3, 4];\nvar v = open();\nprint(read(v));\n',
  hints: [
    'The view keeps its handle index in a slot that is ordinary cage memory.',
    'Allocate the view after the array: the forward walk from the elements block reaches it.',
    'Index 15 points at that slot. xs.length = 512; xs[15] = 3; then read(v).',
  ],


  start() {},

  fix: {
    title: 'Keep the capability out of the cage',
    note: 'A handle index in memory the guest can write is a suggestion, not a capability. Record what each view was created with, in the host, and check it on every read.',
    code: `host.bindView(off, handle);              // when the view is made
if (!host.mayRead(off, index)) return;   // on every read`,
  },

  check(forge) {
    return forge.host.reads.includes(3)
      ? { solved: true, why: 'a view named handle 3 and read it' }
      : { solved: false, why: 'handle 3 was never read' };
  },
};
