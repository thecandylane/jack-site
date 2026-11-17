import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decode, disassemble, parseHex, wordsFromBytes, SAMPLES } from './riscv.js';

// Every word here was assembled by llvm-mc (-triple=riscv32 -mattr=+m -M no-aliases) from the text beside it, and
// the opcode, funct3 and funct7 values were read against riscv/riscv-opcodes' rv_i and rv_m tables, the source
// of the unprivileged spec's encoding tables. Branch and jump operands are target addresses: addr + offset.
const at = (addr, word) => decode(word, addr);
const cases = [
  // R
  [0x00c58533, 'add a0, a1, a2', 'R'], [0x40c58533, 'sub a0, a1, a2', 'R'], [0x41eede33, 'sra t3, t4, t5', 'R'],
  [0x00b03533, 'sltu a0, zero, a1', 'R'], [0x02c58533, 'mul a0, a1, a2', 'R'], [0x02c5c533, 'div a0, a1, a2', 'R'],
  [0x02c5f533, 'remu a0, a1, a2', 'R'],
  // I: arithmetic, with negative immediates
  [0x00a00513, 'addi a0, zero, 10', 'I'], [0xfff50513, 'addi a0, a0, -1', 'I'], [0xff010113, 'addi sp, sp, -16', 'I'],
  [0xfff54513, 'xori a0, a0, -1', 'I'], [0x00153513, 'sltiu a0, a0, 1', 'I'], [0x0ff57513, 'andi a0, a0, 255', 'I'],
  [0x800fed93, 'ori s11, t6, -2048', 'I'],
  // I: shifts
  [0x01f51513, 'slli a0, a0, 31', 'I'], [0x0015d593, 'srli a1, a1, 1', 'I'], [0x40465613, 'srai a2, a2, 4', 'I'],
  // I: loads and jalr
  [0x00c12083, 'lw ra, 12(sp)', 'I'], [0xffc42503, 'lw a0, -4(s0)', 'I'], [0x0005c283, 'lbu t0, 0(a1)', 'I'],
  [0x00008067, 'jalr zero, 0(ra)', 'I'], [0xff4300e7, 'jalr ra, -12(t1)', 'I'],
  // S: the immediate is split across bits 31:25 and 11:7
  [0x00112623, 'sw ra, 12(sp)', 'S'], [0xfe650fa3, 'sb t1, -1(a0)', 'S'], [0x7ec11fa3, 'sh a2, 2047(sp)', 'S'],
  [0x80d1a023, 'sw a3, -2048(gp)', 'S'],
  // U
  [0x123452b7, 'lui t0, 0x12345', 'U'], [0xfffff537, 'lui a0, 0xfffff', 'U'], [0x00002197, 'auipc gp, 0x2', 'U'],
  // I: system and fence
  [0x00000073, 'ecall', 'I'], [0x00100073, 'ebreak', 'I'], [0x0ff0000f, 'fence iorw, iorw', 'I'], [0x0210000f, 'fence r, w', 'I'],
];
for (const [word, asm, format] of cases) {
  test(`0x${word.toString(16).padStart(8, '0')} = ${asm}`, () => assert.deepEqual(decode(word), { asm, format }));
}

test('branch targets: forward, backward, imm[11] and both ends of the range', () => {
  assert.equal(at(0x100, 0x00b50463).asm, 'beq a0, a1, 0x108');       // +8
  assert.equal(at(0x100, 0xfeb50ee3).asm, 'beq a0, a1, 0xfc');        // -4
  assert.equal(at(0x14, 0xfe629ce3).asm, 'bne t0, t1, 0xc');          // -8
  assert.equal(at(0, 0x00b510e3).asm, 'bne a0, a1, 0x800');           // +2048: only word bit 7 (imm[11]) is set
  assert.equal(at(0, 0x7f397fe3).asm, 'bgeu s2, s3, 0xffe');          // +4094, the largest
  assert.equal(at(0x1000, 0x80054063).asm, 'blt a0, zero, 0x0');      // -4096, the smallest
  assert.equal(at(0x100, 0x00b50463).format, 'B');
});
test('jump targets: forward, backward, imm[11] and both ends of the range', () => {
  assert.deepEqual(at(0x100, 0x008000ef), { asm: 'jal ra, 0x108', format: 'J' });
  assert.equal(at(0x100, 0xff9ff06f).asm, 'jal zero, 0xf8');          // -8
  assert.equal(at(0, 0x001000ef).asm, 'jal ra, 0x800');               // +2048: only word bit 20 (imm[11]) is set
  assert.equal(at(0, 0x7ffff0ef).asm, 'jal ra, 0xffffe');             // +1048574
  assert.equal(at(0x100000, 0x800000ef).asm, 'jal ra, 0x0');          // -1048576
  assert.equal(at(0, 0xff9ff06f).asm, 'jal zero, 0xfffffff8');        // a target below 0 wraps to 32 bits
});
test('words outside RV32I and RV32M print as .word', () => {
  for (const w of [0x00000000, 0xffffffff, 0x00004501 /* compressed */, 0x30200073 /* mret */, 0x00002573 /* csrrs */,
    0x40c59533 /* sll with sub's funct7 */, 0x02051513 /* slli by 32 */, 0x00003003 /* ld */, 0x00003023 /* sd */, 0x00001067 /* jalr, funct3 1 */]) {
    assert.deepEqual(decode(w), { asm: `.word 0x${w.toString(16).padStart(8, '0')}`, format: '' });
  }
});
test('disassemble numbers the rows from the base address', () => {
  const rows = disassemble(parseHex(SAMPLES['sum 1..10 (a loop)']), 0x1000);
  assert.deepEqual(rows[5], { addr: 0x1014, word: 0xfe629ce3, asm: 'bne t0, t1, 0x100c', format: 'B' });
  assert.equal(rows.length, 7);
});
test('the samples decode in full and cover all six formats', () => {
  for (const s of Object.values(SAMPLES)) assert.ok(disassemble(parseHex(s)).every((r) => r.format), s);
  assert.equal(disassemble(parseHex(SAMPLES['one of each format'])).map((r) => r.format).join(''), 'RISBUJ');
});
test('the 2023 test file decodes to what its bytes say', () => {
  assert.deepEqual(disassemble(parseHex(SAMPLES['test_instructions.bin (2023)'])).map((r) => r.asm),
    ['addi zero, zero, 0', 'addi ra, zero, 1', 'add ra, zero, sp', 'sub ra, zero, zero', 'jalr zero, 0(ra)', 'jal zero, 0x14']);
});
test('parseHex takes 0x or bare words, any whitespace, and refuses the rest', () => {
  assert.deepEqual(parseHex(' 0x00a00513\n\tFFF50513, 13 '), [0x00a00513, 0xfff50513, 0x13]);
  assert.deepEqual(parseHex(''), []);
  assert.throws(() => parseHex('00a00513 addi'), /isn't a 32-bit hex word/);
  assert.throws(() => parseHex('123456789'), /isn't a 32-bit hex word/);
});
test('a .bin file is read least significant byte first', () => {
  assert.deepEqual(wordsFromBytes(new Uint8Array([0x13, 0x05, 0xa0, 0x00, 0x67, 0x80, 0x00, 0x00, 0xff])), { words: [0x00a00513, 0x00008067], extra: 1 });
});
