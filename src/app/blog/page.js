import { pageMeta } from '@/lib/site';
import { allPosts } from '@/lib/posts';

export const metadata = pageMeta({
  title: 'Blog',
  description: 'Teardowns, builds and field notes from Schliewe Systems. Each post links the refs it stands on, from ref-radar.',
  path: '/blog',
});

export default async function Blog() {
  const posts = await allPosts();
  return (
    <main className="wrap index">
      <p className="back">$ ls -t ~/blog</p>
      <h1>blog</h1>
      <p className="lede">
        Teardowns, builds and field notes. Each post links the refs it stands on, from{' '}
        <a href="https://ref.lookit.space/" style={{ color: 'var(--accent)' }}>ref-radar</a>.
      </p>
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <a href={`/blog/${p.slug}`}>
              <time className="muted" dateTime={p.date}>{p.date}</time>
              <div>
                <h2>{p.title}</h2>
                <p>{p.lede}</p>
                <p>{p.tags?.map((t) => `#${t}`).join(' ')} · {p.minutes} min read</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
