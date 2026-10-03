#!/usr/bin/env node

/**
 * fetch-products.mjs
 *
 * Fetches Amazon product data via SerpAPI for the curated list in
 * scripts/products-input.json and writes:
 *   - src/data/products.json                 (read by src/lib/products.ts)
 *   - public/content/images/products/*.jpg   (product thumbnails)
 *   - public/_redirects                      (via scripts/generate-redirects.mjs)
 *
 * Mirrors ~/projects/kixszn and ~/projects/tcgolfcenter.com.
 *
 * Usage:
 *   node scripts/fetch-products.mjs                 # fetch input entries not yet in products.json
 *   node scripts/fetch-products.mjs --all           # refetch every input entry
 *   node scripts/fetch-products.mjs --dry-run       # preview without writing
 *   node scripts/fetch-products.mjs --refresh slug  # refetch one product
 *
 * Requires SERPAPI_KEY in the shell environment (or .env).
 *
 * Every product gets a link, in this order of preference:
 *   direct  exact Amazon match: every `must` token appears in the Amazon brand
 *           + title and no `reject` token does. /go/<slug> → /dp/<asin>.
 *   brand   the input entry has `url` and `store` (makers that do not sell on
 *           Amazon). Links to the maker's site, no affiliate tag.
 *   search  no exact match. /go/<slug> → Amazon search for `query`.
 *
 * Entries in products.json that are not in the input file (added by hand
 * before the input file existed) are left untouched. `--refresh` on one of
 * those refetches by its stored ASIN.
 *
 * Prices are never stored or displayed (Amazon Operating Agreement § 5).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const INPUT_PATH = join(__dirname, 'products-input.json');
const PRODUCTS_PATH = join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = join(ROOT, 'public', 'content', 'images', 'products');
const SERPAPI_BASE = 'https://serpapi.com/search.json';
const DELAY_MS = 1000;

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
const ALL = args.includes('--all');
const refreshIdx = args.indexOf('--refresh');
const REFRESH_SLUG = refreshIdx !== -1 ? args[refreshIdx + 1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function searchProduct(query, asin) {
  const apiKey = process.env.SERPAPI_KEY;
  const url = asin
    ? `${SERPAPI_BASE}?engine=amazon_product&asin=${encodeURIComponent(asin)}&amazon_domain=amazon.com&api_key=${apiKey}`
    : `${SERPAPI_BASE}?engine=amazon&amazon_domain=amazon.com&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// First organic result whose brand + title contains every `must` token and
// none of the `reject` tokens.
function pickFromSearch(data, must = [], reject = []) {
  const results = (data.organic_results || []).filter((r) => r.asin && r.title && !r.sponsored);
  for (const item of results.slice(0, 20)) {
    const fullTitle = item.brand && !item.title.includes(item.brand) ? `${item.brand} ${item.title}` : item.title;
    const hay = ` ${norm(fullTitle)} `;
    if (reject.some((token) => hay.includes(` ${norm(token)} `))) continue;
    if (must.every((token) => hay.includes(norm(token)))) {
      return { asin: item.asin, title: fullTitle, thumbnail: item.thumbnail || '' };
    }
  }
  return null;
}

function pickFromProduct(data) {
  const product = data.product_results || {};
  if (!product.asin) return null;
  return {
    asin: product.asin,
    title: product.title || '',
    thumbnail: product.thumbnail || product.thumbnails?.[0] || product.main_image || '',
  };
}

// SerpAPI thumbnails are small and often narrow strips. Amazon serves a
// 500px version at the same URL with the size suffix swapped for _SL500_.
const upgradeAmazonUrl = (url) => url.replace(/\._[A-Z][A-Z_0-9,]*_\.jpg/i, '._SL500_.jpg');

async function downloadImage(imageUrl, destPath) {
  for (const url of new Set([upgradeAmazonUrl(imageUrl), imageUrl])) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000) continue;
      writeFileSync(destPath, buffer);
      return true;
    } catch {
      // try the next candidate
    }
  }
  return false;
}

async function main() {
  loadEnv();

  const input = JSON.parse(readFileSync(INPUT_PATH, 'utf-8'));
  const products = JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8'));

  let toProcess;
  if (REFRESH_SLUG) {
    toProcess = input.filter((p) => p.slug === REFRESH_SLUG);
    if (toProcess.length === 0 && products[REFRESH_SLUG]) {
      const legacy = products[REFRESH_SLUG];
      toProcess = [{ slug: REFRESH_SLUG, name: legacy.name, query: legacy.query || legacy.name, asin: legacy.asin, must: [] }];
    }
    if (toProcess.length === 0) {
      console.error(`Slug "${REFRESH_SLUG}" not found in products-input.json or products.json`);
      process.exit(1);
    }
  } else {
    toProcess = ALL ? input : input.filter((p) => !products[p.slug]);
  }

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Processing ${toProcess.length} products...\n`);

  for (const [i, { slug, query, name, must, reject, asin, url, store }] of toProcess.entries()) {
    if (url) {
      products[slug] = { name, url, store, last_fetched: today() };
      console.log(`  → ${slug}: ${store} site`);
      continue;
    }
    try {
      const data = await searchProduct(query, asin);
      const result = asin ? pickFromProduct(data) : pickFromSearch(data, must, reject);

      if (!result) {
        console.log(`  ✗ ${slug}: no exact match (Amazon search link)`);
        products[slug] = { name, query, last_fetched: today() };
      } else {
        const entry = { asin: result.asin, name, title: result.title, query, last_fetched: today() };
        if (result.thumbnail && !DRY_RUN) {
          mkdirSync(IMAGES_DIR, { recursive: true });
          if (await downloadImage(result.thumbnail, join(IMAGES_DIR, `${slug}.jpg`))) {
            entry.image = `/content/images/products/${slug}.jpg`;
          }
        }
        console.log(`  ✓ ${slug}: ${result.asin} | ${result.title.slice(0, 90)}`);
        products[slug] = entry;
      }
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}`);
    }
    if (i < toProcess.length - 1) await sleep(DELAY_MS);
  }

  if (DRY_RUN) return;

  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n');
  execFileSync('node', [join(__dirname, 'generate-redirects.mjs')], { stdio: 'inherit' });

  const all = Object.values(products);
  const direct = all.filter((p) => p.asin).length;
  const brand = all.filter((p) => !p.asin && p.url).length;
  console.log(`✓ ${all.length} products: ${direct} direct, ${all.length - direct - brand} Amazon search, ${brand} brand links.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
