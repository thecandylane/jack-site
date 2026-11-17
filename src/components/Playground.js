'use client';

import { useEffect, useRef, useState } from 'react';

// An editable JavaScript exercise for posts. The reader's code runs in a throwaway Web Worker: it can't touch the
// page, its network APIs are removed, and it is stopped after two seconds. `tests` runs after the reader's code
// in the same scope, using test(name, fn) and eq(actual, expected). Code never comes from the URL or storage,
// only from the post and the reader's own typing.
const HARNESS = `
const out = [], show = (v) => (typeof v === 'string' ? v : JSON.stringify(v));
console.log = console.info = console.warn = console.error = (...a) => out.push({ kind: 'log', text: a.map(show).join(' ') });
const results = [];
function eq(a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('got ' + show(a) + ', expected ' + show(b)); }
function test(name, fn) { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, why: e.message }); } }
self.onmessage = (e) => {
  for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches']) self[k] = undefined;
  try { (0, eval)(e.data); } catch (err) { out.push({ kind: 'err', text: String(err) }); }
  postMessage({ out, results });
};`;
const LIMIT = 2000;
let workerUrl;

export default function Playground({ code, tests = '', title = 'playground', lines }) {
  const start = code.replace(/^\n+|\s+$/g, '') + '\n';
  const host = useRef(null), view = useRef(null);
  const [ready, setReady] = useState(false);
  const [res, setRes] = useState(null);

  useEffect(() => {
    let gone = false;
    Promise.all([import('codemirror'), import('@codemirror/lang-javascript'), import('@codemirror/language'), import('@lezer/highlight')])
      .then(([{ EditorView, basicSetup }, { javascript }, { HighlightStyle, syntaxHighlighting }, { tags: t }]) => {
        if (gone) return;
        const look = EditorView.theme({
          '&': { color: 'var(--fg)', backgroundColor: 'transparent', fontSize: '13.5px' },
          '.cm-content': { fontFamily: 'var(--mono)', caretColor: 'var(--accent)', padding: '12px 0' },
          '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
          '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--muted)', border: 'none' },
          '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)' },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--accent) 22%, transparent) !important' },
          '&.cm-focused': { outline: 'none' },
          '.cm-cursor': { borderLeftColor: 'var(--accent)' },
          '.cm-matchingBracket': { backgroundColor: 'transparent', outline: '1px solid var(--muted)' },
        }, { dark: true });
        const colors = HighlightStyle.define([
          { tag: [t.keyword, t.operatorKeyword, t.controlKeyword], color: 'var(--accent)' },
          { tag: [t.string, t.regexp, t.special(t.string)], color: 'var(--key)' },
          { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--key)' },
          { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--muted)', fontStyle: 'italic' },
          { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--fg)', fontWeight: 'bold' },
          { tag: [t.punctuation, t.bracket, t.operator], color: 'var(--muted)' },
        ]);
        host.current.textContent = '';
        view.current = new EditorView({ doc: start, extensions: [basicSetup, EditorView.lineWrapping, EditorView.contentAttributes.of({ 'aria-label': title ?? 'Code editor' }), javascript(), look, syntaxHighlighting(colors)], parent: host.current });
        setReady(true);
      });
    return () => { gone = true; view.current?.destroy(); view.current = null; };
  }, [start]);

  const run = () => {
    workerUrl ??= URL.createObjectURL(new Blob([HARNESS], { type: 'text/javascript' }));
    const w = new Worker(workerUrl);
    const stop = setTimeout(() => {
      w.terminate();
      setRes({ out: [{ kind: 'err', text: `Stopped after ${LIMIT / 1000} seconds. Is there a loop that never ends?` }], results: [] });
    }, LIMIT);
    w.onmessage = (e) => { clearTimeout(stop); w.terminate(); setRes(e.data); };
    w.postMessage(`${view.current.state.doc.toString()}\n;\n${tests}`);
  };
  const reset = () => {
    view.current.dispatch({ changes: { from: 0, to: view.current.state.doc.length, insert: start } });
    setRes(null);
  };

  const passed = res?.results.filter((r) => r.ok).length ?? 0;
  const total = res?.results.length ?? 0;
  return (
    <figure className="play">
      <figcaption>
        <span>{title}</span>
        <span className="play-btns">
          <button type="button" onClick={reset} disabled={!ready}>reset</button>
          <button type="button" onClick={run} disabled={!ready} className="go">run ▸</button>
        </span>
      </figcaption>
      <div ref={host} className="play-ed" style={lines ? { minHeight: `${lines * 1.6}em` } : undefined}>
        <pre>{start}</pre>
      </div>
      {res && (
        <div className="play-out" role="status">
          {total > 0 && <p className={passed === total ? 'pass' : 'fail'}>{passed === total ? `All ${total} tests pass.` : `${passed} of ${total} tests pass.`}</p>}
          {res.results.map((r) => <p key={r.name} className={r.ok ? 'ok' : 'no'}>{r.ok ? '✓' : '✗'} {r.name}{r.ok ? '' : `: ${r.why}`}</p>)}
          {res.out.map((o, i) => <p key={i} className={o.kind}>{o.kind === 'err' ? '! ' : '> '}{o.text}</p>)}
        </div>
      )}
    </figure>
  );
}
