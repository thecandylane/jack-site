'use client';

import { useState } from 'react';

const BUDGET_MS = 2000;
const START = `// try: while (true) {}
let a = [];
for (let i = 0; i < 1000; i++) a.push({ i });
a.length`;

let engine; // cached QuickJSWASMModule

async function load() {
  if (!engine) {
    const { getQuickJS } = await import('quickjs-emscripten');
    engine = await getQuickJS();
  }
  return engine;
}

export default function QuickJS() {
  const [src, setSrc] = useState(START);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);

  async function run() {
    setBusy(true);
    setOut(null);
    let rt, ctx;
    try {
      const qjs = await load();
      rt = qjs.newRuntime();
      ctx = rt.newContext();
      const deadline = Date.now() + BUDGET_MS;
      let interrupted = false;
      // The engine runs synchronously on this thread, so a button cannot land mid-run: the
      // deadline is the only stop that exists, and the page says so.
      rt.setInterruptHandler(() => {
        interrupted = Date.now() > deadline;
        return interrupted;
      });
      const t0 = performance.now();
      const r = ctx.evalCode(src, 'guest.js');
      const ms = Math.round(performance.now() - t0);
      let value, error;
      if (r.error) {
        error = ctx.dump(r.error);
        r.error.dispose();
      } else {
        value = ctx.dump(r.value);
        r.value.dispose();
      }
      rt.setInterruptHandler(undefined);
      const memText = rt.dumpMemoryUsage();
      const h = rt.computeMemoryUsage();
      const mem = ctx.dump(h);
      h.dispose();
      setOut({
        status: interrupted ? 'interrupted' : error ? 'error' : 'ok',
        value,
        error: interrupted ? `no result in ${BUDGET_MS / 1000} s` : show(error),
        ms,
        mem,
        memText,
      });
    } catch (e) {
      setOut({ status: 'error', error: String(e && e.message ? e.message : e) });
    } finally {
      ctx?.dispose();
      rt?.dispose();
      setBusy(false);
    }
  }

  return (
    <section className="qjs-box">
      <textarea
        className="qjs-ed"
        value={src}
        spellCheck={false}
        aria-label="JavaScript to run in QuickJS"
        onChange={(e) => setSrc(e.target.value)}
      />
      <div className="qjs-bar">
        <button onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run'}</button>
        <span className="qjs-note">{BUDGET_MS / 1000} s budget, enforced by the engine&apos;s interrupt handler</span>
      </div>
      {out && (
        <div className="qjs-out" aria-live="polite">
          <p className={`qjs-status qjs-${out.status}`}>
            {out.status}
            {out.ms != null && ` · ${out.ms} ms`}
          </p>
          <pre>{out.status === 'ok' ? show(out.value) : out.error}</pre>
          {out.mem && (
            <>
              <h2 className="qjs-sub">Stats</h2>
              <p className="qjs-note">
                Bytecode dump: not available. quickjs-emscripten does not expose one, so you see the evaluated value
                above and the engine&apos;s own memory report below.
              </p>
              <dl className="qjs-stats">
                <dt>memory_used_size</dt><dd>{out.mem.memory_used_size} bytes</dd>
                <dt>malloc_count</dt><dd>{out.mem.malloc_count}</dd>
                <dt>obj_count</dt><dd>{out.mem.obj_count}</dd>
                <dt>atom_count</dt><dd>{out.mem.atom_count}</dd>
                <dt>str_count</dt><dd>{out.mem.str_count}</dd>
                <dt>js_func_code_size</dt><dd>{out.mem.js_func_code_size} bytes</dd>
              </dl>
              <pre className="qjs-mem">{out.memText}</pre>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function show(v) {
  return typeof v === 'string' ? v : (JSON.stringify(v, null, 2) ?? 'undefined');
}
