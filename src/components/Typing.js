'use client';

import { useRef, useState } from 'react';

// Keystroke dynamics: how long you hold each key and the gap to the next one. Banks and anti-fraud scripts
// measure this to recognize you across logins. Measured here, kept here.
const SENTENCE = 'the quick brown fox jumps over the lazy dog';
const stats = (a) => { const m = a.reduce((s, x) => s + x, 0) / (a.length || 1); return [Math.round(m), Math.round(Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length || 1)))]; };

export default function Typing() {
  const down = useRef({}), last = useRef(0), hold = useRef([]), gap = useRef([]);
  const [res, setRes] = useState(null);
  const [text, setText] = useState('');

  const onDown = (e) => {
    if (e.repeat) return;
    const t = performance.now();
    if (last.current) gap.current.push(t - last.current);
    down.current[e.code] = t;
  };
  const onUp = (e) => {
    const t = performance.now(), d = down.current[e.code];
    if (d) { hold.current.push(t - d); last.current = t; delete down.current[e.code]; }
  };
  const onChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim() === SENTENCE) {
      const [hm, hs] = stats(hold.current), [gm, gs] = stats(gap.current.filter((g) => g < 2000));
      setRes({ hm, hs, gm, gs });
    }
  };
  const reset = () => { down.current = {}; last.current = 0; hold.current = []; gap.current = []; setRes(null); setText(''); };

  return (
    <section className="fp">
      <h2 className="sec-h">Your typing</h2>
      <p className="lede">Type this sentence: <code>{SENTENCE}</code></p>
      <input className="pick" value={text} onKeyDown={onDown} onKeyUp={onUp} onChange={onChange} autoComplete="off" spellCheck={false} aria-label="Type the sentence" />
      {res && (
        <ul className="facts">
          <li><span>Key hold</span><b className="fp-v">{res.hm} ms on average, give or take {res.hs} ms</b></li>
          <li><span>Gap between keys</span><b className="fp-v">{res.gm} ms on average, give or take {res.gs} ms</b></li>
          <li><span>What it means</span><span className="muted">These numbers, per key pair, are steady enough to tell people apart. Anti-fraud scripts on banking and shopping sites record them on every form, so a stolen password typed by someone else looks wrong, and so does a new account typed by you. <button type="button" onClick={reset}>[again]</button></span></li>
        </ul>
      )}
    </section>
  );
}
