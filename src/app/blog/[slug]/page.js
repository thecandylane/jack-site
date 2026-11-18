import { pageMeta } from '@/lib/site';
import { getPost, longDate, slugs } from '@/lib/posts';
import { postJsonLd } from '@/lib/jsonld';
import JsonLd from '@/components/JsonLd';
import Radar from '@/components/Radar';

export const dynamicParams = false; // only the posts in src/content/posts; anything else is a 404

export function generateStaticParams() {
  return slugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const p = await getPost((await params).slug);
  return pageMeta({ title: p.title, description: p.lede, path: `/blog/${p.slug}`, type: 'article', publishedTime: p.date });
}

export default async function Post({ params }) {
  const { Body, ...p } = await getPost((await params).slug);
  const general = p.audience === 'general'; // reader skin: paper, serif, no phosphor chrome (globals.css, "reader")
  return (
    <main className={general ? 'wrap post reader' : 'wrap post'}>
      <JsonLd data={postJsonLd(p)} />
      <header>
        <a className="back" href="/blog">{general ? '← All posts' : '← cd ../blog'}</a>
        {!general && <div className="tags">{p.tags?.map((t) => <span key={t}>#{t}</span>)}</div>}
        <h1>{p.title}</h1>
        <p className="lede">{p.lede}</p>
        {general
          ? <p className="whoami">Jack Schliewe · {longDate(p.date)} · {p.minutes} min read</p>
          : <p className="whoami"><b>$</b> whoami <b>Jack Schliewe</b> · {longDate(p.date)} · {p.minutes} min read</p>}
        {!general && p.refs?.length ? <Radar lit={p.refs} /> : null}
      </header>
      {!general && p.toc.length > 0 && (
        <nav className="toc" aria-label="Contents">
          <h2>CONTENTS</h2>
          {p.toc.map((h) => <a key={h.id} href={`#${h.id}`} className={h.depth === 3 ? 'l3' : undefined}>{h.text}</a>)}
        </nav>
      )}
      <article className="prose"><Body /></article>
      {general && <footer><a href="/">Jack Schliewe builds software and security tools at schliewesystems.com →</a></footer>}
    </main>
  );
}
