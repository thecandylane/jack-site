// One source of truth for the response headers this site sends. next.config.mjs builds its headers()
// from these two exports; the /headers page and /api/headers read the same data, so the policy and
// its documentation can never drift apart. Keep the directive order: it is the emitted CSP string.

// HSTS is deliberately NOT a header the app sends. WebKit honours Strict-Transport-Security even on
// http://localhost, which pins local checks to https and breaks every asset. It belongs in Cloudflare
// (SSL/TLS -> Edge Certificates -> HSTS), where it only ever sees HTTPS.
export const HSTS_NOTE = `HSTS (Strict-Transport-Security) is deliberately not sent by the app: WebKit honours it even on http://localhost and would pin local checks to https. It is set in Cloudflare instead (SSL/TLS -> Edge Certificates -> HSTS), where it only ever sees HTTPS.`;

// The headers with a fixed value (the CSP is built from CSP_DIRECTIVES below). `note` says what each stops.
export const SECURITY_HEADERS = [
  {
    key: `X-Frame-Options`,
    value: `DENY`,
    note: `Stops clickjacking: no other site may put these pages in a frame, so a transparent overlay cannot trick a click.`,
  },
  {
    key: `X-Content-Type-Options`,
    value: `nosniff`,
    note: `Stops MIME confusion: a browser will not reinterpret a response as a different, executable type than the one declared.`,
  },
  {
    key: `Referrer-Policy`,
    value: `strict-origin-when-cross-origin`,
    note: `Keeps paths and query strings out of the Referer sent to other origins; cross-origin requests carry only this site's origin.`,
  },
  {
    key: `Permissions-Policy`,
    value: `camera=(), microphone=(), geolocation=()`,
    note: `Turns off the camera, microphone and geolocation APIs so an embedded frame or an injected script cannot reach them.`,
  },
  {
    key: `Cross-Origin-Opener-Policy`,
    value: `same-origin`,
    note: `Isolates this browsing context: a cross-origin window cannot reach window.opener, closing tab-nabbing and cross-window attacks and enabling cross-origin isolation.`,
  },
  {
    key: `Cross-Origin-Resource-Policy`,
    value: `same-origin`,
    note: `Stops other origins from loading this site's pages and assets as subresources, limiting cross-origin data leaks such as Spectre-style reads.`,
  },
];

// The Content-Security-Policy, split into directives. `directive` + ` ` + `value`, joined with '; ',
// is byte-for-byte the CSP header next.config.mjs sends. `strength` is one of strong | weak | info.
export const CSP_DIRECTIVES = [
  {
    directive: `default-src`,
    value: `'self'`,
    strength: `strong`,
    note: `Fallback for any fetch without its own directive: only same-origin resources load, so an injected URL cannot pull in a remote script, image or font.`,
  },
  {
    directive: `script-src`,
    value: `'self' 'unsafe-inline' 'wasm-unsafe-eval'`,
    strength: `weak`,
    note: `The one weak directive. It keeps 'unsafe-inline' because every page here is prerendered and Next streams its hydration payload as inline scripts; a per-request CSP nonce needs request-time rendering, which the read-only static-asset cache on the Worker cannot do. 'unsafe-eval' is gone (no component evaluates a string); 'wasm-unsafe-eval' stays only for the in-browser WASM engines (YARA-X, QuickJS and the FarmMind Auto-Draw model). Trusted Types, enforced below, is what keeps this from being a free pass for injected markup.`,
  },
  {
    directive: `style-src`,
    value: `'self' 'unsafe-inline'`,
    strength: `info`,
    note: `Inline styles are allowed for the React-rendered chrome (the strip, terminal and matrix rain). Weaker than a nonce, but CSS cannot execute script and Trusted Types does not govern style attributes.`,
  },
  {
    directive: `font-src`,
    value: `'self'`,
    strength: `info`,
    note: `Fonts (Temple8, JetBrains Mono) load only from this origin; no third-party font CDN is contacted.`,
  },
  {
    directive: `img-src`,
    value: `'self' data:`,
    strength: `info`,
    note: `Images come from this origin or data: URLs (the OG image and inline canvas); an injected tag cannot beacon out by loading a remote image.`,
  },
  {
    directive: `connect-src`,
    value: `'self' https://ref.lookit.space https://api.pwnedpasswords.com https://registry.npmjs.org`,
    strength: `info`,
    note: `Allowlist for fetch, XHR and WebSocket: this site, ref-radar's feed and search, Have I Been Pwned's k-anonymity prefix API, and the npm registry for the diff guard. Nothing else can be contacted.`,
  },
  {
    directive: `frame-src`,
    value: `https://ref.lookit.space https://www.youtube-nocookie.com`,
    strength: `info`,
    note: `Only ref-radar's /radar and /universe views and the FarmMind page's YouTube videos may be embedded; no other site can be framed in. The videos use YouTube's privacy-enhanced nocookie host, and each player loads only after a click on its self-hosted poster, so a page view contacts no Google server.`,
  },
  {
    directive: `worker-src`,
    value: `'self' blob:`,
    strength: `info`,
    note: `Web Workers come from this origin or blob: URLs (the Forge and QuickJS playgrounds); a remote worker cannot be spawned.`,
  },
  {
    directive: `object-src`,
    value: `'none'`,
    strength: `strong`,
    note: `No plugins (Flash, Java, PDF embeds) may load at all, closing a classic execution and clickjacking vector.`,
  },
  {
    directive: `base-uri`,
    value: `'none'`,
    strength: `strong`,
    note: `An injected <base> tag cannot rewrite where relative URLs and form actions point, closing base-tag hijacking of script loads.`,
  },
  {
    directive: `form-action`,
    value: `'self' https://ref.lookit.space`,
    strength: `strong`,
    note: `Forms may submit only to this origin or ref-radar; an injected form cannot post stolen data to an attacker's host.`,
  },
  {
    directive: `frame-ancestors`,
    value: `'none'`,
    strength: `strong`,
    note: `CSP's own clickjacking rule: no ancestor may frame these pages. It duplicates X-Frame-Options for browsers that only honour CSP.`,
  },
  {
    directive: `require-trusted-types-for`,
    value: `'script'`,
    strength: `strong`,
    note: `Trusted Types is enforced: DOM XSS sinks (innerHTML, script URLs, eval-like sinks) reject plain strings, so injected markup cannot become executable script even where inline scripts are allowed.`,
  },
];
