#!/usr/bin/env node

/**
 * cardify-listicles.mjs
 *
 * One-time transformer: converts the existing "h3 → figure → first <p>" pattern
 * in product listicles into the proper kg-product-card markup.
 *
 * For each h3 that links to /go/<slug>:
 *  1. Match the h3 + (figure with same /go/<slug>) + first following <p>
 *  2. Replace with: h3 + kg-product-card (image, title, description, button)
 *
 * The figure and first <p> are removed; everything else (Pros, Cons, review
 * prose) stays untouched. Image source is rewritten to /content/images/products/<slug>.jpg
 * if that file exists locally, otherwise omitted.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');
const PRODUCTS_DIR = path.join(ROOT, 'public', 'content', 'images', 'products');

const TARGETS = [
  'best-gifts-for-left-handed-people.md',
  'best-left-handed-drill-bits.md',
  'best-left-handed-gaming-mouse.md',
  'best-left-handed-notebooks.md',
  'best-left-handed-scissors.md',
  'best-left-handed-spatulas.md',
  'best-lefthanded-can-opener.md',
];

function imagePathForSlug(slug) {
  const localPath = path.join(PRODUCTS_DIR, `${slug}.jpg`);
  if (fs.existsSync(localPath)) return `/content/images/products/${slug}.jpg`;
  return null;
}

function buildCard({ slug, title, description, imagePath, alt }) {
  const safeAlt = (alt || title).replace(/"/g, '&quot;');
  const imageBlock = imagePath
    ? `\n    <a href="/go/${slug}" target="_blank" rel="nofollow sponsored noopener"><img src="${imagePath}" class="kg-product-card-image" loading="lazy" alt="${safeAlt}"></a>`
    : '';
  return `<div class="kg-card kg-product-card">
  <div class="kg-product-card-container">${imageBlock}
    <div class="kg-product-card-title-container">
      <h4 class="kg-product-card-title"><span style="white-space: pre-wrap;">${title}</span></h4>
    </div>
    <div class="kg-product-card-description"><p>${description}</p></div>
    <a class="kg-product-card-button kg-product-card-btn-accent" href="/go/${slug}" target="_blank" rel="nofollow sponsored noopener"><span>Check Amazon Price</span></a>
  </div>
</div>`;
}

function transform(content) {
  // Pattern: <h3 id="..."><a href="/go/SLUG" ...>TITLE</a></h3>
  //          <figure class="kg-card kg-image-card"><a href="/go/SLUG" ...><img src="OLD_IMG" ... alt="ALT" ...></a></figure>
  //          <p>FIRST_PARA</p>
  //
  // Captures across whitespace. The figure may also use /go/<slug> as the inner href.
  const re = /<(h2|h3) id="([^"]+)">\s*<a\s+href="\/go\/([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/\1>\s*<figure[^>]*class="[^"]*kg-image-card[^"]*"[^>]*>\s*(?:<a[^>]*>)?\s*<img[^>]*?(?:alt="([^"]*)")?[^>]*>\s*(?:<\/a>)?\s*<\/figure>\s*<p>([\s\S]*?)<\/p>/g;

  let count = 0;
  const out = content.replace(re, (m, hTag, hid, slug, title, alt, firstPara) => {
    count++;
    const imagePath = imagePathForSlug(slug);
    const card = buildCard({ slug, title: title.trim(), description: firstPara.trim(), imagePath, alt });
    return `<${hTag} id="${hid}"><a href="/go/${slug}" target="_blank" rel="nofollow sponsored noopener">${title}</a></${hTag}>\n${card}`;
  });

  return { out, count };
}

function main() {
  let totalCards = 0;
  for (const filename of TARGETS) {
    const filepath = path.join(POSTS_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.log(`  SKIP (missing): ${filename}`);
      continue;
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    const { out, count } = transform(content);
    if (count > 0) {
      fs.writeFileSync(filepath, out);
      console.log(`  ✓ ${filename}: ${count} cards added`);
      totalCards += count;
    } else {
      console.log(`  - ${filename}: no matches (may already be converted)`);
    }
  }
  console.log(`\nTotal: ${totalCards} cards added across ${TARGETS.length} files`);
}

main();
