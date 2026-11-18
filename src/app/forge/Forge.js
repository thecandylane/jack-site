'use client';

import { useEffect, useRef, useState } from 'react';
import './forge.css';

// The judge runs on the server (src/app/api/forge/route.js): the VM is an interpreter, so the whole
// cage, both bugs and the host table live in the Worker. This island only sends source and draws
// what came back — the flag is never in this bundle.

const hex = (n) => '0x' + n.toString(16).padStart(5, '0');

export default function Forge() {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('pollution');
  const [src, setSrc] = useState('');
  const [lines, setLines] = useState([]);
  const [rows, setRows] = useState([]);
  const [used, setUsed] = useState(0);
  const [cage, setCage] = useState(1 << 16);
  const [verdict, setVerdict] = useState(null);
  const [defended, setDefended] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const outRef = useRef(null);

  const lab = labs.find((l) => l.id === labId);

  useEffect(() => {
    fetch('/api/forge')
      .then((r) => r.json())
      .then((d) => {
        const next = d.labs ?? [];
        setLabs(next);
        if (next.length) setSrc(next[0].seed ?? '');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [lines]);

  const pick = (id) => {
    const next = labs.find((l) => l.id === id);
    setLabId(id);
    setSrc(next?.seed ?? '');
    setLines([]);
    setRows([]);
    setVerdict(null);
    setUsed(0);
    setHintsUsed(0);
  };

  const hint = async () => {
    const n = hintsUsed + 1;
    const res = await fetch(`/api/forge/hint?lab=${encodeURIComponent(labId)}&n=${n}`)
      .then((r) => r.json())
      .catch(() => ({ hint: null }));
    if (!res.hint) return;
    setLines((prev) => [...prev, { t: `hint ${n}: ${res.hint}`, muted: true }].slice(-200));
    setHintsUsed(n);
  };

  const run = async () => {
    setBusy(true);
    setVerdict(null);
    const res = await fetch('/api/forge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lab: labId, source: src, defend: defended, hintsUsed }),
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
    setVerdict({
      solved: res.solved,
      why: res.why,
      flag: res.flag,
      fix: res.fix,
      after: res.after,
      hintsUsed: res.hintsUsed ?? hintsUsed,
    });
  };

  const reset = () => {
    setSrc(lab?.seed ?? '');
    setLines([]);
    setRows([]);
    setVerdict(null);
    setUsed(0);
    setHintsUsed(0);
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

      {lab?.brief && <p className="forge-brief" id="forge-brief">{lab.brief}</p>}

      <label className="forge-label" htmlFor="forge-src">Source · {lab?.language === 'html' ? 'HTML' : 'JS'}</label>
      <textarea
        id="forge-src"
        className="forge-editor"
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        onKeyDown={onKey}
        spellCheck={false}
        aria-describedby={lab?.brief ? 'forge-brief' : undefined}
      />

      <div className="forge-actions">
        <button type="button" onClick={run} disabled={busy} aria-label="Run the program">{busy ? 'Running…' : 'Run'}</button>
        <button type="button" onClick={hint} disabled={hintsUsed >= (lab?.hintCount ?? 0)} aria-label="Reveal the next hint">
          hint{hintsUsed ? ` ${hintsUsed}/${lab?.hintCount ?? 0}` : ''}
        </button>
        <button type="button" onClick={reset} aria-label="Reset the editor, output and heap">Reset</button>
        <label className="forge-check">
          <input type="checkbox" checked={defended} onChange={(e) => setDefended(e.target.checked)} />
          run against the fix
        </label>
      </div>

      <label className="forge-label" htmlFor="forge-out">Output</label>
      <div id="forge-out" className="forge-out" aria-live="polite" ref={outRef}>
        {lines.map((l, i) => <p key={i} className={l.err ? 'forge-err' : l.muted ? 'forge-muted-line' : undefined}>{l.t}</p>)}
      </div>

      {verdict && (
        <div className="forge-verdict">
          <p className={verdict.solved ? 'forge-ok' : 'forge-why'}>
            {verdict.solved
              ? `solved. ${verdict.flag ?? verdict.why}${verdict.hintsUsed ? ` (${verdict.hintsUsed} hint${verdict.hintsUsed === 1 ? '' : 's'})` : ''}`
              : verdict.why}
          </p>
          {verdict.after && (
            <p className="forge-why">
              after the fix: {verdict.after.solved ? 'still solved' : verdict.after.error ?? verdict.after.why}
              {verdict.after.log?.length ? ` — ${verdict.after.log.slice(0, 2).join(' · ')}` : ''}
            </p>
          )}
          {verdict.fix && (
            <details className="hdrs forge-fix">
              <summary>{verdict.fix.title}</summary>
              <p className="forge-why">{verdict.fix.note}</p>
              <pre>{verdict.fix.code}</pre>
            </details>
          )}
        </div>
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
