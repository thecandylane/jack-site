const SITE = 'https://schliewesystems.com';

/** Facts already printed on the home page. Nothing here is a claim the page does not make. */
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Jack Schliewe',
    url: `${SITE}/`,
    jobTitle: 'AI developer and security engineer',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Baton Rouge',
      addressRegion: 'LA',
      addressCountry: 'US',
    },
    email: 'mailto:jschli3@lsu.edu',
    sameAs: [
      'https://github.com/thecandylane',
      'https://www.linkedin.com/in/thecandylane/',
      'https://ref.lookit.space',
    ],
  };
}

export function postJsonLd({ title, lede, date, slug }) {
  const url = `${SITE}/blog/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: lede,
    datePublished: date,
    dateModified: date,
    author: { '@type': 'Person', name: 'Jack Schliewe', url: `${SITE}/` },
    mainEntityOfPage: url,
    url,
    image: `${SITE}/opengraph-image`,
  };
}

export function jsonLdScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
