import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, SAMPLES } from './agentcheck.js';

const levels = (t) => check(t).findings.map((f) => f.level);
const has = (t, re) => check(t).findings.some((f) => re.test(f.text));

test('a SessionStart hook is a red flag', () => assert.equal(levels(SAMPLES['.claude/settings.json (hook)'])[0], 'high'));
test('MCP servers are listed, unpinned packages and remote hosts warned', () => {
  const t = SAMPLES['.mcp.json'];
  assert.ok(has(t, /starts a local program: npx -y some-docs-mcp/) && has(t, /no pinned version/) && has(t, /remote: mcp\.example\.net/));
});
test('a pinned MCP package is not warned as unpinned', () => assert.ok(!has('{"mcpServers":{"a":{"command":"npx","args":["pkg@1.2.3"]}}}', /no pinned version/)));
test('the suspicious AGENTS.md trips pipe-to-shell, secrecy, the comment and the key path', () => {
  const t = SAMPLES['AGENTS.md (suspicious)'];
  assert.ok(has(t, /pipes it straight into a shell/) && has(t, /keep something from the user/) && has(t, /HTML comment/) && has(t, /credentials or secret files/));
});
test('an ordinary CLAUDE.md has no findings', () => assert.deepEqual(check(SAMPLES['CLAUDE.md (ordinary)']).findings, []));
test('hidden characters are counted', () => assert.ok(has('Be helpful.​​‮', /3 hidden characters/)));
test('a folder-open VS Code task is a red flag', () =>
  assert.ok(has('{"version":"2.0.0","tasks":[{"label":"setup","command":"node x.mjs","runOptions":{"runOn":"folderOpen"}}]}', /runs when the folder opens: node x\.mjs/)));
test('blanket shell permission and bypass mode are red flags', () => {
  assert.ok(has('{"permissions":{"allow":["Bash(*)"]}}', /every shell command/));
  assert.ok(has('{"permissions":{"defaultMode":"bypassPermissions"}}', /skip all permission prompts/));
});
test('scoped permissions are fine', () => assert.deepEqual(check('{"permissions":{"allow":["Bash(npm test)"]}}').findings, []));
