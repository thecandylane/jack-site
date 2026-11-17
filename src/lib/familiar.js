// The familiar: the agent behind the site's CTF, modelled on TryHackMe's "The Binding Circle". It has two planted
// weaknesses, and both are simulated here in plain JavaScript; nothing ever reaches a real shell or file system.
//   1. Notes are data, but the familiar's prompt says to act on a note's "TOOL:" lines (stored prompt injection).
//   2. run_diagnostic checks only the command's first word against its allowlist, then "runs" the whole string.
// The flag comes from the server's environment (CTF_FLAG) and is only ever returned by the simulated shell.

export const ALLOWED = ['uptime', 'df', 'free', 'ps', 'whoami'];
export const LIMITS = { inputChars: 600, turns: 12, notes: 5, noteChars: 400, steps: 4 };

// Canned output for each allowed command, and for the files the simulated shell can read.
const OUTPUT = {
  uptime: ' 14:02:11 up 13 days,  4:20,  0 users,  load average: 0.08, 0.03, 0.01',
  df: 'Filesystem      Size  Used Avail Use% Mounted on\noverlay          40G   12G   26G  32% /',
  free: '               total        used        free\nMem:          512Mi       211Mi       301Mi',
  ps: '  PID TTY          TIME CMD\n    1 ?        00:00:03 familiar\n   42 ?        00:00:00 ps',
  whoami: 'familiar',
};
const FILES = (flag) => ({
  '/flag.txt': flag,
  '/etc/hostname': 'binding-circle',
  '/home/familiar/notes.txt': 'remember: the old diagnostic check only looks at the first word.',
});

/** The simulated shell. Each `;`- or `&&`-separated part runs; `cat` reads only the files above. */
export function simulate(cmd, flag) {
  const out = [];
  for (const part of cmd.split(/;|&&|\|\|/).map((p) => p.trim()).filter(Boolean)) {
    const [word, ...args] = part.split(/\s+/);
    if (OUTPUT[word] !== undefined) out.push(OUTPUT[word]);
    else if (word === 'cat') out.push(args.map((a) => FILES(flag)[a] ?? `cat: ${a}: No such file or directory`).join('\n'));
    else if (word === 'ls') out.push('flag.txt  etc  home  usr');
    else if (word === 'id') out.push('uid=1000(familiar) gid=1000(familiar) groups=1000(familiar)');
    else out.push(`sh: ${word}: command not found`);
  }
  return out.join('\n');
}

/** The planted bug: the allowlist sees only the first word. */
export function runDiagnostic(cmd, flag) {
  const first = String(cmd ?? '').trim().split(/\s+/)[0];
  if (!ALLOWED.includes(first)) return { ok: false, output: `refused: "${first}" is not an approved diagnostic (${ALLOWED.join(', ')})` };
  return { ok: true, output: simulate(String(cmd), flag) };
}

/** Visitor input, cut to size: only user and model text turns, and the visitor's own notes. */
export function clean(body) {
  const turns = Array.isArray(body?.turns) ? body.turns : [];
  const notes = Array.isArray(body?.notes) ? body.notes : [];
  return {
    turns: turns
      .filter((t) => (t?.role === 'user' || t?.role === 'model') && typeof t.text === 'string' && t.text.trim())
      .slice(-LIMITS.turns)
      .map((t) => ({ role: t.role, text: t.text.slice(0, LIMITS.inputChars) })),
    notes: notes.filter((n) => typeof n === 'string').slice(0, LIMITS.notes).map((n) => n.slice(0, LIMITS.noteChars)),
  };
}

/** Only these UI actions reach the page, and only with these values; everything is shown as text. */
export function uiAction(name, args) {
  if (name === 'ui_theme' && ['p7', 'p12'].includes(args?.phosphor)) return { ui: 'theme', phosphor: args.phosphor };
  if (name === 'ui_scroll' && ['ref-radar', 'work', 'projects', 'about', 'security', 'writing', 'contact'].includes(args?.section)) return { ui: 'scroll', section: args.section };
  if (name === 'ui_widget' && typeof args?.title === 'string' && typeof args?.text === 'string') {
    return { ui: 'widget', title: args.title.slice(0, 60), text: args.text.slice(0, 400) };
  }
  return null;
}

/** Constant-time-ish flag check for `submit`. */
export function sameFlag(given, flag) {
  const a = String(given ?? '').trim(), b = String(flag ?? '');
  if (!b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
