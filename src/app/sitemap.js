import { allPosts } from '@/lib/posts';

const SITE = 'https://schliewesystems.com';

export default async function sitemap() {
  const posts = await allPosts();
  return [
    { url: SITE, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
