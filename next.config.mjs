import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki/core';
import rehypePele from './src/lib/rehype-pele.mjs';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev(); // bindings (rate limits, request.cf) in next dev

// Code blocks are highlighted and ```mermaid blocks drawn at build time; both take their colors from globals.css.
const theme = createCssVariablesTheme({ name: 'phosphor', variablePrefix: '--shiki-' });
const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePele, [rehypeShiki, { theme, fallbackLanguage: 'text', langs: ['js', 'ts', 'jsx', 'c', 'bash', 'sh', 'python', 'json', 'yaml', 'diff', 'mdx', 'text'] }]],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS is not set here: WebKit honours it even on http://localhost, which pins local
          // checks to https and breaks every asset. Turn it on in Cloudflare instead
          // (SSL/TLS -> Edge Certificates -> HSTS), where it only ever sees HTTPS.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          {
            key: 'Content-Security-Policy',
            // script-src keeps 'unsafe-inline' because every page is prerendered and Next streams
            // its hydration payload in inline scripts; a nonce needs request-time rendering, which
            // this Worker cannot do (the cache is read-only). 'unsafe-eval' is gone: no component
            // evaluates a string. wasm-unsafe-eval: the YARA-X engine. frame-ancestors duplicates
            // X-Frame-Options for the browsers that only honour the header. connect-src: ref-radar's
            // feed and search, Have I Been Pwned's prefix API, the npm diff guard's registry reads.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data:",
              "connect-src 'self' https://ref.lookit.space https://api.pwnedpasswords.com https://registry.npmjs.org",
              'frame-src https://ref.lookit.space',
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'none'",
              "form-action 'self' https://ref.lookit.space",
              "frame-ancestors 'none'",
              "require-trusted-types-for 'script'",
              // No upgrade-insecure-requests: WebKit applies it to localhost too, so every local
              // check would fetch https://localhost and fail. HSTS covers the deployed site.
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
