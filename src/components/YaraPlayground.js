'use client';

import { useRef, useState } from 'react';
import { RULES, SAMPLES } from '@/content/yara';

// YARA-X, VirusTotal's rule engine, compiled to WebAssembly and run in the browser (@virustotal/yara-x).
// Rules and data never leave the page: a file you pick is read locally. The 6 MB engine loads on the first scan.
const MAX = 10 * 1024 * 1024;
let engine;
const load = () => (engine ??= import('@virustotal/yara-x').then(async (m) => { await m.default(); return m; }));

export default function YaraPlayground({ rules = RULES, samples = SAMPLES }) {
  const names = Object.keys(samples);
  const [src, setSrc] = useState(rules.trim() + '\n');
  const [pick, setPick] = useState(names[0]);
  const [data, setData] = useState(samples[names[0]]);
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const input = useRef(null);

  const choose = (name) => { setPick(name); setData(samples[name]); setFile(null); setRes(null); };
  const open = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX) return setRes({ error: 'That file is over 10 MB; pick a smaller one.' });
    setFile({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
    setRes(null);
  };

  async function scan() {
    setRes({ busy: true });
    let compiler, built, scanner;
    try {
      const { Compiler } = await load();
      compiler = new Compiler();
      try { compiler.addSource(src); } catch (err) { return setRes({ error: String(err.message ?? err) }); }
      const warnings = compiler.warnings;
      built = compiler.build(); compiler = null; // build() consumes the compiler
      scanner = built.scanner();
      scanner.setTimeoutMs(2000);
      scanner.setMaxMatchesPerPattern(20);
      const bytes = file?.bytes ?? new TextEncoder().encode(data);
      const out = scanner.scan(bytes);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      setRes({
        size: bytes.length, warnings,
        matches: out.matches.map((m) => ({
          rule: m.identifier,
          hits: m.patterns.flatMap((p) => p.matches.map((h) => ({ id: p.identifier, at: h.offset, text: file ? null : text.slice(h.offset, h.offset + Math.min(h.length, 80)) }))),
        })),
      });
    } catch (err) {
      setRes({ error: String(err.message ?? err) });
    } finally {
      scanner?.free?.(); built?.free?.(); compiler?.free?.();
    }
  }

  return (
    <figure className="play tool">
      <figcaption>
        <span>yara-x · write a rule, scan a sample</span>
        <span className="play-btns">
          <button type="button" onClick={() => { setSrc(rules.trim() + '\n'); setRes(null); }}>reset</button>
          <button type="button" className="go" onClick={scan} disabled={res?.busy}>{res?.busy ? 'scanning…' : 'scan ▸'}</button>
        </span>
      </figcaption>
      <textarea className="yara-src" value={src} onChange={(e) => setSrc(e.target.value)} spellCheck="false" aria-label="YARA rules" rows={14} />
      <div className="yara-data">
        <div className="tool-form">
          <select value={file ? '' : pick} onChange={(e) => choose(e.target.value)} aria-label="sample">
            {file && <option value="">{file.name}</option>}
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="button" onClick={() => input.current?.click()}>scan a file of yours</button>
          <input ref={input} type="file" onChange={open} hidden />
        </div>
        {file
          ? <p className="muted small">{file.name}, {file.bytes.length.toLocaleString()} bytes, read in your browser and never uploaded.</p>
          : <textarea className="yara-in" value={data} onChange={(e) => setData(e.target.value)} spellCheck="false" aria-label="data to scan" rows={9} />}
      </div>
      {res && !res.busy && (
        <div className="play-out" role="status">
          {res.error && <p className="err">! {res.error}</p>}
          {res.matches && (
            <>
              <p className={res.matches.length ? 'fail' : 'pass'}>{res.matches.length ? `${res.matches.length} rule${res.matches.length > 1 ? 's' : ''} matched` : 'No rule matched'} in {res.size.toLocaleString()} bytes.</p>
              {res.matches.map((m) => (
                <div key={m.rule}>
                  <p className="no">✗ {m.rule}</p>
                  {m.hits.map((h, i) => <p key={i} className="ok">  {h.id} at byte {h.at}{h.text ? `: ${h.text}` : ''}</p>)}
                </div>
              ))}
              {res.warnings?.map((w, i) => <p key={i} className="warn">! {w}</p>)}
            </>
          )}
        </div>
      )}
    </figure>
  );
}
