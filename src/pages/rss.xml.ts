import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allPosts = await getCollection('posts');
  const posts = allPosts
    .filter(p => !p.data.isPage)
    .sort((a, b) => {
      const dateA = a.data.pubDate ? new Date(a.data.pubDate).getTime() : 0;
      const dateB = b.data.pubDate ? new Date(b.data.pubDate).getTime() : 0;
      return dateB - dateA;
    });

  return rss({
    title: 'lefthanded.io',
    description: 'LeftHanded.io covers everything left-handed: expert tips, insightful articles, and unique products.',
    site: context.site!,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate ? new Date(post.data.pubDate) : undefined,
      link: `/${post.data.slug}/`,
    })),
  });
}
