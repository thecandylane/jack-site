// The simulated outside. No shell, no file system, no network: a table of values the guest can
// only reach through a view object, and a log of every crossing. The table is the model's
// sandbox boundary — handle 0 is the flag and is never handed out by exec().

export const DEFAULT_FLAG = 'FORGE{cage_is_not_a_sandbox}';

export class Host {
  constructor(flag = DEFAULT_FLAG) {
    this.handles = [
      { id: 0, kind: 'flag', value: flag },
      { id: 1, kind: 'exec', value: '/bin/sh' },
      { id: 2, kind: 'file', value: 'binding-circle' },
      { id: 3, kind: 'secret', value: 'native:0x7f3a2c10' },
    ];
    this.opened = 0; // times the native exec path was taken
    this.reads = []; // handle ids the guest read, in order
  }

  /** The native path. Its caller gets a view on the flag handle. */
  openNative() {
    this.opened += 1;
    return 0;
  }

  /** Returns a handle's value, or null when the index names nothing. */
  read(index) {
    const handle = this.handles[index];
    if (!handle) return null;
    this.reads.push(handle.id);
    return handle.value;
  }
}
