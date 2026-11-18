import { pageMeta } from '@/lib/site';
import { SECURITY_HEADERS, CSP_DIRECTIVES, HSTS_NOTE } from '@/lib/security-headers';

export const dynamic = 'force-static';

export const metadata = pageMeta({
  title: 'Security headers',
  description: 'Exactly which security headers this site sends, and what each directive stops.',
  path: '/headers',
});

// Strength is colour-coded with the phosphor tokens, never a hard-coded colour.
const STRENGTH_COLOR = { strong: 'var(--accent)', weak: 'var(--key)', info: 'var(--muted)' };

export default function Headers() {
  const weak = CSP_DIRECTIVES.find((d) => d.strength === 'weak');
  const csp = CSP_DIRECTIVES.map(({ directive, value }) => `${directive} ${value}`).join('; ');
  return (
    <main className="wrap you prose">
      <p className="back">$ cat /etc/security-headers</p>
      <h1 className="you-h">Security headers</h1>
      <p className="lede">
        This is exactly what the site sends on every response, read from the same data <code>next.config.mjs</code> uses
        to set it. One source of truth lives in <code>src/lib/security-headers.js</code>: change a value there and both
        the real headers and this page change together. The raw data is at <a href="/api/headers">/api/headers</a>.
      </p>

      <h2>Content-Security-Policy</h2>
      <p>
        The CSP arrives as a single header; below it is split into directives so each can be explained. Each is marked{' '}
        <strong>strong</strong> (it blocks a whole class of attack), <strong>info</strong> (an allowlist that narrows
        where resources come from), or <strong>weak</strong> (a deliberate concession). Verbatim, the header is:
      </p>
      <pre><code>{`Content-Security-Policy: ${csp}`}</code></pre>
      <p>
        <strong>One directive is weak: <code>{weak.directive}</code>.</strong> {weak.note}
      </p>
      <p>
        <strong>Trusted Types is enforced</strong>: <code>require-trusted-types-for 'script'</code> makes DOM XSS sinks
        reject plain strings, so injected markup cannot become executable script even though inline scripts are allowed.
        With <code>object-src 'none'</code>, <code>base-uri 'none'</code> and <code>frame-ancestors 'none'</code>, the
        usual escalation paths stay closed.
      </p>
      <table>
        <thead>
          <tr><th>Directive</th><th>Value</th><th>What it stops</th><th>Strength</th></tr>
        </thead>
        <tbody>
          {CSP_DIRECTIVES.map((d) => (
            <tr key={d.directive}>
              <td><code>{d.directive}</code></td>
              <td><code>{d.value}</code></td>
              <td>{d.note}</td>
              <td><span style={{ color: STRENGTH_COLOR[d.strength] }}>{d.strength}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>The other headers</h2>
      <p>
        Six more headers go out on every response, each with a fixed value. They cover framing, MIME types, referrers,
        device permissions and cross-origin isolation.
      </p>
      <table>
        <thead>
          <tr><th>Header</th><th>Value</th><th>What it stops</th></tr>
        </thead>
        <tbody>
          {SECURITY_HEADERS.map((h) => (
            <tr key={h.key}>
              <td><code>{h.key}</code></td>
              <td><code>{h.value}</code></td>
              <td>{h.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{HSTS_NOTE}</p>

      <p>
        The same headers protect <a href="/forge">the Forge</a> and every other page here.
      </p>
    </main>
  );
}
