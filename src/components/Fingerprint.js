'use client';

import { useEffect, useState } from 'react';

// What a visitor's browser hands to every site it visits, read here in the browser and never sent anywhere:
// this component makes no network request. Each signal says what it reveals and what blunts it.
export const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const short = (h) => h.slice(0, 16);

function canvasPrint() {
  const c = document.createElement('canvas'); c.width = 280; c.height = 60;
  const x = c.getContext('2d');
  x.textBaseline = 'top'; x.font = '16px Arial'; x.fillStyle = '#f60'; x.fillRect(100, 1, 62, 20);
  x.fillStyle = '#069'; x.fillText('schliewe.systems \u{1F512} 1.0', 2, 15);
  x.fillStyle = 'rgba(102,204,0,.7)'; x.fillText('schliewe.systems \u{1F512} 1.0', 4, 17);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = '#f2f'; x.beginPath(); x.arc(220, 30, 22, 0, 7); x.fill();
  return c.toDataURL();
}

function gpu() {
  const gl = document.createElement('canvas').getContext('webgl');
  if (!gl) return 'WebGL is off';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? `${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)} · ${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}` : `${gl.getParameter(gl.VENDOR)} · ${gl.getParameter(gl.RENDERER)} (masked)`;
}

async function audioPrint() {
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Ctx) return 'not available';
  const ctx = new Ctx(1, 5000, 44100);
  const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 10000;
  const comp = ctx.createDynamicsCompressor();
  osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
  const buf = await ctx.startRendering();
  const data = buf.getChannelData(0);
  let sum = 0; for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
  return sum.toFixed(10);
}

const FONTS = ['Arial', 'Helvetica Neue', 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell', 'Menlo', 'Consolas', 'SF Pro Text', 'Calibri', 'Cambria', 'Georgia', 'Comic Sans MS', 'Futura', 'Avenir', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Wingdings'];
function fonts() {
  const x = document.createElement('canvas').getContext('2d');
  const w = (f) => { x.font = `32px ${f}`; return x.measureText('mmmmmmmmmlli1WQ@').width; };
  const base = ['monospace', 'serif', 'sans-serif'].map(w);
  return FONTS.filter((f) => ['monospace', 'serif', 'sans-serif'].some((b, i) => w(`'${f}', ${b}`) !== base[i]));
}

const mq = (q) => matchMedia(q).matches;

export async function read() {
  const n = navigator, ua = n.userAgentData;
  const hints = ua?.getHighEntropyValues ? await ua.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'fullVersionList']).catch(() => null) : null;
  const layout = n.keyboard?.getLayoutMap ? await n.keyboard.getLayoutMap().then((m) => ['KeyQ', 'KeyW', 'KeyY', 'KeyZ'].map((k) => m.get(k)).join('')).catch(() => null) : null;
  const quota = n.storage?.estimate ? await n.storage.estimate().then((e) => e.quota).catch(() => null) : null;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const canvas = await sha(canvasPrint());
  const audio = await audioPrint().catch(() => 'blocked');
  const found = fonts();

  return [
    { group: 'Identity', name: 'User agent', api: 'navigator.userAgent', value: n.userAgent, reveals: 'Browser, version and operating system, in every request you make.', defense: 'Browsers now freeze parts of it, but it still names your browser family and OS.' },
    { group: 'Identity', name: 'Client hints', api: 'navigator.userAgentData', value: hints ? `${hints.platform ?? ua.platform} ${hints.platformVersion} · ${hints.architecture}${hints.bitness ? `-${hints.bitness}` : ''}${hints.model ? ` · ${hints.model}` : ''} · ${(hints.fullVersionList ?? []).filter((b) => !/Not/.test(b.brand)).map((b) => `${b.brand} ${b.version}`).join(', ')}` : 'not offered (not a Chromium browser)', reveals: 'Exact OS version, CPU architecture and full browser build, on request.', defense: 'Only Chromium browsers answer. Firefox and Safari never do.' },
    { group: 'Locale', name: 'Languages', api: 'navigator.languages', value: (n.languages ?? [n.language]).join(', '), reveals: 'Your language order; a rare combination narrows you down fast.', defense: 'Keep one common language, as Tor Browser does.' },
    { group: 'Locale', name: 'Time zone', api: 'Intl.DateTimeFormat', value: `${tz} (UTC${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60})`, reveals: 'Roughly where you are, even behind a VPN.', defense: "A VPN hides your IP but not this. Firefox's resistFingerprinting reports UTC." },
    { group: 'Hardware', name: 'Screen', api: 'screen, devicePixelRatio', value: `${screen.width}x${screen.height}, available ${screen.availWidth}x${screen.availHeight}, ${screen.colorDepth}-bit, ${devicePixelRatio}x`, reveals: 'Your display model and how your dock or taskbar is set.', defense: 'Letterboxing (Tor, Firefox resistFingerprinting) rounds the window size.' },
    { group: 'Hardware', name: 'CPU and memory', api: 'navigator.hardwareConcurrency, deviceMemory', value: `${n.hardwareConcurrency ?? '?'} logical cores${n.deviceMemory ? `, about ${n.deviceMemory} GB` : ''}, ${n.maxTouchPoints} touch points`, reveals: 'The class of machine you are on.', defense: 'Hardened browsers report a fixed core count.' },
    { group: 'Hardware', name: 'GPU', api: 'WEBGL_debug_renderer_info', value: gpu(), reveals: 'Your graphics card and driver, often the exact model.', defense: 'Safari and Firefox mask the model; Chromium shows it.' },
    { group: 'Rendering', name: 'Canvas', api: 'HTMLCanvasElement.toDataURL', value: short(canvas), reveals: 'How your GPU, fonts and OS draw the same picture: stable across visits.', defense: 'Brave and Firefox add noise or ask first; a noisy hash changes on every reload.' },
    { group: 'Rendering', name: 'Audio', api: 'OfflineAudioContext', value: audio, reveals: 'Your audio stack and browser build, from math alone; no sound plays.', defense: 'Brave randomizes it per site.' },
    { group: 'Rendering', name: 'Fonts', api: 'CanvasRenderingContext2D.measureText', value: `${found.length} of ${FONTS.length} tested: ${found.join(', ')}`, reveals: 'Installed apps and your OS: Office, design tools, Linux distros all leave fonts behind.', defense: 'Safari and Firefox limit which fonts a page may see.' },
    { group: 'Environment', name: 'Keyboard layout', api: 'navigator.keyboard.getLayoutMap', value: layout ?? 'not offered', reveals: 'Your keyboard layout (qwer, azer, qwrz) and so your country.', defense: 'Only Chromium answers, and only on secure pages.' },
    { group: 'Environment', name: 'Storage quota', api: 'navigator.storage.estimate', value: quota ? `${(quota / 1e9).toFixed(1)} GB` : 'not offered', reveals: 'Free disk space; a tiny quota can give away a private window.', defense: 'Browsers now report a capped figure in private windows too.' },
    { group: 'Preferences', name: 'Display preferences', api: 'matchMedia', value: [mq('(prefers-color-scheme: dark)') ? 'dark mode' : 'light mode', mq('(prefers-reduced-motion: reduce)') && 'reduced motion', mq('(prefers-contrast: more)') && 'more contrast', mq('(forced-colors: active)') && 'forced colors'].filter(Boolean).join(', '), reveals: 'Accessibility settings, which are rare and so very identifying.', defense: 'None worth trading your accessibility for.' },
    { group: 'Privacy', name: 'Privacy signals', api: 'globalPrivacyControl, doNotTrack', value: `Global Privacy Control ${n.globalPrivacyControl ? 'on' : 'off'}, Do Not Track ${n.doNotTrack === '1' ? 'on' : 'off'}, cookies ${n.cookieEnabled ? 'on' : 'off'}`, reveals: 'Ironically, turning these on makes you rarer.', defense: 'GPC is legally binding in some US states; DNT is ignored almost everywhere.' },
  ];
}

export default function Fingerprint() {
  const [rows, setRows] = useState(null);
  const [digest, setDigest] = useState('');
  useEffect(() => {
    // Wait for an idle moment: the canvas, WebGL and audio probes are slow on phones.
    const go = () => read().then(async (r) => { setRows(r); setDigest(short(await sha(JSON.stringify(r.map((x) => x.value))))); });
    const id = window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 200);
    return () => (window.requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  if (!rows) return <p className="muted">measuring…</p>;
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <>
      <dl className="stats">
        <div><dt>Signals read</dt><dd>{rows.length}</dd></div>
        <div><dt>Your fingerprint</dt><dd className="small-dd">{digest}</dd></div>
        <div><dt>Sent to this server</dt><dd>0 bytes</dd></div>
      </dl>
      <p className="lede">
        Try this: open this page in a private window and compare the fingerprint. If it is the same, a site can tell it
        is you with no cookie and no login. A browser that adds noise (Brave, Firefox with resistFingerprinting, Tor)
        shows a new one each time.
      </p>
      {groups.map((g) => (
        <section key={g} className="fp">
          <h2 className="sec-h">{g}</h2>
          <ul className="facts">
            {rows.filter((r) => r.group === g).map((r) => (
              <li key={r.name}>
                <span>{r.name}<br /><code className="muted small">{r.api}</code></span>
                <span><b className="fp-v">{r.value}</b><br /><span className="muted">{r.reveals} {r.defense}</span></span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
