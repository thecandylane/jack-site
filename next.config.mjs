import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev(); // bindings (rate limits, request.cf) in next dev

const withMDX = createMDX({ options: { remarkPlugins: [remarkGfm] } });

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
            // connect-src: the terminal reads ref-radar's feed; /you's password check asks Have I Been Pwned. frame-src: ref-radar's views in posts and the terminal's panes.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://ref.lookit.space https://api.pwnedpasswords.com; frame-src https://ref.lookit.space",
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
