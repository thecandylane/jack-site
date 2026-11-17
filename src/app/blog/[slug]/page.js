import { getPost, longDate, slugs } from '@/lib/posts';
import Radar from '@/components/Radar';

export const dynamicParams = false; // only the posts in src/content/posts; anything else is a 404

export function generateStaticParams() {
  return slugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const p = await getPost((await params).slug);
  return {
    title: `${p.title} · Jack Schliewe`,
    description: p.lede,
    openGraph: { title: p.title, description: p.lede, type: 'article', publishedTime: p.date },
  };
}

export default async function Post({ params }) {
  const { Body, ...p } = await getPost((await params).slug);
  return (
    <main className="wrap post">
      <header>
        <a className="back" href="/blog">← cd ../blog</a>
        <div className="tags">{p.tags?.map((t) => <span key={t}>#{t}</span>)}</div>
        <h1>{p.title}</h1>
        <p className="lede">{p.lede}</p>
        <p className="whoami"><b>$</b> whoami <b>Jack Schliewe</b> · {longDate(p.date)} · {p.minutes} min read</p>
        {p.refs?.length ? <Radar lit={p.refs} /> : null}
      </header>
      {p.toc.length > 0 && (
        <nav className="toc" aria-label="Contents">
          <h2>CONTENTS</h2>
          {p.toc.map((h) => <a key={h.id} href={`#${h.id}`} className={h.depth === 3 ? 'l3' : undefined}>{h.text}</a>)}
        </nav>
      )}
      <article className="prose"><Body /></article>
    </main>
  );
}
