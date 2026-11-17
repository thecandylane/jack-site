import { JetBrains_Mono } from 'next/font/google';
import Strip from '@/components/Strip';
import MatrixRain from '@/components/MatrixRain';
import Motion from '@/components/Motion';
import Terminal from '@/components/Terminal';
import { allPosts } from '@/lib/posts';
import './globals.css';

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://schliewesystems.com'),
  title: 'Jack Schliewe · AI developer and security engineer',
  description: 'Jack Schliewe builds AI software and tests its security. He makes ref-radar, prior art for coding agents, at ref.lookit.space.',
  authors: [{ name: 'Jack Schliewe' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Jack Schliewe · AI developer and security engineer',
    description: 'Jack Schliewe builds AI software and tests its security. He makes ref-radar, prior art for coding agents, at ref.lookit.space.',
    url: 'https://schliewesystems.com',
    siteName: 'Jack Schliewe',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jack Schliewe · AI developer and security engineer',
    description: 'Jack Schliewe builds AI software and tests its security. He makes ref-radar, prior art for coding agents, at ref.lookit.space.',
  },
};

// Sets the saved phosphor before first paint, so amber readers never see a green flash.
const PHOSPHOR = "document.documentElement.classList.add('js');try{if(localStorage.getItem('phosphor')==='p12')document.documentElement.classList.add('p12')}catch(e){}";

export default async function RootLayout({ children }) {
  const posts = (await allPosts()).map((p) => ({ slug: p.slug, title: p.title, date: p.date }));
  return (
    <html lang="en" className={jetbrains.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PHOSPHOR }} />
        <link rel="preload" href="/fonts/temple8.woff" as="font" type="font/woff" crossOrigin="" />
      </head>
      <body>
        <MatrixRain />
        <Strip />
        {children}
        <Motion />
        <Terminal posts={posts} />
      </body>
    </html>
  );
}
