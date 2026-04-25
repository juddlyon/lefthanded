#!/usr/bin/env node

/**
 * force-fetch.mjs
 *
 * Bypass the strict isGoodMatch check in fetch-products.mjs.
 * For specified slugs, accept the first SerpAPI result regardless of match
 * quality — useful for niche products where Amazon's listing title doesn't
 * contain the exact "left-handed" keyword we're searching for.
 *
 * Usage: node scripts/force-fetch.mjs <slug> [<slug>...]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'content', 'images', 'products');
const SERPAPI_BASE = 'https://serpapi.com/search.json';

if (!process.env.SERPAPI_KEY) {
  console.error('SERPAPI_KEY missing in env');
  process.exit(1);
}

const slugs = process.argv.slice(2);
if (slugs.length === 0) {
  console.error('Usage: node scripts/force-fetch.mjs <slug> [<slug>...]');
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function fetchSlug(slug) {
  const entry = products[slug];
  if (!entry) {
    console.log(`  ${slug}: not in products.json`);
    return;
  }
  const query = entry.query || entry.name || slug.replace(/-/g, ' ');
  const url = `${SERPAPI_BASE}?engine=amazon&amazon_domain=amazon.com&k=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`;
  process.stdout.write(`  ${slug} ... `);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    const result = (data.organic_results || data.shopping_results || [])[0];
    if (!result) {
      console.log('no result');
      return;
    }
    const asin = result.asin || '';
    const thumb = result.thumbnail || result.image || '';
    const title = result.title || '';
    const price = result.price?.raw || (result.extracted_price ? `$${result.extracted_price}` : '');

    if (!thumb || !asin) {
      console.log('no thumb/asin');
      return;
    }

    // Upgrade Amazon image URL to a larger size (replaces _UY300_ etc. with _SL500_)
    const upgraded = thumb.replace(/\._[A-Z][A-Z_0-9]*_\.jpg/i, '._SL500_.jpg');

    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    const dest = path.join(IMAGES_DIR, `${slug}.jpg`);
    let ok = await downloadImage(upgraded, dest);
    if (!ok) ok = await downloadImage(thumb, dest);
    if (!ok) {
      console.log('download failed');
      return;
    }

    products[slug] = {
      ...entry,
      asin,
      title,
      ...(price ? { price } : {}),
      image: `/content/images/products/${slug}.jpg`,
      last_fetched: new Date().toISOString().slice(0, 10),
    };

    console.log(`✓ ${asin} ${price} — ${title.slice(0, 60)}`);
  } catch (err) {
    console.log(`error: ${err.message}`);
  }
}

for (const slug of slugs) {
  await fetchSlug(slug);
  if (slugs.length > 1) await new Promise((r) => setTimeout(r, 1500));
}

fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n');
console.log(`\n✓ Updated products.json`);
