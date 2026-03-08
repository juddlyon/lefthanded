import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lefthanded.io',
  output: 'static',
  integrations: [sitemap()],
});
