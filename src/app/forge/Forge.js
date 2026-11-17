'use client';

import { useRef, useState, useEffect } from 'react';
import { createForge } from '@/lib/forge/index';
import { parse } from '@/lib/forge/parser';
import './forge.css';

const HEAP = 1 << 20;
const SEED = `var xs = [1, 2, 3];
var o = { name: "forge", n: xs.length };
print(o.name);
print(o.n + 40);
`;

const hex = (n) => '0x' + n.toString(16).padStart(5, '0');

export default function Forge() {
  const forgeRef = useRef(null);
  const outRef = useRef(null);
  const [src, setSrc] = useState(SEED);
  const [lines, setLines] = useState([]);
  const [rows, setRows] = useState([]);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);

  const refresh = (f) => {
    setRows(
      f.objects().slice(0, 60).map((o) => ({
        offset: o.offset,
        size: o.size,
        kind: f.maps.get(o.mapId)?.kind ?? 'map ' + o.mapId,
      })),
    );
    setUsed(f.snapshot().length);
  };

  const run = () => {
    const out = [];
    try {
      forgeRef.current ??= createForge({ parse, heapBytes: HEAP });
      const f = forgeRef.current;
      const r = f.run(src);
      for (const l of r.log ?? []) out.push({ t: String(l) });
      if (!r.ok) out.push({ t: String(r.error?.message ?? r.error), err: true });
      refresh(f);
    } catch (e) {
      out.push({ t: String(e?.message ?? e), err: true });
    }
    setLines((prev) => [...prev, ...out].slice(-200));
  };

  const reset = () => {
    forgeRef.current = null;
    setSrc(SEED);
    setLines([]);
    setRows([]);
    setUsed(0);
  };

  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b, value } = e.target;
    const ta = e.target;
    setSrc(value.slice(0, a) + '  ' + value.slice(b));
    requestAnimationFrame(() => ta.setSelectionRange(a + 2, a + 2));
  };

  return (
    <div className="forge">
      <label className="forge-label" htmlFor="forge-src">Source</label>
      <textarea
        id="forge-src"
        className="forge-editor"
        value={src}
        onChange={(e) => setSrc(e.target.value)}
        onKeyDown={onKey}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={12}
      />
      <div className="forge-actions">
        <button type="button" onClick={run} aria-label="Run the program">Run</button>
        <button type="button" onClick={reset} aria-label="Reset the editor, output and heap">Reset</button>
      </div>

      <h2 className="forge-label" id="forge-out-h">Output</h2>
      <pre className="forge-out" ref={outRef} aria-live="polite" aria-labelledby="forge-out-h" tabIndex={0}>
        {lines.map((l, i) => (
          <div key={i} className={l.err ? 'forge-err' : undefined}>{l.t}</div>
        ))}
      </pre>

      <h2 className="forge-label" id="forge-cage-h">Cage</h2>
      <div
        className="forge-cage"
        role="meter"
        aria-labelledby="forge-cage-h"
        aria-valuemin={0}
        aria-valuemax={HEAP}
        aria-valuenow={used}
      >
        <div className="forge-cage-fill" style={{ width: (used / HEAP) * 100 + '%' }} />
      </div>
      <p className="forge-muted">{used.toLocaleString()} of {HEAP.toLocaleString()} bytes</p>

      <h2 className="forge-label" id="forge-heap-h">Heap</h2>
      <table className="forge-heap" aria-labelledby="forge-heap-h">
        <thead>
          <tr><th scope="col">offset</th><th scope="col">kind</th><th scope="col">size</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.offset}><td>{hex(r.offset)}</td><td>{r.kind}</td><td>{r.size}</td></tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="forge-muted">Run a program to fill the heap.</p>}
    </div>
  );
}
