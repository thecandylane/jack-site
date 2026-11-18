import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeShiki from '@shikijs/rehype';
import { createCssVariablesTheme } from 'shiki/core';
import rehypePele from './src/lib/rehype-pele.mjs';
import { SECURITY_HEADERS, CSP_DIRECTIVES } from './src/lib/security-headers.js';
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
          ...SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
          // HSTS is deliberately absent here (see HSTS_NOTE in src/lib/security-headers.js): WebKit
          // honours it even on http://localhost, which pins local checks to https. Set it in Cloudflare.
          {
            key: 'Content-Security-Policy',
            // script-src keeps 'unsafe-inline' because every page is prerendered and Next streams its
            // hydration payload in inline scripts; a nonce needs request-time rendering the Worker
            // cannot do. Each directive's full rationale lives in src/lib/security-headers.js.
            value: CSP_DIRECTIVES.map(({ directive, value }) => `${directive} ${value}`).join('; '),
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
