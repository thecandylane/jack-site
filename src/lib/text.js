/** A heading's anchor id. The TOC (from the MDX source) and the rendered heading (from its children) must agree. */
export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

/** The plain text inside React children: strings, arrays and elements' own children. */
export const text = (n) =>
  typeof n === 'string' || typeof n === 'number' ? String(n)
    : Array.isArray(n) ? n.map(text).join('')
      : n?.props ? text(n.props.children) : '';

/**
 * The ## and ### headings of an MDX source, outside code fences, as { depth, text, id }.
 * ponytail: strips only links, code ticks and emphasis; a heading holding JSX gets an id that may not match.
 */
export function headings(src) {
  const out = [];
  let fenced = false;
  for (const line of src.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const plain = m[2].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '');
    out.push({ depth: m[1].length, text: plain, id: slug(plain) });
  }
  return out;
}

/** Minutes to read at 220 words a minute, at least 1. */
export const minutes = (src) => Math.max(1, Math.ceil(src.split(/\s+/).filter(Boolean).length / 220));
