# lefthanded.io

Niche content site about everything left-handed. Migrated from Ghost CMS to Astro.

## Stack

- **Framework**: Astro 5.5 (static output)
- **Hosting**: Netlify (auto-deploys from `main` branch)
- **Content**: Markdown files with HTML body content in `src/content/posts/`
- **Theme**: Ghost "Alto" theme (CSS/JS in `public/assets/`)
- **Fonts**: Google Fonts (Lora, Mulish)

## Project Structure

```
src/
  content/
    posts/          # 70 markdown files (HTML body, set:html rendering)
    content.config.ts  # Zod schema: title, description, slug, tags, pubDate, updatedDate, featuredImage, isPage
  layouts/
    BaseLayout.astro   # Single layout with SEO meta, JSON-LD, OG/Twitter tags
  pages/
    index.astro        # Homepage (post feed)
    [slug].astro       # Individual post pages
    tag/[tag].astro    # Tag archive pages
    about/index.astro
    contact/index.astro
    404.astro
    rss.xml.ts         # RSS feed
public/
  content/images/      # All images (local, no external dependencies)
  assets/built/        # Theme CSS/JS
  robots.txt
```

## Content Conventions

- Post body is **HTML** (not markdown), rendered via `set:html={post.body}`
- `isPage: true` marks about/contact (excluded from post feeds)
- Tags: Facts, People, Products, Sports, Music, Professions, How-to
- Author is hardcoded as "Sammy Southpaw" in templates
- All images are local (stored in `public/content/images/`)
- Internal links use `/<slug>/` format

## SEO Setup

- Canonical URLs on every page
- Open Graph tags (type, title, description, image, url, article dates)
- Twitter Card tags (summary_large_image when image present)
- JSON-LD structured data (WebSite on homepage, Article on posts)
- Auto-generated sitemap via @astrojs/sitemap
- RSS feed at /rss.xml via @astrojs/rss
- robots.txt pointing to sitemap
- Meta descriptions on all posts (30-160 chars)

## Build & Deploy

```bash
npm run dev      # Local dev server
npm run build    # Build to dist/
npm run preview  # Preview built site
```

Pushes to `main` auto-deploy via Netlify.

## Scripts

- `scripts/extract-content.mjs` — Original Ghost export extraction script
- `scripts/localize-images.mjs` — Downloads external images and updates markdown references
