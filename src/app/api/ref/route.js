// The terminal's `ref` command: ref-radar's semantic search, with each hit's title, why line and reuse verdict.
// ref-radar's /api/search sends no CORS header, so the browser asks this route instead.
export const dynamic = 'force-dynamic';

const SITE = 'https://ref.lookit.space';
const ID = /^[a-z]+:[\w.-]+(\/[\w.-]+)*$/;

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 200);
  if (!q) return Response.json({ error: 'usage: ref <what you need>' }, { status: 400 });
  const search = await fetch(`${SITE}/api/search?q=${encodeURIComponent(q)}`, { next: { revalidate: 600 } }).then((r) => r.json()).catch(() => null);
  if (!search?.hits) return Response.json({ error: search?.error ?? 'ref-radar did not answer' }, { status: 502 });
  const ids = search.hits.toSorted((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([id]) => id).filter((id) => ID.test(id) && !id.includes('..')).slice(0, 6);
  const refs = await Promise.all(ids.map((id) =>
    fetch(`${SITE}/r/${id.replace(':', '/')}.json`, { next: { revalidate: 3600 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  return Response.json({
    weak: !!search.weak,
    refs: refs.filter(Boolean).map((r) => ({ id: r.id, title: r.title, why: r.why, reuse: r.reuse, lang: r.facts?.lang ?? null, license: r.facts?.license ?? null, href: `${SITE}/ref/${r.id.replace(':', '/')}/` })),
  });
}
