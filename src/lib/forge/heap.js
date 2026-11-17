// The cage: one Uint8Array that every guest object lives in. Offsets are the only addresses
// the guest ever holds, so there is no host memory to reach from inside — that boundary is
// what lane 2's third lab escapes, and what lane 3 shows a real engine widening.
//
// Layout is fixed by docs/forge-plan.md §3:
//   +0  mapId   u32
//   +4  size    u32   bytes including this header
//   +8  mark    u32   GC mark
//   +12 elem    u32   pointer word to an elements block, or 0
// Slots are 4 bytes. Doubles never sit inline: a double property points at an 8-byte
// HeapNumber, which is what makes the migration bug in lab B physically possible.

export const HEADER = 16;
export const SLOT = 4;
export const HEAP_START = 0x1000;
export const FREED = 0xffffffff;
export const MAP_OFF = 0;
export const SIZE_OFF = 4;
export const MARK_OFF = 8;
export const ELEM_OFF = 12;

const align8 = (n) => (n + 7) & ~7;

export class Heap {
  constructor(bytes = 1 << 20) {
    this.bytes = bytes;
    this.buf = new Uint8Array(bytes);
    this.dv = new DataView(this.buf.buffer);
    this.top = HEAP_START;
  }

  /** Bump-allocate a zeroed block. Non-moving, so a stale offset stays readable after a sweep. */
  alloc(size, mapId = 0) {
    const want = align8(size);
    if (want < HEADER) throw new RangeError(`block of ${size} bytes is smaller than the header`);
    if (this.top + want > this.bytes) throw new RangeError(`heap exhausted at 0x${this.top.toString(16)}`);
    const offset = this.top;
    this.top += want;
    this.buf.fill(0, offset, offset + want);
    this.dv.setUint32(offset + MAP_OFF, mapId, true);
    this.dv.setUint32(offset + SIZE_OFF, want, true);
    return offset;
  }

  mapIdAt(offset) {
    return this.dv.getUint32(offset + MAP_OFF, true);
  }

  setMapId(offset, mapId) {
    this.dv.setUint32(offset + MAP_OFF, mapId, true);
  }

  sizeAt(offset) {
    return this.dv.getUint32(offset + SIZE_OFF, true);
  }

  markAt(offset) {
    return this.dv.getUint32(offset + MARK_OFF, true);
  }

  setMark(offset, value) {
    this.dv.setUint32(offset + MARK_OFF, value, true);
  }

  elemAt(offset) {
    return this.dv.getUint32(offset + ELEM_OFF, true);
  }

  setElem(offset, word) {
    this.dv.setUint32(offset + ELEM_OFF, word, true);
  }

  /** A block counts as live until a sweep stamps it. Stale offsets still read freed bytes. */
  alive(offset) {
    return offset >= HEAP_START && offset + HEADER <= this.top && this.mapIdAt(offset) !== FREED;
  }

  readU32(offset) {
    if (offset < 0 || offset + 4 > this.bytes) throw new RangeError(`read outside the cage: 0x${offset.toString(16)}`);
    return this.dv.getUint32(offset, true);
  }

  writeU32(offset, value) {
    if (offset < 0 || offset + 4 > this.bytes) throw new RangeError(`write outside the cage: 0x${offset.toString(16)}`);
    this.dv.setUint32(offset, value >>> 0, true);
  }

  readF64(offset) {
    if (offset < 0 || offset + 8 > this.bytes) throw new RangeError(`read outside the cage: 0x${offset.toString(16)}`);
    return this.dv.getFloat64(offset, true);
  }

  writeF64(offset, value) {
    if (offset < 0 || offset + 8 > this.bytes) throw new RangeError(`write outside the cage: 0x${offset.toString(16)}`);
    this.dv.setFloat64(offset, value, true);
  }

  /** Every block the allocator handed out, in address order. Freed blocks are skipped by size. */
  objects() {
    const out = [];
    let offset = HEAP_START;
    while (offset + HEADER <= this.top) {
      const size = this.sizeAt(offset);
      if (size < HEADER) break;
      const mapId = this.mapIdAt(offset);
      if (mapId !== FREED) out.push({ offset, mapId, size, mark: this.markAt(offset) });
      offset += size;
    }
    return out;
  }

  /** Mark-sweep without moving: unreachable blocks are stamped FREED, bytes stay readable. */
  sweep(live) {
    let freed = 0;
    for (const o of this.objects()) {
      if (live.has(o.offset)) this.setMark(o.offset, 1);
      else {
        this.setMark(o.offset, 0);
        this.setMapId(o.offset, FREED);
        freed++;
      }
    }
    return freed;
  }

  snapshot() {
    return this.buf.slice(0, this.top);
  }
}
