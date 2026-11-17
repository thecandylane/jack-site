'use client';

import { useState } from 'react';
import { NAME, compare, previous } from '@/lib/npmdiff';

// Checks a package's newest version (or one you name) against the version before it, in the browser. It asks
// registry.npmjs.org, which allows any origin, for public metadata only; nothing is installed or downloaded.
const REG = 'https://registry.npmjs.org/';
const path = (name) => name.replace('/', '%2f');
const get = async (url, accept) => {
  const r = await fetch(url, accept ? { headers: { Accept: accept } } : undefined);
  if (r.status === 404) throw new Error('not found on npm');
  if (!r.ok) throw new Error(`npm answered ${r.status}`);
  return r.json();
};

export default function NpmDiff({ example = 'chalk' }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);

  async function check(e) {
    e.preventDefault();
    const [, name, want] = /^(@?[^@\s]+)(?:@(\S+))?$/.exec(q.trim().toLowerCase()) ?? [];
    if (!name || !NAME.test(name) || name.length > 214) return setRes({ error: 'That is not a valid npm package name.' });
    setRes({ busy: true });
    try {
      const doc = await get(REG + path(name), 'application/vnd.npm.install-v1+json');
      const version = want ?? doc['dist-tags']?.latest;
      if (!doc.versions?.[version]) throw new Error(`no version ${version}`);
      const prev = previous(Object.keys(doc.versions), version);
      const [now, old] = await Promise.all([get(`${REG}${path(name)}/${version}`), prev ? get(`${REG}${path(name)}/${prev}`) : null]);
      setRes({ name, version, prev, findings: compare(old, now) });
    } catch (err) {
      setRes({ error: `Couldn't check ${name}: ${err.message}.` });
    }
  }

  const high = res?.findings?.filter((f) => f.level === 'high').length ?? 0;
  const warn = res?.findings?.filter((f) => f.level === 'warn').length ?? 0;
  return (
    <figure className="play tool">
      <figcaption><span>npm diff guard · compare a release with the one before it</span></figcaption>
      <form onSubmit={check} className="tool-form">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${example} or ${example}@5.0.0`} aria-label="npm package, optionally @version" spellCheck="false" autoCapitalize="off" />
        <button type="submit" className="go" disabled={res?.busy}>{res?.busy ? 'checking…' : 'check ▸'}</button>
      </form>
      {res && !res.busy && (
        <div className="play-out" role="status">
          {res.error && <p className="err">! {res.error}</p>}
          {res.findings && (
            <>
              <p className={high ? 'fail' : 'pass'}>
                {res.name}@{res.version} {res.prev ? `against ${res.prev}` : '(first version)'}:{' '}
                {high ? `${high} red flag${high > 1 ? 's' : ''}.` : warn ? 'worth a look, no red flags.' : 'nothing changed that runs code or changes who ships it.'}
              </p>
              {res.findings.map((f, i) => <p key={i} className={f.level === 'high' ? 'no' : f.level === 'warn' ? 'warn' : 'ok'}>{f.level === 'high' ? '✗' : f.level === 'warn' ? '!' : '·'} {f.text}</p>)}
            </>
          )}
        </div>
      )}
    </figure>
  );
}
