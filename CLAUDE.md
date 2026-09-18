# lefthanded.io

Niche content site about everything left-handed. Migrated from Ghost CMS to Astro.

## Stack

- **Framework**: Astro 5.5 (static output)
- **Hosting**: Netlify (manual deploy — upload `dist/` folder)
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
    BaseLayout.astro   # Single layout with SEO meta, JSON-LD, OG/Twitter tags, extraSchemas prop
  pages/
    index.astro        # Homepage (post feed)
    [slug].astro       # Individual post pages (BreadcrumbList + FAQPage schemas)
    tag/[tag].astro    # Tag archive pages (noindex, BreadcrumbList schema)
    about/index.astro
    contact/index.astro
    404.astro          # noindex
    rss.xml.ts         # RSS feed
public/
  favicon.svg          # SVG favicon (blue circle + white hand icon)
  content/images/      # All images (local, no external dependencies)
    og-default.svg     # Default OG/social share image (1200x630)
    lefthanded-io-logo-v2.svg  # SVG logo (hand icon + wordmark)
    external/unsplash/ # Downloaded Unsplash images for featured images
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
- Articles open with AEO-optimized Q:A format (≤250 char first paragraph)
- Articles include FAQ sections (`<h2>Frequently asked questions</h2>` + `<h3>`/`<p>` pairs)
- All articles have `featuredImage` in frontmatter
- **Body images required**: Every article must have at least one `<figure>` image in the body (not just featuredImage)
- **People listicles need real photos**: Articles about famous people (comedians, athletes, musicians, etc.) must include actual photos of those people from Wikimedia Commons — not generic stock images. Use `curl -sL -H "User-Agent: LefthandedBot/1.0" "https://commons.wikimedia.org/wiki/Special:FilePath/FILENAME.jpg?width=440"`

## Pre-Deploy Quality Check

Before deploying new articles, verify they have body images:

```bash
# Check specific new articles for body images
grep -c '<img' src/content/posts/NEW-ARTICLE.md  # Should be ≥1

# Find ALL articles missing body images (legacy debt exists)
grep -L '<img' src/content/posts/*.md
```

New articles without body images are incomplete and should not ship. (Legacy articles without images are technical debt to address separately.)

### Imagery for celeb/athlete articles ("is X left-handed?")

A post that is *about a specific person* should show that person — never a generic stock photo. A "Is Donald Trump left-handed?" article with a stock photo of a podium reads as filler.

- **Featured image**: Wikipedia portrait of the subject. Use `scripts/fetch-wikipedia-portraits.mjs` — add the slug + Wikipedia page title to `PORTRAITS`, add the slug to `HERO_SLUGS`, run the script.
- **Hero size**: 1280px wide (the script rewrites the Wikipedia thumb URL to request this). Files saved as `/content/images/portraits/<slug>-<HERO_VERSION>.jpg`.
- **Cache-busting**: `/content/images/*` is served with `Cache-Control: immutable`, so replacing a file at the same URL won't reach the CDN edge. Bump `HERO_VERSION` in the fetcher (e.g., `v2 → v3`) and update each post's `featuredImage` path; the renamed file forces a cache miss.
- **Don't**: layer an inline portrait below the lead AND a portrait as the featured image — pick one. The featured image is more visible, so use that.
- **Hub galleries** (e.g., `/famous-left-handed-people/`): use the default 320px thumbnails (no version suffix needed) — gallery thumbs don't get refreshed often and benefit from the immutable cache.

### Imagery for non-celeb articles

- **Concept/topic posts** (statistics, debunks, biology, etc.): Pexels stock via `scripts/fetch-pexels-covers.mjs` is fine — those articles aren't about a specific identifiable person.
- **Product roundups**: per-product images go to `/content/images/products/<slug>.jpg`, fetched via `scripts/fetch-products.mjs` from SerpAPI Amazon data.

## SEO & AEO

- Canonical URLs on every page
- Open Graph tags (type, title, description, image, url, locale, article dates)
- Twitter Card tags (summary_large_image when image present)
- Default OG image fallback (`og-default.svg`) for pages without featured images
- JSON-LD structured data:
  - `WebSite` with `SearchAction` on homepage
  - `Article` on post pages
  - `BreadcrumbList` on posts and tag pages
  - `FAQPage` auto-extracted from FAQ sections in post HTML
- `extraSchemas` prop on BaseLayout for passing additional JSON-LD blocks
- Tag pages and 404 are `noindex,follow` (excluded from sitemap)
- Auto-generated sitemap via @astrojs/sitemap (filters out tag/404 pages)
- RSS feed at /rss.xml via @astrojs/rss
- robots.txt pointing to sitemap
- Meta descriptions on all posts (30-160 chars)
- SVG favicon and logo for retina sharpness
- `defer` on all external scripts (jQuery, main.js, cards.js)

## Build & Deploy

```bash
npm run dev      # Local dev server
npm run build    # Build to dist/
npm run preview  # Preview built site
npm run deploy   # Build locally + upload dist/ to Netlify production
```

**Deploy is local-only.** We don't burn Netlify build minutes — the `deploy` script runs `astro build` locally and uploads `dist/` via the Netlify CLI. `netlify.toml` has a no-op `command` so even if the Git integration triggers, Netlify won't actually build. Branch deploys and Deploy Previews are also no-op'd in `netlify.toml`. Pushing to `main` does NOT auto-deploy — run `npm run deploy` manually.

Cache headers configured in `netlify.toml`:
- `/assets/*` and `/content/images/*`: immutable, 1-year cache
- `/*.html`: no cache, must-revalidate

## Scripts

- `scripts/extract-content.mjs` — Original Ghost export extraction script
- `scripts/localize-images.mjs` — Downloads external images and updates markdown references
- `scripts/generate-redirects.mjs` — Generates `public/_redirects` from `src/data/products.json` (runs as `npm prebuild`)
- `scripts/migrate-affiliate-links.mjs` — One-time migration: rewrites inline Amazon URLs to `/go/<slug>` cloaking (kept as record of the migration)

## Amazon Affiliate System

Mirrors the pattern from `~/projects/paintballer` and `~/projects/modernpb.com`.

- **Associate tag**: `lefthanded-io-20`
- **Source of truth**: `src/data/products.json` — slug-keyed map of `{ asin, name, query? }`
- **Cloaked redirects**: content links to `/go/<slug>`; Netlify 302s to `https://www.amazon.com/dp/<ASIN>?tag=lefthanded-io-20` (or `/s?k=<query>&tag=...` if no ASIN)
- **Generation**: `scripts/generate-redirects.mjs` reads `products.json` and writes `public/_redirects` (auto-runs on `npm run build` via `prebuild` hook)
- **Disclosures**: `/disclosures/` page (linked in footer) per Amazon Associates ToS
- **CTA convention**: `<a href="/go/<slug>" rel="nofollow sponsored noopener" target="_blank">Check Amazon Price</a>`
- **No price display**: Amazon Operating Agreement Section 5 prohibits cached prices without PA-API access. Don't list prices on the site.
- **Adding a product**: append a slug-keyed entry to `products.json` (with ASIN and name), then reference it in content as `/go/<slug>`. The redirect is generated on the next build.

## SEO Tools (Global)

- **seo-pulse** — Search engine feedback loop for content optimization
  ```bash
  seo-pulse write sc-domain:lefthanded.io --content-dir .  # Interactive optimization from GSC/Bing data
  seo-pulse read sc-domain:lefthanded.io                   # View search performance report
  seo-pulse read sc-domain:lefthanded.io --cached          # Use cached data (faster)
  ```
- **internal-linker** — SEO audit and internal linking for Astro projects
  ```bash
  internal-linker              # Run all checks (from project root)
  internal-linker scan         # Find internal linking opportunities
  internal-linker seo          # Run SEO audit (missing H1s, descriptions, etc.)
  internal-linker orphans      # Find pages with no incoming links
  internal-linker links        # Check for broken links
  ```
