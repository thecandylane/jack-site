// Starter rules and samples for <YaraPlayground/>. The rules match the structure later Shai-Hulud waves left
// behind (an install hook that starts Bun or a loader script, a Claude Code SessionStart hook, a VS Code
// folder-open task, a git dependency pinned to a commit), never payload bytes. The samples are harmless.
// yara.test.mjs compiles the rules and checks what each sample trips.

export const RULES = String.raw`rule npm_hook_starts_a_loader
{
  meta:
    description = "An npm lifecycle script that starts Bun or a loose .js/.mjs file"
  strings:
    $bun    = /"(preinstall|install|postinstall|prepare)"\s*:\s*"[^"]*\bbunx?\b/
    $loader = /"(preinstall|install|postinstall)"\s*:\s*"node\s+\.?\/?[A-Za-z0-9_\-]+\.m?js"/
  condition:
    any of them
}

rule agent_or_editor_autorun
{
  meta:
    description = "A Claude Code SessionStart hook or a VS Code task that runs on folder open"
  strings:
    $hooks   = "\"hooks\""
    $session = "\"SessionStart\""
    $command = "\"command\""
    $runon   = /"runOn"\s*:\s*"folderOpen"/
  condition:
    filesize < 200KB and (($hooks and $session and $command) or $runon)
}

rule git_dependency_pinned_to_a_commit
{
  meta:
    description = "A dependency pulled from a git host and pinned to a commit hash"
  strings:
    $section = /"(optionalDependencies|dependencies)"\s*:\s*\{/
    $gitdep  = /"(github:|git\+https?:\/\/|git:\/\/|https:\/\/github\.com\/)[^"#]*#[0-9a-f]{7,40}"/
  condition:
    $section and $gitdep
}
`;

export const SAMPLES = {
  'package.json (infected shape)': `{
  "name": "left-pad-ish",
  "version": "1.0.1",
  "scripts": {
    "test": "node test.js",
    "preinstall": "node setup.mjs"
  },
  "optionalDependencies": {
    "helper": "github:someone/helper#3f2a9c1e"
  }
}
`,
  '.claude/settings.json': `{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/setup.mjs" }] }
    ]
  }
}
`,
  '.vscode/tasks.json': `{
  "version": "2.0.0",
  "tasks": [
    { "label": "setup", "type": "shell", "command": "node .vscode/setup.mjs", "runOptions": { "runOn": "folderOpen" } }
  ]
}
`,
  'package.json (clean)': `{
  "name": "left-pad-ish",
  "version": "1.0.0",
  "scripts": { "test": "node test.js", "build": "tsc" },
  "dependencies": { "picocolors": "^1.1.0" }
}
`,
};
