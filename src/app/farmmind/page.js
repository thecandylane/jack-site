import AutoDraw from '@/components/AutoDraw';
import FarmTour from '@/components/FarmTour';
import YouTubeFacade from '@/components/YouTubeFacade';
import { BUILT, FEATURES, PITCH, PRESS, SITE, TUTORIALS, VIDEOS } from '@/content/farmmind';
import { longDate } from '@/lib/posts';
import { pageMeta } from '@/lib/site';

export const dynamic = 'force-static';

export const metadata = pageMeta({
  title: 'FarmMind',
  description: "FarmMind, the agricultural intelligence platform from Baton Rouge: its product tour, a live Auto-Draw demo that runs in the browser, the parts of the app built as an AI and Cyber Engineer on its team, its tutorials and its press.",
  path: '/farmmind',
});

const video = (id) => VIDEOS.find((v) => v.id === id);
const NEW = VIDEOS.filter((v) => v.group === 'new');
const TUTORIAL_COUNT = Object.values(TUTORIALS).reduce((n, s) => n + s.items.length, 0);

function Videos({ list }) {
  return (
    <div className="fm-vids">
      {list.map((v) => (
        <figure key={v.id}>
          <YouTubeFacade id={v.id} title={v.title} poster={v.poster} />
          <figcaption className="small">{v.title}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Cta({ label }) {
  return (
    <nav className="cta" aria-label={label}>
      <a href={SITE.home}>Open FarmMind</a>
      <a href={SITE.appStore}>App Store</a>
      <a href={SITE.googlePlay}>Google Play</a>
      <a href={SITE.demo}>Book a Demo</a>
      <a href={SITE.youtube}>YouTube Channel</a>
    </nav>
  );
}

function Section({ id, num, title, children }) {
  return (
    <section id={id} className="fp reveal">
      <h2 className="sec-h"><span className="muted">{num} /</span> {title}</h2>
      {children}
    </section>
  );
}

export default function FarmMind() {
  return (
    <main className="wrap you fm-page">
      <p className="back">$ open farmmind</p>
      <h1 className="you-h">FarmMind</h1>
      <p className="lede">
        FarmMind describes itself on <a href={SITE.home}>farmmind.org</a>: &ldquo;{PITCH.description}&rdquo;
      </p>
      <p className="lede">
        This page walks through FarmMind&apos;s own product tour, the parts of the app built as an AI and Cyber Engineer on its team, a live
        demo of the technique behind Auto-Draw, its tutorials and its press.
      </p>
      <p className="muted small fm-stat">{PITCH.stat}, as farmmind.org counted it on {longDate(PITCH.statAsOf)}.</p>
      <Cta label="Get FarmMind" />

      <FarmTour features={FEATURES} logo={SITE.logo} headline={PITCH.headline} />
      <p className="muted small fm-note">
        Screenshots, captions and videos are FarmMind&apos;s own, from farmmind.org and its YouTube channel.
      </p>

      <Section id="autodraw" num="01" title="Auto-Draw Live Demo">
        <p className="lede">
          FarmMind&apos;s Auto-Draw outlines a field from satellite imagery in its web and mobile apps. This demo shows the same
          technique with public parts: two open segmentation models, MobileSAM and SlimSAM, run in this browser on USDA aerial
          photos of Louisiana farmland. Pick a model and load it, then click inside a field to outline it and read its acreage.
          Switch models to see how each one outlines the same points.
        </p>
        <AutoDraw />
      </Section>

      <Section id="built" num="02" title="What Was Built">
        <p className="lede">
          These are the parts of FarmMind&apos;s web and mobile apps built as an AI and Cyber Engineer on its team. FarmMind credits the translation work
          in its <a href={SITE.spotlight}>spotlight post</a>, which carries the two videos below.
        </p>
        <div className="cards fm-cards">
          {BUILT.map((b) => (
            <article key={b.key} className={b.videos.length ? 'card wide' : 'card'}>
              <h3>{b.title}</h3>
              <p>{b.body}</p>
              {b.videos.length > 0 && <Videos list={b.videos.map(video)} />}
              {b.links.length > 0 && (
                <p className="fm-links">{b.links.map((l) => <a key={l.href} className="go" href={l.href}>{l.label} →</a>)}</p>
              )}
            </article>
          ))}
        </div>
      </Section>

      <Section id="new" num="03" title="New in FarmMind">
        <p className="lede">Short videos from <a href={SITE.youtube}>FarmMind&apos;s YouTube channel</a> on recent changes to the app.</p>
        <Videos list={NEW} />
      </Section>

      <Section id="tutorials" num="04" title="Tutorials">
        <p className="lede">
          All {TUTORIAL_COUNT} tutorials on <a href={SITE.tutorials}>farmmind.org</a>, grouped by section. Each link opens
          FarmMind&apos;s own page.
        </p>
        <div className="fm-tuts">
          {Object.entries(TUTORIALS).map(([key, s]) => (
            <details key={key}>
              <summary>{s.title} <span className="muted">· {s.items.length} {s.items.length === 1 ? 'page' : 'pages'}</span></summary>
              <ul>{s.items.map((t) => <li key={t.url}><a href={t.url}>{t.title}</a></li>)}</ul>
            </details>
          ))}
        </div>
      </Section>

      <Section id="press" num="05" title="Press">
        <p className="lede">
          Coverage of FarmMind, newest first. Older stories use the company&apos;s earlier names. Articles open on the
          publisher&apos;s site, and the two TV segments play here.
        </p>
        <div className="cards fm-cards">
          {PRESS.map((p) => (
            <article key={p.url} className="card">
              {p.video
                ? <YouTubeFacade id={p.video} title={p.title} poster={video(p.video).poster} />
                : <img className="fm-thumb" src={p.image} alt="" width="640" height="360" loading="lazy" />}
              <p className="muted small">{p.source} · {longDate(p.date)}</p>
              <h3><a href={p.url}>{p.title}</a></h3>
            </article>
          ))}
        </div>
      </Section>

      <Cta label="FarmMind links" />
    </main>
  );
}
