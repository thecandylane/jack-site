import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://schliewesystems.com';
const RADAR = 'https://ref.lookit.space';

// One quoted JavaScript string, single or double, with the usual escapes.
function readString(src, i) {
  const q = src[i];
  if (q !== "'" && q !== '"') return null;
  let out = '';
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === '\\') {
      const n = src[j + 1];
      if (n === undefined) break;
      out += n === 'n' ? '\n' : n === 't' ? '\t' : (n ?? '');
      j++;
      continue;
    }
    if (c === q) return { value: out, end: j + 1 };
    out += c;
  }
  return null;
}

/** title, lede and date from each post file. The test checks llms.txt against this, so the file cannot drop a post. */
export function postMetas(dir) {
  const posts = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    const open = src.indexOf('export const meta = {');
    const close = src.indexOf('\n}', open);
    const body = src.slice(open, close);
    const meta = { slug: file.slice(0, -4) };
    for (const key of ['title', 'lede', 'date']) {
      const at = body.indexOf(`${key}:`);
      let q = at + key.length + 1;
      while (body[q] === ' ') q++;
      const read = readString(body, q);
      if (!read) throw new Error(`${file} has no ${key}`);
      meta[key] = read.value;
    }
    posts.push(meta);
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function llmsText(posts) {
  const lines = [
    '# Jack Schliewe',
    '',
    '> AI developer and security engineer in Baton Rouge, Louisiana. Builds ref-radar, prior art for coding agents.',
    '',
    '## ref-radar',
    '',
    'ref-radar answers "who already built this, where do I start reading, and can I reuse it?" for coding agents. Every ref has a why line, start-here paths pinned to a commit, and a reuse verdict from its license (copy, copyleft or study).',
    '',
    `- MCP server (streamable HTTP, no account needed to read): ${RADAR}/mcp`,
    '- Claude Code: `claude mcp add --transport http ref-radar https://ref.lookit.space/mcp`',
    `- Instructions for agents: ${RADAR}/llms.txt`,
    `- Catalog: ${RADAR}/catalog.json`,
    '- Nightly export: https://github.com/thecandylane/ref-radar-data',
    '',
    '## Posts',
    '',
  ];
  for (const p of posts) {
    lines.push(`- [${p.title}](${SITE}/blog/${p.slug}) (${p.date}). ${p.lede}`);
  }
  lines.push(
    '',
    '## This site',
    '',
    `- Home: ${SITE}/`,
    `- Blog: ${SITE}/blog`,
    `- Lab: ${SITE}/lab`,
    `- Forge: ${SITE}/forge`,
    `- What this site sees: ${SITE}/you`,
    '- GitHub: https://github.com/thecandylane',
    '',
  );
  return lines.join('\n');
}
