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
          {
            key: 'Content-Security-Policy',
            // connect-src: the terminal reads ref-radar's feed; /you's password check asks Have I Been Pwned; the npm diff guard reads public registry metadata. wasm-unsafe-eval: the YARA-X engine. frame-src: ref-radar's views in posts and the terminal's panes. worker-src blob: the blog's code playgrounds.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://ref.lookit.space https://api.pwnedpasswords.com https://registry.npmjs.org; frame-src https://ref.lookit.space; worker-src 'self' blob:",
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
