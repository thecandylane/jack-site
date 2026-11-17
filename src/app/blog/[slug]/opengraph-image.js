import { ImageResponse } from 'next/og';
import { getPost, longDate, slugs } from '@/lib/posts';

// A share card per post, drawn at build time (posts.js reads the file system, which the Worker doesn't have).
export const alt = 'A post by Jack Schliewe';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamicParams = false;
export const generateStaticParams = () => slugs().map((slug) => ({ slug }));

const GREEN = '#5dff8a', BG = '#030d07', DIM = '#5d8f6a';

export default async function Image({ params }) {
  const p = await getPost((await params).slug);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px', background: BG, fontFamily: 'monospace', border: `8px solid ${DIM}` }}>
        <div style={{ display: 'flex', fontSize: '26px', color: DIM }}>$ cat blog/{p.slug}</div>
        <div style={{ display: 'flex', fontSize: p.title.length > 48 ? '58px' : '72px', fontWeight: 700, color: GREEN, lineHeight: 1.15 }}>{p.title}</div>
        <div style={{ display: 'flex', fontSize: '28px', color: '#c8f5d3' }}>Jack Schliewe · {longDate(p.date)} · schliewesystems.com</div>
      </div>
    ),
    { ...size }
  );
}
