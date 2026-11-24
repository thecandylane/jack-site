'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// The strip at the top, built like ref-radar's (ref.lookit.space): pages, a Search> prompt that searches
// ref-radar, the phosphor switch and a clock. The two sites link to each other; they stay separate hosts.
const LINKS = [
  ['~', '/'],
  ['work', '/#work', 'wide'],
  ['projects', '/#projects', 'wide'],
  ['blog', '/blog'],
  ['forge', '/forge', 'wide'],
  ['headers', '/headers', 'wide'],
  ['contact', '/#contact'],
  ['you', '/you', 'wide'],
  ['lab', '/lab', 'wide'],
  ['farmmind', '/farmmind', 'wide'],
];

export default function Strip() {
  const path = usePathname();
  const [p12, setP12] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    setP12(document.documentElement.classList.contains('p12'));
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    const next = !p12;
    document.documentElement.classList.toggle('p12', next);
    try { localStorage.setItem('phosphor', next ? 'p12' : 'p7'); } catch {}
    setP12(next);
  };

  return (
    <header id="bar">
      <a className="brand" href="/">schliewe.systems</a>
      <nav aria-label="Site">
        {LINKS.map(([label, href, cls]) => (
          <a key={href} href={href} className={cls} aria-current={href === path || (href === '/blog' && path.startsWith('/blog/')) ? 'page' : undefined}>{label}</a>
        ))}
        <a href="https://ref.lookit.space/">ref-radar↗</a>
      </nav>
      <form action="https://ref.lookit.space/search" role="search">
        <label htmlFor="q">Search&gt;</label>
        <input id="q" name="q" placeholder="who already built it? (ref-radar)" autoComplete="off" />
      </form>
      <button type="button" onClick={() => { location.hash = 'terminal'; }} title="Open the terminal (or press ~)" aria-label="Open the terminal" id="term-toggle">~</button>
      <button type="button" onClick={toggle} aria-pressed={p12} title="Switch phosphor: P7 green / P12 amber">
        {p12 ? 'p12' : 'p7'}
      </button>
      <time>{now}</time>
    </header>
  );
}
