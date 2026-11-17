'use client';

import { useState } from 'react';
import { readExif } from '@/lib/exif';

// Shows what a photo says about where and with what it was taken, then hands back a copy without it.
// Everything happens in the browser: the file is never uploaded.
const LABELS = { make: 'Camera maker', model: 'Camera model', lens: 'Lens', serial: 'Camera serial number', owner: 'Owner name', artist: 'Artist', software: 'Software', taken: 'Taken at', modified: 'Last edited' };

export default function PhotoLeak() {
  const [state, setState] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const meta = readExif(await file.arrayBuffer());
    let clean = null;
    try {
      const bmp = await createImageBitmap(file); // browsers apply the EXIF rotation, then the canvas drops all metadata
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      clean = c.toDataURL('image/jpeg', 0.92);
    } catch {}
    setState({ name: file.name, meta, clean });
  }

  const m = state?.meta;
  return (
    <section className="fp">
      <h2 className="sec-h">Your photos</h2>
      <p className="lede">
        Phones write where a photo was taken, to a few meters, into the file itself. Some sites strip it when you upload;
        email, chat apps that send &quot;original quality&quot;, file shares and many forums do not. Pick a photo to see what
        it carries. It never leaves your browser.
      </p>
      <input type="file" accept="image/jpeg,image/*" onChange={pick} className="pick" aria-label="Pick a photo to inspect" />
      {state && (
        <ul className="facts">
          {!m && <li><span>{state.name}</span><span className="fp-v">No EXIF found. Either it was stripped already, or it is a HEIC, PNG or WebP, which this check does not read.</span></li>}
          {m?.lat !== undefined && (
            <li><span>Location</span><span><b className="fp-v">{m.lat}, {m.lon}{m.altitude !== undefined ? `, ${m.altitude} m up` : ''}</b><br />
              <a href={`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lon}#map=18/${m.lat}/${m.lon}`} target="_blank" rel="noreferrer">See it on a map</a>
              <span className="muted"> Anyone with the file can do the same: this is where you were standing.</span></span></li>
          )}
          {m && Object.entries(LABELS).filter(([k]) => m[k] !== undefined).map(([k, label]) => (
            <li key={k}><span>{label}</span><b className="fp-v">{String(m[k])}</b></li>
          ))}
          {m && m.lat === undefined && <li><span>Location</span><span className="fp-v">No GPS position in this one.</span></li>}
          {state.clean && <li><span>Clean copy</span><span><a href={state.clean} download={state.name.replace(/\.\w+$/, '') + '-clean.jpg'}>Download it without the metadata</a><span className="muted"> Redrawn in your browser, so nothing but the pixels survives.</span></span></li>}
        </ul>
      )}
    </section>
  );
}
