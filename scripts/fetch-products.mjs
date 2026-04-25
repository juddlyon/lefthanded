#!/usr/bin/env node

/**
 * fetch-products.mjs
 *
 * Enriches src/data/products.json with real Amazon product data from SerpAPI:
 *   - actual title (overrides any placeholder name)
 *   - price (informational only — DO NOT display per Amazon Operating Agreement § 5)
 *   - downloaded thumbnail image to public/content/images/products/<slug>.jpg
 *   - last_fetched timestamp
 *
 * Mirrors ~/projects/modernpb.com/scripts/fetch-products.mjs but adapted for
 * lefthanded.io's JSON-based product store and Astro layout.
 *
 * Usage:
 *   node scripts/fetch-products.mjs                # fetch all products
 *   node scripts/fetch-products.mjs --dry-run      # preview without writing
 *   node scripts/fetch-products.mjs --refresh slug # refresh a single slug
 *   node scripts/fetch-products.mjs --missing-only # only products without an image
 *
 * Requires SERPAPI_KEY in shell environment (or .env).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PRODUCTS_PATH = join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = join(ROOT, 'public', 'content', 'images', 'products');
const SERPAPI_BASE = 'https://serpapi.com/search.json';
const DELAY_MS = 2000;

function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  }
  if (!process.env.SERPAPI_KEY) {
    console.error('SERPAPI_KEY not found. Set it in .env or shell environment.');
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const MISSING_ONLY = args.includes('--missing-only');
const refreshIdx = args.indexOf('--refresh');
const REFRESH_SLUG = refreshIdx !== -1 ? args[refreshIdx + 1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function searchProduct(query, asin) {
  const apiKey = process.env.SERPAPI_KEY;
  let url;
  if (asin) {
    url = `${SERPAPI_BASE}?engine=amazon_product&asin=${encodeURIComponent(asin)}&amazon_domain=amazon.com&api_key=${apiKey}`;
  } else {
    url = `${SERPAPI_BASE}?engine=amazon&amazon_domain=amazon.com&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function extractFromSearch(data) {
  const results = data.organic_results || data.shopping_results || [];
  if (results.length === 0) return null;
  const item = results[0];
  return {
    asin: item.asin || '',
    title: item.title || '',
    price: item.price?.raw || (item.extracted_price ? `$${item.extracted_price}` : ''),
    thumbnail: item.thumbnail || item.image || '',
  };
}

function extractFromProduct(data) {
  const product = data.product_results || {};
  const price = typeof product.price === 'string'
    ? product.price
    : (product.price?.raw || product.price?.current || (product.extracted_price ? `$${product.extracted_price}` : ''));
  return {
    asin: product.asin || '',
    title: product.title || '',
    price,
    thumbnail: product.thumbnail || product.thumbnails?.[0] || product.main_image || '',
  };
}

function isGoodMatch(query, result, slug) {
  if (!result || !result.asin || !result.title) return false;
  const titleLower = result.title.toLowerCase();

  // Reject obvious mismatches for left-handed niche
  const reject = [/replacement parts? only/i, /spare\s+blade/i];
  for (const r of reject) if (r.test(result.title)) return false;

  // Distinctive slug words must appear in title
  const slugWords = slug.split('-').filter((w) => w.length > 2);
  const generic = new Set(['lefty', 'left', 'handed', 'kids', 'set', 'pack', 'inch', 'with', 'and']);
  const distinctive = slugWords.filter((w) => !generic.has(w));
  const matches = distinctive.filter((w) => titleLower.includes(w));
  if (distinctive.length === 0) return true;
  return matches.length / distinctive.length >= 0.4;
}

async function downloadImage(imageUrl, destPath) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

function imageExistsOnDisk(slug) {
  return existsSync(join(IMAGES_DIR, `${slug}.jpg`));
}

async function main() {
  loadEnv();
  const products = JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8'));

  let slugs = Object.keys(products);
  if (REFRESH_SLUG) {
    if (!products[REFRESH_SLUG]) {
      console.error(`Slug "${REFRESH_SLUG}" not in products.json`);
      process.exit(1);
    }
    slugs = [REFRESH_SLUG];
  } else if (MISSING_ONLY) {
    slugs = slugs.filter((s) => !imageExistsOnDisk(s) || !products[s].image);
  }

  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Processing ${slugs.length} products...\n`);

  if (!DRY_RUN) mkdirSync(IMAGES_DIR, { recursive: true });

  let apiCalls = 0;
  let skipped = 0;
  let downloaded = 0;
  let failed = 0;

  for (const slug of slugs) {
    const entry = products[slug];
    process.stdout.write(`  ${slug} ... `);

    try {
      const haveImage = imageExistsOnDisk(slug);
      const haveAsin = entry.asin && entry.asin.trim() !== '';
      const haveTitle = entry.title || entry.name;

      // Skip if everything is already populated
      if (haveImage && haveAsin && haveTitle && entry.last_fetched && !REFRESH_SLUG && !MISSING_ONLY) {
        console.log('skip (already complete)');
        skipped++;
        continue;
      }

      const query = entry.query || entry.name || slug.replace(/-/g, ' ');
      const data = await searchProduct(query, haveAsin ? entry.asin : null);
      const result = haveAsin ? extractFromProduct(data) : extractFromSearch(data);

      const goodMatch = haveAsin ? (result && result.asin) : isGoodMatch(query, result, slug);

      if (!result || !result.asin || !goodMatch) {
        console.log(`no good match (kept entry as search fallback)`);
        // Keep entry as-is — generate-redirects.mjs will use search fallback
        products[slug] = {
          ...entry,
          last_fetched: today(),
        };
        apiCalls++;
        if (apiCalls < slugs.length) await sleep(DELAY_MS);
        continue;
      }

      const updated = {
        asin: result.asin || entry.asin || '',
        name: entry.name || result.title,
        title: result.title,
      };
      if (result.price) updated.price = result.price;
      if (entry.query) updated.query = entry.query;

      const imagePath = `/content/images/products/${slug}.jpg`;
      if (!haveImage && result.thumbnail && !DRY_RUN) {
        const ok = await downloadImage(result.thumbnail, join(IMAGES_DIR, `${slug}.jpg`));
        if (ok) {
          updated.image = imagePath;
          downloaded++;
          process.stdout.write('img✓ ');
        } else {
          failed++;
          process.stdout.write('img✗ ');
        }
      } else if (haveImage) {
        updated.image = imagePath;
      }

      updated.last_fetched = today();
      products[slug] = updated;

      console.log(`${result.asin}${result.price ? ' ' + result.price : ''}`);
      apiCalls++;
      if (apiCalls < slugs.length) await sleep(DELAY_MS);
    } catch (err) {
      console.log(`error: ${err.message}`);
      failed++;
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would update products.json (${Object.keys(products).length} entries)`);
    return;
  }

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n');
  console.log(`\n✓ Wrote ${Object.keys(products).length} products to ${PRODUCTS_PATH.replace(ROOT + '/', '')}`);
  console.log(`  ${apiCalls} API calls, ${downloaded} images downloaded, ${skipped} skipped, ${failed} failed`);
  console.log(`\nNext: rebuild to regenerate _redirects: npm run build`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
