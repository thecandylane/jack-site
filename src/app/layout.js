import { Playfair_Display, JetBrains_Mono, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://jackschliewe.com'),
  title: 'Jack Schliewe — Baton Rouge Technology Expert | Software, Hardware, AI, Security',
  description: 'Software development, hardware repair, networking, AI integration, cybersecurity, and technical consulting. Baton Rouge\'s complete technology resource.',
  authors: [{ name: 'Jack Schliewe' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Jack Schliewe — Baton Rouge Technology Expert | Software, Hardware, AI, Security',
    description: 'Software development, hardware repair, networking, AI integration, cybersecurity, and technical consulting. Baton Rouge\'s complete technology resource.',
    url: 'https://jackschliewe.com',
    siteName: 'Jack Schliewe',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jack Schliewe — Baton Rouge Technology Expert | Software, Hardware, AI, Security',
    description: 'Software development, hardware repair, networking, AI integration, cybersecurity, and technical consulting. Baton Rouge\'s complete technology resource.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${jetbrains.variable} ${dmSans.variable}`}>
      <body style={{ background: '#0a0a0a', color: '#fff' }}>{children}</body>
    </html>
  );
}
