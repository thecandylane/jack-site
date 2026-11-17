// An RV32I disassembler: 32-bit words in, assembly text out. A JavaScript port of the owner's 2023 C++ program
// (github.com/thecandylane/RISC-V_Disassembler), finished: all six formats, sign-extended immediates, ABI register
// names, branch and jump targets as addresses, plus the eight RV32M multiply/divide instructions the original
// started on. No aliases (addi a0, zero, 10 stays that way, it never becomes li), no compressed instructions and
// no CSRs: anything else prints as .word. Encodings follow the opcode tables in riscv/riscv-opcodes (rv_i, rv_m).

export const REG = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'];

const hex = (n, pad = 0) => '0x' + (n >>> 0).toString(16).padStart(pad, '0');

// The immediates. `>>` on a 32-bit value copies the sign bit down, which is the whole of sign extension:
// bit 31 of the word is always the immediate's sign, so shifting it into place first does the job.
export const immI = (w) => w >> 20;
export const immS = (w) => ((w >> 25) << 5) | ((w >>> 7) & 0x1f);
export const immB = (w) => ((w >> 31) << 12) | (((w >>> 7) & 1) << 11) | (((w >>> 25) & 0x3f) << 5) | (((w >>> 8) & 0xf) << 1);
export const immJ = (w) => ((w >> 31) << 20) | (((w >>> 12) & 0xff) << 12) | (((w >>> 20) & 1) << 11) | (((w >>> 21) & 0x3ff) << 1);

// Indexed by funct3; R-type by funct7 first.
const R = {
  0x00: ['add', 'sll', 'slt', 'sltu', 'xor', 'srl', 'or', 'and'],
  0x20: ['sub', , , , , 'sra'],
  0x01: ['mul', 'mulh', 'mulhsu', 'mulhu', 'div', 'divu', 'rem', 'remu'],
};
const OPIMM = ['addi', , 'slti', 'sltiu', 'xori', , 'ori', 'andi'];
const LOAD = ['lb', 'lh', 'lw', , 'lbu', 'lhu'];
const STORE = ['sb', 'sh', 'sw'];
const BRANCH = ['beq', 'bne', , , 'blt', 'bge', 'bltu', 'bgeu'];
const fenceSet = (bits) => ['i', 'o', 'r', 'w'].filter((_, i) => bits & (8 >> i)).join('') || '0';

// One word at one address -> { asm, format }. format is R, I, S, B, U or J, or '' for a word that isn't RV32I/M.
export function decode(word, addr = 0) {
  const w = word | 0;
  const f3 = (w >>> 12) & 7, f7 = w >>> 25;
  const rd = REG[(w >>> 7) & 31], rs1 = REG[(w >>> 15) & 31], rs2 = REG[(w >>> 20) & 31];
  const out = (format, name, ...ops) => (name ? { asm: ops.length ? `${name} ${ops.join(', ')}` : name, format } : null);
  let r = null;
  switch (w & 0x7f) {
    case 0x33: r = out('R', R[f7]?.[f3], rd, rs1, rs2); break;
    case 0x13:
      if (f3 === 1) r = out('I', f7 === 0 && 'slli', rd, rs1, (w >>> 20) & 31);
      else if (f3 === 5) r = out('I', f7 === 0 ? 'srli' : f7 === 0x20 && 'srai', rd, rs1, (w >>> 20) & 31);
      else r = out('I', OPIMM[f3], rd, rs1, immI(w));
      break;
    case 0x03: r = out('I', LOAD[f3], rd, `${immI(w)}(${rs1})`); break;
    case 0x67: r = out('I', f3 === 0 && 'jalr', rd, `${immI(w)}(${rs1})`); break;
    case 0x23: r = out('S', STORE[f3], rs2, `${immS(w)}(${rs1})`); break;
    case 0x63: r = out('B', BRANCH[f3], rs1, rs2, hex(addr + immB(w))); break;
    case 0x37: r = out('U', 'lui', rd, hex(w >>> 12)); break;
    case 0x17: r = out('U', 'auipc', rd, hex(w >>> 12)); break;
    case 0x6f: r = out('J', 'jal', rd, hex(addr + immJ(w))); break;
    // fence: only the plain form, with rd, rs1 and the fm field all zero.
    case 0x0f: r = out('I', (w & 0xf00fff80) === 0 && 'fence', fenceSet((w >>> 24) & 15), fenceSet((w >>> 20) & 15)); break;
    case 0x73: r = out('I', w === 0x73 ? 'ecall' : w === 0x00100073 && 'ebreak'); break;
  }
  return r ?? { asm: `.word ${hex(w, 8)}`, format: '' };
}

// Words -> rows of { addr, word, asm, format }, four bytes apart from `base`.
export function disassemble(words, base = 0) {
  return Array.from(words, (word, i) => {
    const addr = (base + i * 4) >>> 0;
    return { addr, word: word >>> 0, ...decode(word, addr) };
  });
}

// Hex text -> words. Each token is one word as you'd read it (most significant digit first), with or without 0x,
// split on whitespace or commas.
export function parseHex(text) {
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  const bad = tokens.find((t) => !/^(0x)?[0-9a-f]{1,8}$/i.test(t));
  if (bad) throw new Error(`"${bad.slice(0, 24)}" isn't a 32-bit hex word.`);
  return tokens.map((t) => parseInt(t, 16) >>> 0);
}

// Bytes of a .bin file -> words. RISC-V stores the least significant byte first. Bytes left over after the last
// whole word are dropped; `extra` says how many.
export function wordsFromBytes(bytes) {
  const n = bytes.length >> 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, n * 4);
  return { words: Array.from({ length: n }, (_, i) => view.getUint32(i * 4, true)), extra: bytes.length - n * 4 };
}

// Three samples for the tool, and the six words in the original repo's test_instructions.bin.
export const SAMPLES = {
  'sum 1..10 (a loop)': `00000513
00100293
00b00313
00550533
00128293
fe629ce3
00008067`,
  'function prologue and epilogue': `ff010113
00112623
00812423
01010413
00a00513
00c12083
00812403
01010113
00008067`,
  'one of each format': `00c58533
00a00513
00a12623
00b50463
123452b7
008000ef`,
  'test_instructions.bin (2023)': `00000013
00100093
002000b3
400000b3
00008067
0000006f`,
};
