import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    tags: z.array(z.string()).default([]),
    pubDate: z.string().optional(),
    updatedDate: z.string().optional(),
    featuredImage: z.string().optional(),
    isPage: z.boolean().default(false),
  }),
});

export const collections = { posts };
