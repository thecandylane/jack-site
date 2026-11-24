'use client';

import { useState } from 'react';

// FarmMind's own product tour inside a phosphor window: the steps, screenshots and captions of each farmmind.org
// /feature/ page, self-hosted. Everything is a button; Left and Right step through a feature, and the arrow keys
// move along the feature rail.
export default function FarmTour({ features, logo, headline }) {
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const [phone, setPhone] = useState(false);
  const f = features[fi];
  const s = f.steps[si];
  const n = f.steps.length;
  const go = (i) => setSi((i + n) % n);
  const pick = (i) => { setFi(i); setSi(0); };
  const railKey = (e) => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const i = (fi + d + features.length) % features.length;
    pick(i);
    e.currentTarget.children[i].focus();
  };
  const stepKey = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); go(si + d); }
  };

  return (
    <div className="term fm-win">
      <div className="term-bar">
        <span className="fm-addr">farmmind.org <span className="muted">/feature/{f.key}/</span></span>
        <span className="fm-dev" role="group" aria-label="Screen size">
          <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>Laptop</button>
          <button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>Phone</button>
        </span>
      </div>
      <div className="fm">
        <p className="fm-head">
          <img src={logo} alt="" width="28" height="28" />
          <b>FarmMind</b>
          <span>{headline}</span>
        </p>
        <div className="fm-app">
          <div className="fm-rail" role="group" aria-label="Features" onKeyDown={railKey}>
            {features.map((x, i) => (
              <button key={x.key} type="button" aria-pressed={i === fi} onClick={() => pick(i)}>{x.name}</button>
            ))}
          </div>
          <div className="fm-stage" onKeyDown={stepKey}>
            <h2>{f.name}</h2>
            <p className="fm-hl">{f.headline}</p>
            <p className="fm-line">{f.line}</p>
            <figure className={phone ? 'fm-shot phone' : 'fm-shot'}>
              <img
                key={phone ? s.phone : s.laptop}
                src={phone ? s.phone : s.laptop}
                width={phone ? s.pw : s.w}
                height={phone ? s.ph : s.h}
                alt={`FarmMind ${f.name}: ${s.caption}`}
                loading={fi || si || phone ? 'lazy' : 'eager'}
              />
              <figcaption aria-live="polite">
                <span className="fm-count">Step {si + 1} of {n}</span>
                <b>{s.caption}</b> {s.detail}
              </figcaption>
            </figure>
            <div className="fm-steps">
              <button type="button" onClick={() => go(si - 1)}>Previous</button>
              <span className="fm-dots">
                {f.steps.map((x, i) => (
                  <button key={x.laptop} type="button" aria-label={`Step ${i + 1}: ${x.caption}`} aria-current={i === si ? 'step' : undefined} onClick={() => setSi(i)} />
                ))}
              </span>
              <button type="button" onClick={() => go(si + 1)}>Next</button>
            </div>
            <p className="fm-links">
              <a href={f.href}>See the Feature</a>
              <a href={f.tutorial}>Open the Tutorial</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
