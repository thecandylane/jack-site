import './globals.css';

export const metadata = {
  title: 'Jack Schliewe — Full-Stack Engineer, AI Consulting, Tech Literacy',
  description: 'From programming industrial robots to building AI verification tools. Full-stack development, AI consulting, and technical education services based in Baton Rouge, LA.',
  openGraph: {
    title: 'Jack Schliewe — Full-Stack Engineer, AI Consulting, Tech Literacy',
    description: 'From programming industrial robots to building AI verification tools. Full-stack development, AI consulting, and technical education services.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jack Schliewe — Full-Stack Engineer, AI Consulting, Tech Literacy',
    description: 'From programming industrial robots to building AI verification tools.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
