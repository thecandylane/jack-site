import { fileURLToPath } from 'node:url';
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
  // The Auto-Draw demo (src/components/AutoDraw.js) imports @huggingface/transformers in the browser only.
  // Server: never bundle it (its node build pulls in onnxruntime-node and sharp); transpilePackages takes it off
  // Next's built-in external list so the alias to false applies. Browser: swap the WebGPU build of
  // onnxruntime-web, whose 25.6 MiB wasm is over the Workers 25 MiB asset limit, for the CPU build, which
  // loads its 14 MB wasm from public/autodraw/ort/.
  transpilePackages: ['@huggingface/transformers'],
  webpack(config, { isServer }) {
    if (isServer) config.resolve.alias['@huggingface/transformers'] = false;
    else config.resolve.alias['onnxruntime-web/webgpu$'] = fileURLToPath(new URL('./node_modules/onnxruntime-web/dist/ort.wasm.min.mjs', import.meta.url));
    return config;
  },
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
