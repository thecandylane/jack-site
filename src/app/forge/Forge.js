'use client';

import { useEffect, useRef, useState } from 'react';
import './forge.css';

// Sends source to /api/forge, where the engine and the flags live, and draws what comes back.

const SEED = {
  pollution: `// merge(target, source) · exec(opts) reads opts.shell · read(view)
var opts = {};
var view = exec(opts);
print(read(view));
`,
  bounds: `// xs is ready, with a canary right after it
xs.length = 4;
xs[0] = 1;
`,
  escape: `// open() returns a view on handle 1
var xs = [1, 2, 3, 4];
var v = open();
print(read(v));
`,
};

const hex = (n) => '0x' + n.toString(16).padStart(5, '0');

export default function Forge() {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('pollution');
  const [src, setSrc] = useState(SEED.pollution);
  const [lines, setLines] = useState([]);
  const [rows, setRows] = useState([]);
  const [used, setUsed] = useState(0);
  const [cage, setCage] = useState(1 << 16);
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const outRef = useRef(null);

  useEffect(() => {
    fetch('/api/forge').then((r) => r.json()).then((d) => setLabs(d.labs ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [lines]);

  const brief = labs.find((l) => l.id === labId)?.brief ?? '';

  const pick = (id) => {
    setLabId(id);
    setSrc(SEED[id] ?? '');
    setLines([]);
    setRows([]);
    setVerdict(null);
    setUsed(0);
  };

  const run = async () => {
    setBusy(true);
    setVerdict(null);
    const res = await fetch('/api/forge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lab: labId, source: src }),
    }).then((r) => r.json()).catch(() => ({ error: 'The forge did not answer.' }));
    setBusy(false);
    if (res.error && !res.ok) {
      setLines((prev) => [...prev, { t: res.error, err: true }].slice(-200));
      return;
    }
    const next = (res.log ?? []).map((t) => ({ t }));
    if (!res.ok) next.push({ t: res.error ?? 'stopped', err: true });
    setLines((prev) => [...prev, ...next].slice(-200));
    setRows(res.objects ?? []);
    setUsed(res.used ?? 0);
    setCage(res.heapBytes ?? 1 << 16);
    setVerdict({ solved: res.solved, why: res.why, flag: res.flag });
  };

  const reset = () => {
    setSrc(SEED[labId] ?? '');
    setLines([]);
    setRows([]);
    setVerdict(null);
    setUsed(0);
  };

  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = `${src.slice(0, a)}  ${src.slice(b)}`;
    setSrc(next);
    requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
  };

  return (
    <div className="forge">
      <label className="forge-label" htmlFor="forge-lab">Lab</label>
      <select id="forge-lab" className="forge-lab" value={labId} onChange={(e) => pick(e.target.value)}>
        {labs.length === 0 && <option value="pollution">pollution</option>}
        {labs.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>

      {brief && <p className="forge-brief" id="forge-brief">{brief}</p>}

      <label className="forge-label" htmlFor="forge-src">Source</label>
      <textarea
        id="forge-src"
        className="forge-editor"
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        onKeyDown={onKey}
        spellCheck={false}
        aria-describedby={brief ? 'forge-brief' : undefined}
      />

      <div className="forge-actions">
        <button type="button" onClick={run} disabled={busy} aria-label="Run the program">{busy ? 'Running…' : 'Run'}</button>
        <button type="button" onClick={reset} aria-label="Reset the editor, output and heap">Reset</button>
      </div>

      <label className="forge-label" htmlFor="forge-out">Output</label>
      <div id="forge-out" className="forge-out" aria-live="polite" ref={outRef}>
        {lines.map((l, i) => <p key={i} className={l.err ? 'forge-err' : undefined}>{l.t}</p>)}
      </div>

      {verdict && (
        <p className={verdict.solved ? 'forge-ok' : 'forge-why'}>
          {verdict.solved ? `solved. ${verdict.flag ?? verdict.why}` : verdict.why}
        </p>
      )}

      <p className="forge-muted">
        {used.toLocaleString()} of {cage.toLocaleString()} bytes
      </p>
      <div className="forge-cage" role="img" aria-label={`${used} of ${cage} bytes used`}>
        <div className="forge-cage-fill" style={{ width: `${Math.min(100, (used / cage) * 100)}%` }} />
      </div>

      <label className="forge-label" htmlFor="forge-heap">Heap</label>
      <table className="forge-heap" id="forge-heap">
        <thead><tr><th>offset</th><th>kind</th><th>size</th></tr></thead>
        <tbody>
          {rows.map((o) => <tr key={o.offset}><td>{hex(o.offset)}</td><td>{o.kind}</td><td>{o.size}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
