// Lab A: pollution to a gadget. The bug is real inside the VM — merge writes onto the shared
// prototype — and the blast radius is simulated, because exec() only opens a handle.
//
// The checker reads host state, never the guest's source: a hard-coded flag string in the
// editor proves nothing.

export const POLLUTION_LAB = {
  id: 'pollution',
  title: 'Pollution to a gadget',
  brief: [
    'merge(target, source) copies every own key of source into target, recursing where both',
    'sides are objects. exec(opts) runs the native path only when opts.shell is truthy, and it',
    'sees shell wherever a lookup finds it — including the prototype chain.',
    'Nothing on this host is real. Handle 0 is the flag; exec() never hands it out.',
  ].join('\n'),

  start() {},

  check(forge) {
    const { host } = forge;
    if (!host.opened) return { solved: false, why: 'the native exec path never ran' };
    if (!host.reads.includes(0)) return { solved: false, why: 'exec ran, but handle 0 was never read' };
    return {
      solved: true,
      why: 'merge walked into Object.prototype, exec read opts.shell off the chain, read() returned handle 0',
    };
  },
};
