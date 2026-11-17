'use client';

import { useRef, useState } from 'react';
import { disassemble, parseHex, wordsFromBytes, SAMPLES } from '@/lib/riscv';

// Hex words or a .bin file in, RV32I assembly out. Everything happens in the browser: a picked file is read
// locally, turned into the same hex words you could have typed, and nothing is sent anywhere.
const MAX = 64 * 1024;
const h = (n, pad) => n.toString(16).padStart(pad, '0');

export default function RiscvDisasm() {
  const names = Object.keys(SAMPLES);
  const input = useRef(null);
  const [pick, setPick] = useState(names[0]);
  const [text, setText] = useState(SAMPLES[names[0]]);
  const [note, setNote] = useState('');
  const [res, setRes] = useState(null);

  const run = (t = text) => {
    try { setRes({ rows: disassemble(parseHex(t)) }); } catch (e) { setRes({ error: e.message }); }
  };
  const choose = (n) => { setPick(n); setText(SAMPLES[n]); setNote(''); setRes(null); };
  const open = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX) return setRes({ error: 'That file is over 64 KB; pick a smaller one.' });
    const { words, extra } = wordsFromBytes(new Uint8Array(await f.arrayBuffer()));
    const t = words.map((w) => h(w, 8)).join('\n');
    setPick(''); setText(t); run(t);
    setNote(`${f.name}, ${f.size.toLocaleString()} bytes, read in your browser and never uploaded.${extra ? ` The last ${extra} byte${extra > 1 ? 's' : ''} didn't fill a word and ${extra > 1 ? 'were' : 'was'} left out.` : ''}`);
  };
  const unknown = res?.rows?.filter((r) => !r.format).length ?? 0;
  const wide = res?.rows?.length ? Math.max(4, h(res.rows.at(-1).addr, 0).length) : 4;

  return (
    <figure className="play tool">
      <figcaption>
        <span>rv32i disassembler · machine code in, assembly out</span>
        <span className="play-btns"><button type="button" className="go" onClick={() => run()}>disassemble ▸</button></span>
      </figcaption>
      <div className="yara-data">
        <div className="tool-form">
          <select value={pick} onChange={(e) => choose(e.target.value)} aria-label="sample">
            {!pick && <option value="">your input</option>}
            {names.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <button type="button" onClick={() => input.current?.click()}>open a .bin file</button>
          <input ref={input} type="file" onChange={open} hidden />
        </div>
        {note && <p className="muted small">{note}</p>}
      </div>
      <textarea className="yara-in" value={text} onChange={(e) => { setText(e.target.value); setPick(''); setNote(''); setRes(null); }} spellCheck="false" rows={9}
        aria-label="32-bit hex words, with or without 0x, separated by spaces or new lines" />
      {res && (
        <div className="play-out" role="status">
          {res.error && <p className="err">! {res.error}</p>}
          {res.rows && (
            <>
              <p className={unknown ? 'fail' : 'pass'}>
                {res.rows.length === 0 ? 'Nothing to decode. Paste some 32-bit hex words.'
                  : `${res.rows.length} word${res.rows.length > 1 ? 's' : ''}${unknown ? `, ${unknown} not RV32I` : ''}. Columns: address, word, format, assembly.`}
              </p>
              {res.rows.map((r) => (
                <p key={r.addr} className={r.format ? 'warn' : 'no'}>
                  <span className="muted">{h(r.addr, wide)}  {h(r.word, 8)}  {r.format || '?'}</span>  {r.asm}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </figure>
  );
}
