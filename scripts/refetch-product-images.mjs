#!/usr/bin/env node

/**
 * refetch-product-images.mjs
 *
 * SerpAPI returned tiny narrow thumbnails (often 100x300 strips). This
 * script re-downloads larger, square-ish images for every product with
 * an ASIN, using SerpAPI's amazon_product engine and pulling the
 * higher-resolution URL from the response (usually accessible via the
 * `images` array or by URL-transforming the thumbnail to a larger size
 * variant).
 *
 * Strategy:
 *  1. For each product with an asin, hit amazon_product engine.
 *  2. Use product.images[0].link if present (full-size).
 *  3. Otherwise transform thumbnail URL: replace _AC_UY300_ / _SY300_ /
 *     _SL75_ etc. with _SL500_ for a 500px version.
 *  4. Validate the downloaded image is at least 200x200 before saving.
 *
 * Usage: node scripts/refetch-product-images.mjs [--all]
 *  --all   refetch even products that already have a "good" image
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'content', 'images', 'products');

if (!process.env.SERPAPI_KEY) { console.error('SERPAPI_KEY missing'); process.exit(1); }

const ALL = process.argv.includes('--all');

function dimensions(filepath) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}"`, { encoding: 'utf-8' });
    const w = parseInt(out.match(/pixelWidth:\s*(\d+)/)?.[1] || '0');
    const h = parseInt(out.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');
    return { w, h };
  } catch {
    return { w: 0, h: 0 };
  }
}

function isGoodSize(filepath) {
  const { w, h } = dimensions(filepath);
  if (w === 0 || h === 0) return false;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);
  // Need both dimensions ≥ 200, and aspect ratio ≤ 2:1
  return minDim >= 200 && maxDim / minDim <= 2.0;
}

function upgradeAmazonUrl(url) {
  if (!url) return url;
  // Amazon image URLs have size suffixes like _AC_UY300_, _SY300_, _SL75_, _SX300_
  // Replace any size suffix with _SL500_ for a 500px square-fit version.
  // Also handle URLs without a size suffix (just .jpg) — they're already full-size.
  return url.replace(/\._[A-Z][A-Z_0-9]*_\.jpg/i, '._SL500_.jpg');
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return false; // Sanity check
    fs.writeFileSync(dest, buffer);
    return true;
  } catch {
    return false;
  }
}

async function fetchProductImages(asin) {
  const url = `https://serpapi.com/search.json?engine=amazon_product&asin=${asin}&amazon_domain=amazon.com&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const p = data.product_results || {};
  const candidates = [];
  // Try high-res from images array first
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      if (img.link) candidates.push(img.link);
    }
  }
  // Then thumbnails (usually larger than the single thumbnail field)
  if (Array.isArray(p.thumbnails)) {
    for (const t of p.thumbnails) {
      if (typeof t === 'string') candidates.push(t);
      else if (t.link) candidates.push(t.link);
    }
  }
  // Single thumbnail as last resort
  if (p.thumbnail) candidates.push(p.thumbnail);
  return candidates;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
  const slugs = Object.keys(products).filter(s => products[s].asin);

  console.log(`Checking ${slugs.length} products with ASINs...\n`);

  let upgraded = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    const dest = path.join(IMAGES_DIR, `${slug}.jpg`);
    const exists = fs.existsSync(dest);

    if (!ALL && exists && isGoodSize(dest)) {
      skipped++;
      continue;
    }

    const before = exists ? dimensions(dest) : { w: 0, h: 0 };
    process.stdout.write(`  ${slug} (${before.w}x${before.h}) → `);

    try {
      const candidates = await fetchProductImages(products[slug].asin);
      // Try each candidate, and also try upgraded versions
      const tryUrls = [];
      for (const c of candidates) {
        tryUrls.push(c);
        const up = upgradeAmazonUrl(c);
        if (up !== c) tryUrls.push(up);
      }

      let found = false;
      for (const url of tryUrls) {
        const ok = await downloadImage(url, dest);
        if (!ok) continue;
        const after = dimensions(dest);
        const minDim = Math.min(after.w, after.h);
        if (minDim >= 200) {
          console.log(`${after.w}x${after.h} ✓`);
          upgraded++;
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`no usable image found`);
        failed++;
      }

      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nUpgraded: ${upgraded}, skipped (already good): ${skipped}, failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
