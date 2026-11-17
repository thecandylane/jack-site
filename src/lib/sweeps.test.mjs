import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sweeps } from './sweeps.js';

// A 90px log (half-width 45) that catches characters within half a cell (9px) of its line.
test('a still log catches a character falling onto it', () => assert.equal(sweeps(0, -5, 0, 3, 45, 9), true));
test('a character still above the log is not caught', () => assert.equal(sweeps(0, -40, 0, -30, 45, 9), false));
test('a fast swipe catches a character it passes through', () => assert.equal(sweeps(300, 0, -300, 0, 45, 9), true));
test('a swipe that passes below a character misses it', () => assert.equal(sweeps(300, 30, -300, 30, 45, 9), false));
test('a log jerked upward catches what it passes', () => assert.equal(sweeps(0, 200, 0, -200, 45, 9), true));
test("a character outside the log's width is not caught", () => assert.equal(sweeps(100, -5, 100, 3, 45, 9), false));
