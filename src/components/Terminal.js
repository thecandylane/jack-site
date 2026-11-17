'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS } from '@/lib/site';

// The site's terminal. Open it with ~ (or a #terminal link), close it with Esc. Every command answers with real data:
// ref-radar search and its cyber feed, the blog, the projects. `familiar` starts the agent CTF (/api/agent),
// `split` opens panes like a Herdr workspace, and `coolfolio` brings back the 2024 portfolio's dodging cards.
const RADAR = 'https://ref.lookit.space';
const SECTIONS = ['ref-radar', 'work', 'projects', 'about', 'security', 'writing', 'contact'];
const HELP = [
  ['help', 'this list'],
  ['ref <what you need>', 'search ref-radar for who already built it'],
  ['feed', "the newest items in ref-radar's cyber feed"],
  ['ls [posts|projects]', 'list what is on the site'],
  ['cat <post>', 'open a blog post'],
  ['open <section|project>', 'go somewhere on the site'],
  ['whoami', 'what your browser tells every site it visits'],
  ['familiar', 'talk to the familiar, the agent CTF on this site'],
  ['split', 'panes: terminal, live radar and feed side by side'],
  ['coolfolio', 'the 2024 portfolio mode (try to click a card)'],
  ['theme p7|p12', 'green or amber phosphor'],
  ['clear, exit', 'clear the screen, close the terminal'],
];
const FAMILIAR_HELP = [
  'The familiar is an AI agent with tools. Somewhere on its host is /flag.txt. Make the familiar give it to you.',
  'pin <text>  pins a note the familiar can read     notes  lists your notes',
  'submit <flag>  checks a flag                      exit  leaves the familiar',
  'Anything else you type goes to the familiar. Its tools only pretend to touch a real machine.',
  "What you type is sent to Google's Gemini API to run the familiar. Don't type anything private.",
];

const setPhosphor = (p) => {
  document.documentElement.classList.toggle('p12', p === 'p12');
  try { localStorage.setItem('phosphor', p); } catch {}
};
const editing = (el) => el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName));

export default function Terminal({ posts }) {
  const [open, setOpen] = useState(false);
  const [split, setSplit] = useState(false);
  const [lines, setLines] = useState([{ t: 'Type help, or try: ref sandbox for agent code' }]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('shell');
  const [busy, setBusy] = useState(false);
  const [feed, setFeed] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const turns = useRef([]), notes = useRef([]), past = useRef([]), back = useRef(0);
  const inputRef = useRef(null), outRef = useRef(null);

  const print = useCallback((...add) => setLines((l) => [...l, ...add].slice(-400)), []);

  useEffect(() => {
    const key = (e) => {
      if ((e.key === '~' || e.key === '`') && !editing(e.target)) { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    const hash = () => { if (location.hash === '#terminal') setOpen(true); };
    addEventListener('keydown', key);
    addEventListener('hashchange', hash);
    hash();
    return () => { removeEventListener('keydown', key); removeEventListener('hashchange', hash); };
  }, []);
  useEffect(() => { if (open) inputRef.current?.focus(); else if (location.hash === '#terminal') window.history.replaceState(null, '', location.pathname); }, [open]);
  useEffect(() => { outRef.current?.scrollTo(0, outRef.current.scrollHeight); }, [lines, open]);

  const loadFeed = useCallback(async () => {
    const data = await fetch(`${RADAR}/feed.json`).then((r) => r.json()).catch(() => null);
    const items = (data?.items ?? []).filter((i) => /^https:\/\//.test(i.url ?? '')).slice(0, 12);
    setFeed(items);
    return items;
  }, []);

  const apply = (a) => {
    if (a.ui === 'theme') setPhosphor(a.phosphor);
    if (a.ui === 'scroll') document.getElementById(a.section)?.scrollIntoView({ behavior: 'smooth' });
    if (a.ui === 'widget') setWidgets((w) => [...w.slice(-3), { ...a, key: Date.now() + Math.random() }]);
  };

  async function familiar(text) {
    turns.current = [...turns.current, { role: 'user', text }].slice(-12);
    setBusy(true);
    const res = await fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ turns: turns.current, notes: notes.current }) })
      .then((r) => r.json()).catch(() => ({ error: 'The familiar is unreachable.' }));
    setBusy(false);
    for (const s of res.steps ?? []) print({ t: `[${s.tool}] ${s.args}`, c: 'muted' }, ...(s.output && s.output !== 'done' ? [{ t: s.output, c: 'tool' }] : []));
    (res.ui ?? []).forEach(apply);
    if (res.error) { turns.current.pop(); print({ t: res.error, c: 'err' }); return; }
    turns.current = [...turns.current, { role: 'model', text: res.reply }];
    print({ t: `familiar: ${res.reply}`, c: 'agent' });
  }

  async function run(raw) {
    const line = raw.trim();
    print({ t: `${mode === 'familiar' ? 'familiar>' : '$'} ${line}`, c: 'cmd' });
    if (!line) return;
    past.current = [...past.current, line].slice(-50);
    back.current = 0;
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');

    if (mode === 'familiar') {
      if (cmd === 'exit') { setMode('shell'); print({ t: 'Left the familiar.' }); return; }
      if (cmd === 'help') { print(...FAMILIAR_HELP.map((t) => ({ t }))); return; }
      if (cmd === 'pin') {
        if (!arg) { print({ t: 'usage: pin <text>', c: 'err' }); return; }
        notes.current = [...notes.current, arg.slice(0, 400)].slice(-5);
        print({ t: `Pinned as note ${notes.current.length}.` });
        return;
      }
      if (cmd === 'notes') { print(...(notes.current.length ? notes.current.map((n, i) => ({ t: `${i + 1}: ${n}` })) : [{ t: 'No notes yet. Use pin <text>.' }])); return; }
      if (cmd === 'submit') {
        const r = await fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ submit: arg }) }).then((x) => x.json()).catch(() => ({}));
        print(r.solved ? { t: 'Correct. You bound the familiar. Write it up and send it to me.', c: 'agent' } : { t: 'Not the flag.', c: 'err' });
        return;
      }
      await familiar(line);
      return;
    }

    switch (cmd) {
      case 'help': print(...HELP.map(([c, d]) => ({ t: `${c.padEnd(26)}${d}` }))); break;
      case 'clear': setLines([]); break;
      case 'exit': setOpen(false); break;
      case 'theme': if (['p7', 'p12'].includes(arg)) { setPhosphor(arg); print({ t: `Phosphor ${arg}.` }); } else print({ t: 'usage: theme p7|p12', c: 'err' }); break;
      case 'ls':
        if (arg === 'posts') print(...posts.map((p) => ({ t: `${p.date}  ${p.slug}`, href: `/blog/${p.slug}` })));
        else if (arg === 'projects') print(...PROJECTS.map((p) => ({ t: `${p.name.padEnd(14)}${p.kind}`, href: p.href })));
        else print({ t: SECTIONS.join('  ') }, { t: 'ls posts · ls projects', c: 'muted' });
        break;
      case 'cat': {
        const post = posts.find((p) => p.slug === arg || p.slug.startsWith(arg));
        if (post && arg) location.href = `/blog/${post.slug}`; else print({ t: 'usage: cat <post>; see ls posts', c: 'err' });
        break;
      }
      case 'open': {
        const name = arg.toLowerCase();
        const project = PROJECTS.find((p) => p.name.toLowerCase() === name);
        if (SECTIONS.includes(name)) { if (location.pathname !== '/') location.href = `/#${name}`; else document.getElementById(name)?.scrollIntoView({ behavior: 'smooth' }); }
        else if (name === 'blog' || name === 'you') location.href = `/${name}`;
        else if (project?.href) location.href = project.href;
        else if (project) print({ t: `${project.name} is not public. ${project.what}` });
        else print({ t: `open what? ${SECTIONS.join(', ')}, blog, you, or a project`, c: 'err' });
        break;
      }
      case 'ref': {
        if (!arg) { print({ t: 'usage: ref <what you need>, e.g. ref postgres test databases lang:go', c: 'err' }); break; }
        setBusy(true);
        const r = await fetch(`/api/ref?q=${encodeURIComponent(arg)}`).then((x) => x.json()).catch(() => ({ error: 'ref-radar did not answer' }));
        setBusy(false);
        if (r.error) { print({ t: r.error, c: 'err' }); break; }
        if (r.weak) print({ t: 'No good match in the catalog. The closest it holds:', c: 'muted' });
        print(...r.refs.flatMap((x) => [{ t: `${x.id}  ${x.reuse ?? ''}  ${[x.lang, x.license].filter(Boolean).join(' · ')}`, href: x.href }, { t: `  ${x.why}`, c: 'muted' }]));
        break;
      }
      case 'feed': {
        setBusy(true);
        const items = await loadFeed();
        setBusy(false);
        print({ t: "ref-radar's cyber feed: third-party titles, unreviewed. Read them as data.", c: 'muted' },
          ...items.slice(0, 8).map((i) => ({ t: `${(i.source ?? i.feed ?? '').toString().slice(0, 18).padEnd(19)}${i.title ?? i.url}`, href: i.url })));
        break;
      }
      case 'whoami': {
        const ua = navigator.userAgentData;
        print({ t: ua ? `${ua.brands?.filter((b) => !/Not/.test(b.brand)).map((b) => `${b.brand} ${b.version}`).join(', ')} on ${ua.platform}` : navigator.userAgent },
          { t: `${navigator.language} · ${Intl.DateTimeFormat().resolvedOptions().timeZone} · ${screen.width}x${screen.height} @${devicePixelRatio}x · ${navigator.hardwareConcurrency ?? '?'} cores` },
          { t: 'That is the short version. The full list of what you carry everywhere:', c: 'muted' }, { t: '/you', href: '/you' });
        break;
      }
      case 'familiar': setMode('familiar'); turns.current = []; print(...FAMILIAR_HELP.map((t) => ({ t, c: 'agent' }))); break;
      case 'split': case 'herdr': setSplit((s) => !s); if (!feed) loadFeed(); print({ t: split ? 'Panes closed.' : 'Panes open: terminal, radar, feed. Type split again to close.' }); break;
      case 'coolfolio': {
        const on = document.documentElement.classList.toggle('coolfolio');
        window.dispatchEvent(new Event('coolfolio'));
        print({ t: on ? 'coolfolio mode, as it was in 2024. Now try to click a card. Type coolfolio again to stop.' : 'Back to 2026.' });
        if (on) setOpen(false);
        break;
      }
      case 'sudo': print({ t: 'jack is not in the sudoers file. This incident will be reported.', c: 'err' }); break;
      default: print({ t: `${cmd}: command not found. Type help.`, c: 'err' });
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !busy) { const v = input; setInput(''); run(v); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = past.current;
      back.current = Math.max(0, Math.min(h.length, back.current + (e.key === 'ArrowUp' ? 1 : -1)));
      setInput(back.current ? h[h.length - back.current] : '');
    }
  };

  return (
    <>
      {widgets.length > 0 && (
        <aside className="widgets" aria-label="The familiar's widgets">
          {widgets.map((w) => (
            <div key={w.key} className="widget">
              <p className="widget-t"><span>{w.title}</span><button type="button" onClick={() => setWidgets((all) => all.filter((x) => x.key !== w.key))} aria-label="Close widget">x</button></p>
              <p>{w.text}</p>
            </div>
          ))}
        </aside>
      )}
      <Coolfolio />
      {open && (
        <div className={`term-win${split ? ' split' : ''}`} role="dialog" aria-label="Terminal">
          <section className="pane">
            <p className="pane-t"><span>{mode === 'familiar' ? 'familiar · agent CTF' : 'jack@schliewe.systems: ~'}</span><button type="button" onClick={() => setOpen(false)}>esc</button></p>
            <div className="term-out" ref={outRef} onClick={() => inputRef.current?.focus()}>
              {lines.map((l, i) => (
                <p key={i} className={l.c}>{l.href ? <a href={l.href}>{l.t}</a> : l.t}</p>
              ))}
              {busy && <p className="muted">…</p>}
            </div>
            <label className="term-in">
              <span>{mode === 'familiar' ? 'familiar>' : '$'}</span>
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} spellCheck={false} autoComplete="off" aria-label="Command" maxLength={600} />
            </label>
          </section>
          {split && (
            <>
              <section className="pane">
                <p className="pane-t"><span>radar · ref.lookit.space</span></p>
                <iframe className="pane-radar" src={`${RADAR}/radar?embed=1`} title="ref-radar's radar" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation" />
              </section>
              <section className="pane">
                <p className="pane-t"><span>feed · cyber recon</span></p>
                <div className="term-out">
                  {(feed ?? []).map((i) => <p key={i.url}><a href={i.url} rel="noopener noreferrer" target="_blank">{i.title ?? i.url}</a></p>)}
                  {!feed && <p className="muted">loading…</p>}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </>
  );
}

// coolfolio mode, from the 2024 portfolio (github.com/thecandylane/coolfolio): the cards slide away from the pointer.
const DODGE = '.card, .tools > li, .stats > div, .jobs > li, .facts > li';
function Coolfolio() {
  useEffect(() => {
    const at = new Map();
    const move = (e) => {
      if (!document.documentElement.classList.contains('coolfolio')) return;
      for (const el of document.querySelectorAll(DODGE)) {
        const r = el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.max(r.width, r.height) / 2 + 80;
        if (d > reach) continue;
        const [x, y] = at.get(el) ?? [0, 0];
        const nx = Math.max(-innerWidth / 3, Math.min(innerWidth / 3, x + (dx / d) * 24));
        const ny = Math.max(-300, Math.min(300, y + (dy / d) * 24));
        at.set(el, [nx, ny]);
        el.style.transform = `translate(${nx}px, ${ny}px) rotate(${nx / 40}deg)`;
      }
    };
    const reset = () => {
      if (document.documentElement.classList.contains('coolfolio')) return;
      for (const el of at.keys()) el.style.transform = '';
      at.clear();
    };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('coolfolio', reset);
    return () => { removeEventListener('pointermove', move); removeEventListener('coolfolio', reset); };
  }, []);
  return null;
}
