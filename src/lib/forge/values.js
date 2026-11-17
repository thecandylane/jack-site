// Tagged words for the Forge VM. Every runtime value is a u32:
//   low bit 0 -> Smi:      value >>> 1, 31-bit signed, lives inline
//   low bit 1 -> pointer:  offset into the cage (never an absolute address)
// Nothing here touches memory; heap.js does. The tag scheme is the contract every other
// module codes against, so it does not change without editing docs/forge-plan.md first.

export const SMI_MIN = -(2 ** 30);
export const SMI_MAX = 2 ** 30 - 1;
export const CAGE_LIMIT = 0x80000000;

/** Encode a small integer. Throws on non-integers and overflow, never silently truncates. */
export function smi(n) {
  if (!Number.isInteger(n)) throw new TypeError(`smi() needs an integer, got ${n}`);
  if (n < SMI_MIN || n > SMI_MAX) throw new RangeError(`Smi overflow: ${n}`);
  return (n << 1) >>> 0;
}

export const isSmi = (w) => (w & 1) === 0;

export function smiValue(w) {
  const v = w >>> 1;
  return v >= 0x40000000 ? v - 0x80000000 : v;
}

/** Encode a cage offset. Pointers are 8-byte aligned so the low bit is free for the tag. */
export function ptr(offset) {
  if (offset === 0 || offset >= CAGE_LIMIT) throw new RangeError(`pointer outside the cage: ${offset}`);
  if ((offset & 7) !== 0) throw new RangeError(`unaligned pointer: ${offset}`);
  return (offset | 1) >>> 0;
}

export const isPtr = (w) => (w & 1) === 1;
export const ptrOffset = (w) => (w & ~1) >>> 0;

/** Human-readable tag, for the heap inspector and test failures. */
export function describe(w) {
  if (typeof w !== 'number' || !Number.isInteger(w) || w < 0 || w > 0xffffffff) return `not-a-word(${w})`;
  return isSmi(w) ? `Smi(${smiValue(w)})` : `ptr(0x${ptrOffset(w).toString(16)})`;
}
