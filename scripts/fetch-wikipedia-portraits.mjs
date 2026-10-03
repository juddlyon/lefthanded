#!/usr/bin/env node

/**
 * fetch-wikipedia-portraits.mjs
 *
 * Fetches thumbnail portraits + attribution from the Wikipedia REST summary
 * API and saves them to public/content/images/portraits/<slug>.jpg.
 * Writes attribution metadata to src/data/portraits.json so templates can
 * generate proper credit captions.
 *
 * Usage: node scripts/fetch-wikipedia-portraits.mjs
 *
 * Idempotent — skips if the portrait file already exists and is non-empty.
 * Edit PORTRAITS below to add new entries.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'content', 'images', 'portraits');
const META_PATH = path.join(ROOT, 'src', 'data', 'portraits.json');

// Slugs that get a larger image (used as a featured/hero image, not just a
// gallery thumbnail). The fetcher rewrites the Wikipedia thumb URL to request
// 1280px instead of the 320px default.
//
// Hero images are saved with a -v<N> suffix because /content/images/* is
// served with `Cache-Control: immutable` — replacing the file at the same URL
// won't bust the CDN edge cache. Bump HERO_VERSION when re-fetching.
const HERO_SLUGS = new Set([
  'donald-trump', 'jayden-daniels', 'tua-tagovailoa',
  'john-cena', 'taylor-swift', 'jim-carrey', 'tom-cruise',
  'matt-damon', 'emma-watson', 'jimmy-page',
]);
const HERO_SIZE = 1280;
const HERO_VERSION = 'v2';

// slug → Wikipedia page title (URL-encoded form Wikipedia expects)
const PORTRAITS = {
  // For individual "is X left-handed" posts (used as featured image)
  'donald-trump': 'Donald_Trump',
  'jayden-daniels': 'Jayden_Daniels',
  'tua-tagovailoa': 'Tua_Tagovailoa',
  'john-cena': 'John_Cena',
  'taylor-swift': 'Taylor_Swift',
  'jim-carrey': 'Jim_Carrey',
  'tom-cruise': 'Tom_Cruise',
  'matt-damon': 'Matt_Damon',
  'emma-watson': 'Emma_Watson', // hero is a manual override (emma-watson-v3.jpg, Commons 2012 Shankbone); the Wikipedia lead image is low-res
  'jimmy-page': 'Jimmy_Page',

  // For the famous-left-handed-people hub gallery
  'paul-mccartney': 'Paul_McCartney',
  'jimi-hendrix': 'Jimi_Hendrix',
  'kurt-cobain': 'Kurt_Cobain',
  'lady-gaga': 'Lady_Gaga',
  'barack-obama': 'Barack_Obama',
  'bill-clinton': 'Bill_Clinton',
  'prince-william': 'William,_Prince_of_Wales',
  'leonardo-da-vinci': 'Leonardo_da_Vinci',
  'oprah-winfrey': 'Oprah_Winfrey',
  'babe-ruth': 'Babe_Ruth',
  'lebron-james': 'LeBron_James',
  'rafael-nadal': 'Rafael_Nadal',
  'keanu-reeves': 'Keanu_Reeves',
  'morgan-freeman': 'Morgan_Freeman',
  'bill-gates': 'Bill_Gates',
};

async function fetchSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'lefthanded.io content fetcher (jl@juddlyon.com)' },
  });
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
  return res.json();
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'lefthanded.io content fetcher (jl@juddlyon.com)' },
  });
  if (!res.ok) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) return false;
  fs.writeFileSync(dest, buffer);
  return true;
}

// Wikipedia returns thumbnail URLs of the form:
//   https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/File.jpg/320px-File.jpg
// Replacing "320px" with a larger value yields a higher-resolution thumbnail
// without having to download the original (which can be huge).
function rescaleWikipediaUrl(url, size) {
  return url.replace(/\/(\d+)px-/, `/${size}px-`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) : {};
  let success = 0, failed = 0, skipped = 0;

  for (const [slug, title] of Object.entries(PORTRAITS)) {
    const isHero = HERO_SLUGS.has(slug);
    // Hero images use a versioned filename so cache-bust is automatic when
    // HERO_VERSION is bumped.
    const filename = isHero ? `${slug}-${HERO_VERSION}.jpg` : `${slug}.jpg`;
    const dest = path.join(OUT_DIR, filename);
    const expectedSize = isHero ? 80000 : 5000; // hero images should be ~100KB+
    if (
      fs.existsSync(dest) && fs.statSync(dest).size > expectedSize && meta[slug] &&
      (meta[slug].is_hero === isHero)
    ) {
      skipped++;
      continue;
    }
    process.stdout.write(`  ${slug} (${title})${isHero ? ' [hero]' : ''} ... `);
    try {
      const summary = await fetchSummary(title);
      let imgUrl = summary.thumbnail?.source || summary.originalimage?.source;
      if (!imgUrl) { console.log('no image in summary'); failed++; continue; }
      if (isHero) imgUrl = rescaleWikipediaUrl(imgUrl, HERO_SIZE);

      const ok = await downloadImage(imgUrl, dest);
      if (!ok) { console.log('download failed'); failed++; continue; }

      // Wikipedia thumbnails are CC-BY-SA or PD; record source URL for attribution.
      meta[slug] = {
        name: summary.title,
        description: summary.description || '',
        wikipedia_url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
        image_path: `/content/images/portraits/${filename}`,
        source_image_url: imgUrl,
        is_hero: isHero,
        version: isHero ? HERO_VERSION : null,
        fetched_at: new Date().toISOString().slice(0, 10),
      };

      const size = fs.statSync(dest).size;
      console.log(`✓ ${(size/1024).toFixed(0)}KB`);
      success++;
      // Be polite to Wikipedia — small delay between calls.
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.log(`error: ${err.message}`);
      failed++;
    }
  }

  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');
  console.log(`\nSuccess: ${success}, skipped: ${skipped}, failed: ${failed}`);
  console.log(`Metadata written to ${path.relative(ROOT, META_PATH)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
