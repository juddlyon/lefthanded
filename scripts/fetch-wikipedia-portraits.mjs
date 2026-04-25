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

// slug → Wikipedia page title (URL-encoded form Wikipedia expects)
const PORTRAITS = {
  // For individual "is X left-handed" posts
  'donald-trump': 'Donald_Trump',
  'jayden-daniels': 'Jayden_Daniels',
  'tua-tagovailoa': 'Tua_Tagovailoa',

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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const meta = fs.existsSync(META_PATH) ? JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) : {};
  let success = 0, failed = 0, skipped = 0;

  for (const [slug, title] of Object.entries(PORTRAITS)) {
    const dest = path.join(OUT_DIR, `${slug}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000 && meta[slug]) {
      skipped++;
      continue;
    }
    process.stdout.write(`  ${slug} (${title}) ... `);
    try {
      const summary = await fetchSummary(title);
      const imgUrl = summary.thumbnail?.source || summary.originalimage?.source;
      if (!imgUrl) { console.log('no image in summary'); failed++; continue; }

      const ok = await downloadImage(imgUrl, dest);
      if (!ok) { console.log('download failed'); failed++; continue; }

      // Wikipedia thumbnails are CC-BY-SA or PD; record source URL for attribution.
      meta[slug] = {
        name: summary.title,
        description: summary.description || '',
        wikipedia_url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`,
        image_path: `/content/images/portraits/${slug}.jpg`,
        source_image_url: imgUrl,
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
