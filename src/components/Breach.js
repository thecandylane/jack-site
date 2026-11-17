'use client';

import { useState } from 'react';

// Checks a password against Have I Been Pwned's Pwned Passwords with k-anonymity
// (haveibeenpwned.com/API/v3): only the first 5 characters of the SHA-1 hash leave the browser.
const RANGE = 'https://api.pwnedpasswords.com/range/';

export default function Breach() {
  const [pw, setPw] = useState('');
  const [out, setOut] = useState(null);

  async function check(e) {
    e.preventDefault();
    if (!pw) return;
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw)))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hash.slice(0, 5), suffix = hash.slice(5);
    setOut({ prefix, busy: true });
    try {
      const text = await fetch(RANGE + prefix, { headers: { 'Add-Padding': 'true' } }).then((r) => r.text());
      const rows = text.split('\n');
      const hit = rows.find((l) => l.startsWith(suffix));
      setOut({ prefix, suffix, total: rows.length, count: hit ? Number(hit.split(':')[1]) : 0 });
    } catch { setOut({ prefix, failed: true }); }
    setPw('');
  }

  return (
    <section className="fp">
      <h2 className="sec-h">Your passwords</h2>
      <p className="lede">
        Billions of passwords from past breaches are public, and attackers try them first. Type one to check it against
        Have I Been Pwned. Your password is not sent: your browser hashes it and sends only the first 5 characters of the
        hash, which match hundreds of other passwords. The answer is checked here.
      </p>
      <form onSubmit={check} className="pick">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="a password" autoComplete="off" aria-label="Password to check" />
        <button type="submit">check</button>
      </form>
      {out && (
        <ul className="facts">
          <li><span>What left your browser</span><code className="fp-v">GET {RANGE}{out.prefix}</code></li>
          {out.failed && <li><span>Result</span><span className="fp-v">Have I Been Pwned could not be reached.</span></li>}
          {out.total && (
            <li><span>Result</span><span><b className="fp-v">{out.count ? `Seen ${out.count.toLocaleString()} times in breaches. Stop using it everywhere.` : 'Not in any known breach. That is not the same as strong.'}</b><br />
              <span className="muted">Matched against {out.total} hashes that start with {out.prefix}, in your browser.</span></span></li>
          )}
        </ul>
      )}
    </section>
  );
}
