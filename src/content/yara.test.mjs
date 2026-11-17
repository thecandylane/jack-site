import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import init, { Compiler } from '@virustotal/yara-x';
import { RULES, SAMPLES } from './yara.js';

// Loads the same WASM build the browser uses, compiles the starter rules, and checks what each sample trips.
const wasm = readFileSync(new URL('../../node_modules/@virustotal/yara-x/pkg/yara_x_js_bg.wasm', import.meta.url));
await init({ module_or_path: wasm });
const compiler = new Compiler();
compiler.addSource(RULES);
const errors = compiler.errors; // read before build(), which consumes the compiler
const rules = compiler.build();
const hits = (text) => rules.scan(new TextEncoder().encode(text)).matches.map((m) => m.identifier).sort();

test('the starter rules compile cleanly', () => assert.deepEqual(errors, []));
test('the infected package.json trips the hook and git-dependency rules', () =>
  assert.deepEqual(hits(SAMPLES['package.json (infected shape)']), ['git_dependency_pinned_to_a_commit', 'npm_hook_starts_a_loader']));
test('the Claude Code hook trips the autorun rule', () => assert.deepEqual(hits(SAMPLES['.claude/settings.json']), ['agent_or_editor_autorun']));
test('the VS Code folder-open task trips the autorun rule', () => assert.deepEqual(hits(SAMPLES['.vscode/tasks.json']), ['agent_or_editor_autorun']));
test('the clean package.json trips nothing', () => assert.deepEqual(hits(SAMPLES['package.json (clean)']), []));
