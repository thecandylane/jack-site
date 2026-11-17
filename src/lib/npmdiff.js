// Compares two published versions of an npm package the way a careful reviewer would before installing the new
// one. Every Shai-Hulud wave changed at least one of these between a clean version and the infected one: a new
// install hook, a new native build, a git or URL dependency, a new command, a different publisher, missing
// provenance, or a jump in size. Pure functions; NpmDiff.js does the fetching.
// Manifest fields: github.com/npm/registry/blob/main/docs/responses/package-metadata.md

export const NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(v);
  return m && { n: [+m[1], +m[2], +m[3]], pre: m[4] ?? null };
};

/** Semver order: -1, 0 or 1. Prerelease parts compare as numbers when both are numeric, else as text. */
export function cmp(a, b) {
  const x = parse(a), y = parse(b);
  for (let i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] < y.n[i] ? -1 : 1;
  if (x.pre === y.pre) return 0;
  if (x.pre === null) return 1;
  if (y.pre === null) return -1;
  const p = x.pre.split('.'), q = y.pre.split('.');
  for (let i = 0; i < Math.max(p.length, q.length); i++) {
    if (p[i] === undefined) return -1;
    if (q[i] === undefined) return 1;
    const num = /^\d+$/.test(p[i]) && /^\d+$/.test(q[i]);
    if (p[i] !== q[i]) return num ? (+p[i] < +q[i] ? -1 : 1) : p[i] < q[i] ? -1 : 1;
  }
  return 0;
}

/** The version published before `version`: the highest one below it, skipping prereleases unless it is one. */
export function previous(versions, version) {
  const pre = parse(version)?.pre !== null;
  return versions
    .filter((v) => parse(v) && cmp(v, version) < 0 && (pre || parse(v).pre === null))
    .sort(cmp)
    .at(-1) ?? null;
}

const HOOKS = ['preinstall', 'install', 'postinstall'];
const deps = (m) => ({ ...m?.optionalDependencies, ...m?.dependencies });
const bins = (m) => (typeof m?.bin === 'string' ? { [m.name]: m.bin } : m?.bin ?? {});
const provenance = (m) => Boolean(m?.dist?.attestations?.provenance);
// A dependency that isn't fetched from the registry by version: git, a URL, a file, or GitHub shorthand.
const remote = (spec) => /^(git\+|git:|https?:|file:|github:|gitlab:|bitbucket:)/.test(spec) || /^[\w.-]+\/[\w.-]+(#.*)?$/.test(spec);
const kb = (n) => `${Math.round(n / 1024)} KB`;

/**
 * Findings for upgrading from `old` to `now` (full version manifests from registry.npmjs.org/<name>/<version>).
 * `old` may be null for a package's first version. Each finding is { level: 'high' | 'warn' | 'info', text }.
 */
export function compare(old, now) {
  const out = [];
  const add = (level, text) => out.push({ level, text });

  for (const h of HOOKS) {
    const a = old?.scripts?.[h], b = now.scripts?.[h];
    if (b && !a) add('high', `New ${h} script, which npm runs on install: ${b}`);
    else if (b && a !== b) add('high', `The ${h} script changed: ${a} → ${b}`);
    else if (b) add('info', `Runs ${h} on install, unchanged from the previous version: ${b}`);
  }
  if (now.gypfile && !old?.gypfile) add('high', 'New native build (binding.gyp): npm runs node-gyp on install.');
  if (now.scripts?.prepare && now.scripts.prepare !== old?.scripts?.prepare) add('warn', `New or changed prepare script, which runs when the package is installed from git: ${now.scripts.prepare}`);

  const was = deps(old), is = deps(now);
  for (const [name, spec] of Object.entries(is)) {
    if (remote(spec) && was[name] !== spec) add('high', `Dependency ${name} now comes from outside the registry: ${spec}`);
    else if (!(name in was)) add(old ? 'warn' : 'info', `New dependency ${name}@${spec}`);
  }

  const binWas = bins(old);
  for (const [cmd, file] of Object.entries(bins(now))) if (!(cmd in binWas)) add(old ? 'warn' : 'info', `New command on your PATH: ${cmd} → ${file}`);

  if (old) {
    if (provenance(old) && !provenance(now)) add('high', 'The previous version had build provenance and this one does not: it was not published from the usual CI.');
    const pa = old._npmUser?.name, pb = now._npmUser?.name;
    if (pa && pb && pa !== pb) add('warn', `Published by a different account: ${pa} → ${pb}`);
    const sa = old.dist?.unpackedSize, sb = now.dist?.unpackedSize;
    if (sa && sb && sb > sa * 1.5 && sb - sa > 100 * 1024) add('warn', `Unpacked size jumped from ${kb(sa)} to ${kb(sb)}.`);
    const fa = old.dist?.fileCount, fb = now.dist?.fileCount;
    if (fa && fb && fb - fa >= 5 && fb > fa * 1.5) add('warn', `File count jumped from ${fa} to ${fb}.`);
  }
  return out;
}
