#!/usr/bin/env node

/**
 * fetch-pexels-covers.mjs
 *
 * Fetches Pexels cover images for articles whose featuredImage is broken
 * (29-byte 404-stub HTML files mistakenly named .jpg). Downloads the new
 * image to public/content/images/covers/<slug>.jpg and rewrites the
 * post's featuredImage frontmatter.
 *
 * Mirrors ~/projects/modernpb.com/scripts/fetch-covers.mjs.
 *
 * Usage: node scripts/fetch-pexels-covers.mjs
 * Requires PEXELS_KEY in env.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');
const COVERS_DIR = path.join(ROOT, 'public', 'content', 'images', 'covers');

if (!process.env.PEXELS_KEY) { console.error('PEXELS_KEY missing'); process.exit(1); }

// Article slug → Pexels search query
const QUERIES = {
  'best-left-handed-kitchen-knives': 'chef knife kitchen cutting',
  'should-i-learn-guitar-left-or-right-handed': 'acoustic guitar player',
  'should-i-correct-my-left-handed-child': 'child writing pencil paper',
  'left-handed-mouse-vs-ambidextrous-mouse': 'computer mouse desk hand',
  'left-handedness-and-longevity': 'elderly hands holding',
  'best-left-handed-childrens-scissors': 'kids craft scissors paper cutting',
};

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
  return res.json();
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 5000) return false;
  fs.writeFileSync(dest, buffer);
  return true;
}

function rewriteFrontmatter(slug, newImagePath) {
  const filepath = path.join(POSTS_DIR, `${slug}.md`);
  let content = fs.readFileSync(filepath, 'utf-8');
  // Replace existing featuredImage line
  const before = content;
  content = content.replace(
    /^featuredImage:\s*[\"']?([^\"\n']+)[\"']?$/m,
    `featuredImage: "${newImagePath}"`
  );
  if (content === before) {
    console.log(`    ! frontmatter unchanged for ${slug}`);
    return false;
  }
  fs.writeFileSync(filepath, content);
  return true;
}

async function main() {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  let success = 0, failed = 0;

  for (const [slug, query] of Object.entries(QUERIES)) {
    process.stdout.write(`  ${slug} (q: "${query}") ... `);
    try {
      const data = await searchPexels(query);
      const photos = data.photos || [];
      if (photos.length === 0) { console.log('no results'); failed++; continue; }

      // Pick the first landscape photo with reasonable dimensions
      const pick = photos.find(p => p.width >= 1200) || photos[0];
      const imgUrl = pick.src.large2x || pick.src.large || pick.src.original;
      const dest = path.join(COVERS_DIR, `${slug}.jpg`);
      const ok = await downloadImage(imgUrl, dest);
      if (!ok) { console.log('download failed'); failed++; continue; }

      const newPath = `/content/images/covers/${slug}.jpg`;
      const written = rewriteFrontmatter(slug, newPath);
      if (written) {
        const size = fs.statSync(dest).size;
        console.log(`✓ ${pick.width}x${pick.height} ${(size/1024).toFixed(0)}KB — by ${pick.photographer}`);
        success++;
      } else {
        failed++;
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nSuccess: ${success}, failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
