// A ref from ref-radar (ref.lookit.space), as a card linking to its page: <Ref id="gh:owner/repo" />.
// Fetched at build time, so the card refreshes on each deploy.
const SITE = 'https://ref.lookit.space';
const ID = /^[a-z]+:[\w.-]+(\/[\w.-]+)*$/;

export default async function Ref({ id }) {
  const ok = ID.test(id) && !id.includes('..');
  const idPath = ok ? id.replace(':', '/') : '';
  const page = ok ? `${SITE}/ref/${idPath}/` : SITE;
  let r = null;
  if (ok) {
    try {
      const res = await fetch(`${SITE}/r/${idPath}.json`, { cache: 'force-cache' });
      if (res.ok) r = await res.json();
    } catch {} // offline build: fall back to a plain link
  }
  if (!r) return <a className="ref" href={page}><span className="t">[ref] {id}</span></a>;

  const f = r.facts ?? {};
  return (
    <a className="ref" href={page}>
      <span className="t">[ref] {r.title}</span> <span className="meta">{r.id}</span>
      <span className="why">{r.why}</span>
      <span className="meta line">
        {[f.lang, f.license].filter(Boolean).join(' · ')}
        {' · '}<span className={`reuse-${r.reuse}`}>reuse {r.reuse}</span>
        {r.maturity ? ` · ${r.maturity}` : ''}
        {r.status ? <> · <span className="reuse-study">{r.status}</span></> : null}
        {f.stars ? ` · ★ ${f.stars.toLocaleString('en-US')}` : ''}
      </span>
    </a>
  );
}
