import fs from 'node:fs';
import path from 'node:path';
import { headings, minutes } from './text';

// Posts are src/content/posts/<slug>.mdx, each exporting `meta` ({ title, lede, date, tags, refs, audience }; audience: 'general' gives the post the reader skin).
// Every blog page is prerendered at build, so this runs only during `next build`, never in the standalone server.
const DIR = path.join(process.cwd(), 'src/content/posts');

export const slugs = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, -4));

export async function getPost(slug) {
  const src = fs.readFileSync(path.join(DIR, `${slug}.mdx`), 'utf8');
  const mod = await import(`@/content/posts/${slug}.mdx`);
  return { slug, ...mod.meta, Body: mod.default, toc: headings(src), minutes: minutes(src) };
}

export async function allPosts() {
  const posts = await Promise.all(slugs().map(getPost));
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

/** "16 November 2026" from "2026-11-16". */
export const longDate = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
