// Live numbers and one real answer from ref-radar (ref.lookit.space), read when the site is built.
// ponytail: refreshed on each deploy, not live; switch to ISR only if the home page stops reading src/ at build.
const SITE = 'https://ref.lookit.space';
export const SAMPLE = 'postgres test databases lang:go';

const json = (path) => fetch(`${SITE}${path}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${path}: ${r.status}`))));

export async function radarFacts() {
  try {
    const [cat, tax, search] = await Promise.all([json('/catalog.json'), json('/taxonomy.json'), json(`/api/search?q=${encodeURIComponent(SAMPLE)}`)]);
    const byId = new Map(cat.refs.map((r) => [r.id, r]));
    const hits = search.hits.toSorted((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => byId.get(id)).filter(Boolean);
    return {
      refs: cat.refs.length,
      repos: cat.refs.filter((r) => r.kind === 'repo').length,
      papers: cat.refs.filter((r) => r.kind === 'paper').length,
      topics: tax.nodes.length,
      built: cat.generated_at.slice(0, 10),
      hits,
    };
  } catch {
    return null; // offline build: the section renders without numbers
  }
}
