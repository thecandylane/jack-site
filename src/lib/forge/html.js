// A tiny model of the two-document problem behind DOM clobbering and mutation XSS.
//
// The sanitizer reads the bytes once. The DOM reads them again. They disagree about <svg>
// content: the first pass copies it as text, so it never sees the tags or attributes inside;
// the second pass reparses foreign content as real elements. That difference is the whole lab.
//
// This is a model, not a browser. It is deterministic, has no DOM dependency, and says so on
// the page. What it teaches is the shape: a sanitizer's view of a document is not the parser's.

const TAG = /<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g;

function attrsOf(text) {
  const attrs = Object.create(null);
  for (const m of text.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

/**
 * @param {string} html
 * @param {{strict?: boolean}} options strict parses <svg> contents too, and so strips their ids
 * @returns {{ html: string, blocked: boolean, stripped: string[] }}
 */
export function sanitize(html, { strict = false } = {}) {
  let blocked = false;
  const stripped = [];
  let out = '';
  let last = 0;
  let skipUntil = 0;
  for (const m of html.matchAll(TAG)) {
    // matchAll saw this tag before the <svg> copy skipped over it. It was never parsed.
    if (m.index < skipUntil) continue;
    const [full, slash, name, rest] = m;
    const tag = name.toLowerCase();
    out += html.slice(last, m.index);
    last = m.index + full.length;

    // BUG (buggy mode only): foreign content is copied as text. The first pass never sees a tag
    // or an attribute inside it, so id/name survive into the document the browser parses.
    if (!slash && tag === 'svg' && !strict) {
      const end = html.toLowerCase().indexOf('</svg>', last);
      const until = end === -1 ? html.length : end;
      out += full + html.slice(last, until);
      last = until;
      skipUntil = until;
      continue;
    }

    if (!slash && tag === 'script') {
      blocked = true; // a real sanitizer would drop the whole subtree; here refusal ends the run
      continue;
    }

    const attrs = attrsOf(rest);
    const kept = Object.create(null);
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('on')) { blocked = true; continue; }
      if (key === 'href' && /^\s*javascript:/i.test(value)) { blocked = true; continue; }
      // The naive defence: ids and names are exactly what clobber window properties.
      if (key === 'id' || key === 'name') { stripped.push(`${key}=${value}`); continue; }
      kept[key] = value;
    }
    let rebuilt = `<${slash ? '/' : ''}${name}`;
    for (const [key, value] of Object.entries(kept)) rebuilt += ` ${key}="${value}"`;
    out += `${rebuilt}>`;
  }
  out += html.slice(last);
  return { html: out, blocked, stripped };
}

/** The second parse: every element with an id or name becomes a named property on window. */
export function parseDom(html) {
  const named = Object.create(null);
  for (const m of html.matchAll(TAG)) {
    const [, slash, name, rest] = m;
    if (slash) continue;
    const attrs = attrsOf(rest);
    const key = attrs.id || attrs.name;
    if (key) named[key] = { tag: name.toLowerCase(), attrs };
  }
  return named;
}

/** Run the model: sanitize, reparse, then let the sink read window.config.mode. */
export function evaluate(html, { strict = false } = {}) {
  const first = sanitize(html, { strict });
  const named = parseDom(first.html);
  const config = named.config ?? null;
  const mode = config?.attrs?.mode ?? null;
  const log = [
    `sanitized: ${first.html.trim() || '(empty)'}`,
    first.stripped.length ? `stripped: ${first.stripped.join(', ')}` : 'stripped: nothing',
    config ? `window.config: <${config.tag}> mode=${mode ?? '(none)'}` : 'window.config: untouched',
  ];
  return {
    blocked: first.blocked,
    sanitized: first.html,
    stripped: first.stripped,
    config,
    mode,
    solved: !first.blocked && mode === 'evil',
    log,
  };
}
