'use client';

import { useRef, useState } from 'react';
import TILES from '../../public/autodraw/naip/naip.json';
import { fieldOutline, area, acres } from '@/lib/mask2poly';

// Click a field on a USDA NAIP aerial and a segmentation model running in this browser outlines it.
// Built on transformers.js (gh:huggingface/transformers.js, Apache-2.0): SamModel and AutoProcessor as in its
// modeling_sam.js example, with the image embedding computed once per tile and reused for every click, the way
// its segment-anything example does. Two models, self-hosted in public/autodraw/models/ and pinned to one revision each:
// MobileSAM (gh:ChaoningZhang/MobileSAM, Apache-2.0) as exported by huggingface.co/HRusby/mobilesam-onnx @ c67a738, and
// SlimSAM (gh:czg1225/SlimSAM, Apache-2.0) as exported by huggingface.co/Xenova/slimsam-77-uniform @ 5850ab4.
// Everything loads from /autodraw/ on this site; nothing is uploaded.
// ponytail: the model runs on the main thread (about 3 s per new tile, 0.2 s per click); move it to a module worker
// with a Trusted Types policy if the page ever needs to stay responsive while a tile is read.
const MODELS = [
  // bytes: vision_encoder_quantized.onnx + prompt_encoder_mask_decoder_quantized.onnx
  { id: 'HRusby/mobilesam-onnx', name: 'MobileSAM', bytes: 14106884 + 4675484 },
  { id: 'Xenova/slimsam-77-uniform', name: 'SlimSAM', bytes: 8882165 + 4903810 },
];
const RUNTIME_MB = 14; // the onnxruntime-web wasm, fetched once for both models
const SIDE = 1024; // every tile is 1024 x 1024 pixels

let onBytes = () => {};
let runtime; // one transformers.js import and setup per page
const setup = () => (runtime ??= (async () => {
  const t = await import('@huggingface/transformers');
  t.env.allowRemoteModels = false;
  t.env.allowLocalModels = true;
  t.env.localModelPath = '/autodraw/models/';
  t.env.useWasmCache = false; // otherwise the runtime is imported from a blob: URL, which the CSP refuses
  Object.assign(t.env.backends.onnx.wasm, {
    wasmPaths: { mjs: '/autodraw/ort/ort-wasm-simd-threaded.mjs', wasm: '/autodraw/ort/ort-wasm-simd-threaded.wasm' },
    numThreads: 1, // the page is not cross-origin isolated, so no SharedArrayBuffer threads
    proxy: false,
  });
  // Count model bytes as they stream in. (A progress_callback would make transformers.js fetch each file twice.)
  const base = t.env.fetch;
  t.env.fetch = async (...args) => {
    const r = await base(...args);
    if (!r.body || !String(args[0]).endsWith('.onnx')) return r;
    const count = new TransformStream({ transform(chunk, c) { onBytes(chunk.length); c.enqueue(chunk); } });
    return new Response(r.body.pipeThrough(count), r);
  };
  return t;
})().catch((e) => { runtime = undefined; throw e; }));

const libs = {}; // model id -> Promise<{ model, processor, Tensor, RawImage }>
const load = (m, onProgress) => (libs[m.id] ??= (async () => {
  const t = await setup();
  let got = 0;
  onBytes = (n) => { got += n; onProgress(Math.min(99, Math.round((100 * got) / m.bytes))); };
  const [model, processor] = await Promise.all([
    t.SamModel.from_pretrained(m.id, { dtype: 'q8', device: 'wasm' }),
    t.AutoProcessor.from_pretrained(m.id),
  ]);
  return { model, processor, Tensor: t.Tensor, RawImage: t.RawImage };
})().catch((e) => { delete libs[m.id]; throw e; }));
const mbFor = (m) => Math.round(m.bytes / 1e6) + (runtime ? 0 : RUNTIME_MB);

const embeddings = {}; // `${model id} ${slug}` -> { inputs, emb }, computed once per model and tile
const paint = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;

export default function AutoDraw() {
  const [tile, setTile] = useState(TILES[0]);
  const [m, setM] = useState(MODELS[0]);
  const [loaded, setLoaded] = useState([]); // model ids ready to run
  const ready = loaded.includes(m.id);
  const [busy, setBusy] = useState(false);
  const [points, setPoints] = useState([]); // [{ x, y, include }] in tile pixels
  const [ring, setRing] = useState(null);
  const [say, setSay] = useState('');
  const run = useRef(0);

  async function loadModel() {
    if (busy) return;
    setBusy(true);
    setSay(`Downloading ${m.name} (${mbFor(m)} MB)…`);
    const t0 = performance.now();
    try {
      await load(m, (pct) => setSay(`Downloading ${m.name}: ${pct}%`));
      setLoaded((l) => [...l, m.id]);
      setSay(`${m.name} ready in ${secs(performance.now() - t0)}. Click a field or press Try a Sample Point.`);
    } catch (e) {
      setSay(`The model did not load: ${e.message}`);
    }
    setBusy(false);
  }

  async function segment(t, pts, mm = m) {
    const id = ++run.current;
    if (!pts.some((p) => p.include)) { setRing(null); setSay(pts.length ? 'Add a point inside a field.' : ''); return; }
    setBusy(true);
    try {
      const { model, processor, Tensor, RawImage } = await libs[mm.id];
      const key = `${mm.id} ${t.slug}`;
      let e = embeddings[key];
      if (!e) {
        setSay('Reading the image…');
        await paint();
        const t0 = performance.now();
        const inputs = await processor(await RawImage.fromURL(`/autodraw/naip/${t.slug}.jpg`));
        e = embeddings[key] = { inputs, emb: await model.get_image_embeddings(inputs) };
        e.ms = performance.now() - t0;
      }
      const t1 = performance.now();
      const [h, w] = e.inputs.reshaped_input_sizes[0];
      const out = await model({
        ...e.emb,
        input_points: new Tensor('float32', pts.flatMap((p) => [(p.x / SIDE) * w, (p.y / SIDE) * h]), [1, 1, pts.length, 2]),
        input_labels: new Tensor('int64', pts.map((p) => BigInt(p.include ? 1 : 0)), [1, 1, pts.length]),
      });
      const [masks] = await processor.post_process_masks(out.pred_masks, e.inputs.original_sizes, e.inputs.reshaped_input_sizes);
      const scores = out.iou_scores.data;
      const best = scores.indexOf(Math.max(...scores));
      const n = SIDE * SIDE;
      const poly = fieldOutline(masks.data.subarray(best * n, (best + 1) * n), SIDE, SIDE, 3);
      if (id !== run.current) return;
      const ac = acres(area(poly), t.mpp);
      setRing(poly.length >= 3 ? { poly, ac } : null);
      const first = e.ms ? ` The image took ${secs(e.ms)}.` : '';
      e.ms = 0;
      setSay(poly.length >= 3 ? `Outlined ${ac.toFixed(1)} acres in ${secs(performance.now() - t1)}.${first}` : 'No field found there. Try another point.');
    } catch (err) {
      setSay(`Something went wrong: ${err.message}`);
    }
    setBusy(false);
  }

  const add = (x, y, include) => {
    if (!ready || busy) return setSay(ready ? 'Still working on the last point.' : 'Load the model first.');
    const next = [...points, { x, y, include }];
    setPoints(next);
    segment(tile, next);
  };
  const click = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    add(Math.round(((e.clientX - r.left) / r.width) * SIDE), Math.round(((e.clientY - r.top) / r.height) * SIDE), !(e.shiftKey || e.altKey));
  };
  const change = (pts) => { if (busy) return setSay('Still working on the last point.'); setPoints(pts); segment(tile, pts); };
  const pick = (t) => { run.current++; setTile(t); setPoints([]); setRing(null); setSay(''); };
  // Switching models keeps the points and redraws them with the other model, so the two outlines can be compared.
  const swap = (next) => {
    if (busy || next === m) return;
    run.current++; setM(next); setRing(null); setSay('');
    if (!loaded.includes(next.id)) setPoints([]);
    else if (points.length) segment(tile, points, next);
  };

  return (
    <figure className="play tool autodraw">
      <figcaption style={{ flexWrap: 'wrap' }}>
        <span>Auto-Draw Demo</span>
        <span className="play-btns">
          {/* one button, never disabled, so keyboard focus stays put while it works; add() and load() refuse repeats */}
          <button type="button" className="go" onClick={ready ? () => add(...tile.sample, true) : loadModel}>{ready ? 'Try a Sample Point' : `Load ${m.name} (${mbFor(m)} MB)`}</button>
          <button type="button" onClick={() => change(points.slice(0, -1))} disabled={!points.length}>Undo</button>
          <button type="button" onClick={() => change([])} disabled={!points.length}>Clear</button>
        </span>
      </figcaption>
      <div className="tool-form" role="group" aria-label="Model">
        {MODELS.map((x) => (
          <button key={x.id} type="button" aria-pressed={x === m} className={x === m ? 'go' : undefined} onClick={() => swap(x)}>{x.name}</button>
        ))}
      </div>
      <div className="tool-form" role="group" aria-label="Aerial image">
        {TILES.map((t) => (
          <button key={t.slug} type="button" aria-pressed={t === tile} className={t === tile ? 'go' : undefined} onClick={() => pick(t)} disabled={busy}>{t.label}</button>
        ))}
      </div>
      <div onClick={click} style={{ position: 'relative', maxWidth: 'min(100%, 70vh)', margin: '0 auto', cursor: ready ? 'crosshair' : 'default', lineHeight: 0, touchAction: 'manipulation' }}>
        <img src={`/autodraw/naip/${tile.slug}.jpg`} alt={`USDA NAIP aerial photo, ${tile.year}: ${tile.label}, Louisiana`} width={SIDE} height={SIDE} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" draggable="false" />
        <svg viewBox={`0 0 ${SIDE} ${SIDE}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {ring && (
            <>
              <polygon points={ring.poly.join(' ')} fill="color-mix(in srgb, var(--fm-accent, var(--accent)) 28%, transparent)" stroke="var(--fm-accent, var(--accent))" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              {ring.poly.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill="var(--fm-cream, var(--fg))" stroke="var(--fm-surface, var(--bg))" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
            </>
          )}
          {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="11" fill={p.include ? 'var(--fm-accent, var(--accent))' : 'var(--fm-orange, var(--key))'} stroke="var(--fm-cream, var(--fg))" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        </svg>
      </div>
      <div className="play-out">
        {ring && <p className="pass">{ring.ac.toFixed(1)} acres</p>}
        <p role="status" aria-live="polite">{say || (ready ? 'Click a field to include it, or press Try a Sample Point. Shift-click or Alt-click marks ground to leave out.' : 'Load the model, then click a field.')}</p>
        <p className="ok">Model runs in this browser. Nothing is uploaded.</p>
        <p className="ok">
          Model: <a href={`https://huggingface.co/${m.id}`}>{m.name}</a>, Apache-2.0, run with <a href="https://github.com/huggingface/transformers.js">transformers.js</a>. Imagery: USDA FSA NAIP {tile.year}, public domain.
        </p>
      </div>
    </figure>
  );
}
