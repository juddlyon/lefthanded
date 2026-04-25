#!/usr/bin/env node

/**
 * One-time migration: rewrite inline Amazon URLs in src/content/posts/*.md
 * to use the cloaked /go/<slug> pattern.
 *
 * Why:
 *  - Some links use only ?ref=lefthanded.io (a self-tracking param, not the
 *    Amazon Associates tag) — these earn $0.
 *  - amzn.to short links may or may not be tagged; we can't tell.
 *  - Cloaking via /go/<slug> fixes both problems and centralizes the tag.
 *
 * Behavior:
 *  - Finds amazon.com/.../dp/<ASIN>... URLs. Looks up <ASIN> in products.json
 *    (slug → asin map, inverted for this script). If found, replaces href.
 *  - Finds known amzn.to short URLs, replaces using a hardcoded mapping.
 *  - Updates rel="..." on any anchor whose href becomes /go/... so it has
 *    nofollow + sponsored + noopener.
 *  - Reports per-file counts.
 *
 * Run once: node scripts/migrate-affiliate-links.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'products.json');
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');

// Hardcoded amzn.to → slug mapping (resolved by inspecting surrounding content).
const AMZN_SHORT_LINK_MAP = {
  '3SFjSc6': 'babolat-pure-aero',
  '48mgyZo': 'yonex-vcore-pro-97',
  '42K5kMU': 'yonex-ezone-100',
};

function buildAsinToSlug(products) {
  const map = new Map();
  for (const [slug, entry] of Object.entries(products)) {
    if (entry.asin) map.set(entry.asin.toUpperCase(), slug);
  }
  return map;
}

function rewriteFile(filepath, asinToSlug) {
  const original = fs.readFileSync(filepath, 'utf-8');
  let out = original;
  let urlReplacements = 0;
  let relUpdates = 0;
  const unmatched = [];

  // 1) Replace amazon.com URLs with /dp/<ASIN>... → /go/<slug>
  // Match the entire href value so we replace it cleanly. Handles both
  // raw URLs and HTML-encoded `&amp;`.
  out = out.replace(
    /https?:\/\/(?:www\.)?amazon\.com\/[^"\s]*?\/dp\/([A-Z0-9]{10})[^"]*/gi,
    (match, asin) => {
      const slug = asinToSlug.get(asin.toUpperCase());
      if (slug) {
        urlReplacements++;
        return `/go/${slug}`;
      }
      unmatched.push({ kind: 'amazon-asin', asin, snippet: match.slice(0, 80) });
      return match;
    }
  );

  // Some amazon.com URLs in this codebase use /dp/<ASIN> with query strings before the path:
  // e.g. https://www.amazon.com/dp/B0C42MQDJC?%3Fth=1&amp;psc=1&amp;tag=...
  // The regex above already handles that. Belt-and-suspenders pass for any
  // amazon.com URL we missed:
  out = out.replace(
    /https?:\/\/(?:www\.)?amazon\.com\/dp\/([A-Z0-9]{10})[^"]*/gi,
    (match, asin) => {
      const slug = asinToSlug.get(asin.toUpperCase());
      if (slug) {
        urlReplacements++;
        return `/go/${slug}`;
      }
      unmatched.push({ kind: 'amazon-asin', asin, snippet: match.slice(0, 80) });
      return match;
    }
  );

  // 2) Replace amzn.to short links using the hardcoded map.
  out = out.replace(
    /https?:\/\/amzn\.to\/([A-Za-z0-9]+)[^"]*/gi,
    (match, code) => {
      const slug = AMZN_SHORT_LINK_MAP[code];
      if (slug) {
        urlReplacements++;
        return `/go/${slug}`;
      }
      unmatched.push({ kind: 'amzn.to', code, snippet: match.slice(0, 80) });
      return match;
    }
  );

  // 3) For any anchor whose href is now /go/..., normalize the rel attribute
  //    to "nofollow sponsored noopener" and ensure target="_blank".
  out = out.replace(
    /<a\b([^>]*?)\bhref="(\/go\/[^"]+)"([^>]*)>/g,
    (match, before, href, after) => {
      const attrs = before + after;

      // Already correctly tagged?
      const hasNofollow = /\brel="[^"]*\bnofollow\b[^"]*"/.test(attrs);
      const hasSponsored = /\brel="[^"]*\bsponsored\b[^"]*"/.test(attrs);
      const hasNoopener = /\brel="[^"]*\bnoopener\b[^"]*"/.test(attrs);
      const hasTarget = /\btarget="_blank"/.test(attrs);

      if (hasNofollow && hasSponsored && hasNoopener && hasTarget) {
        return match;
      }

      relUpdates++;

      // Strip any existing rel="..." and target="..." then re-emit cleanly.
      let stripped = (before + after)
        .replace(/\srel="[^"]*"/g, '')
        .replace(/\starget="[^"]*"/g, '')
        .replace(/\s+/g, ' ')
        .trimEnd();
      if (stripped && !stripped.startsWith(' ')) stripped = ' ' + stripped;
      return `<a${stripped} href="${href}" target="_blank" rel="nofollow sponsored noopener">`;
    }
  );

  if (out !== original) {
    fs.writeFileSync(filepath, out);
  }

  return {
    file: path.basename(filepath),
    urlReplacements,
    relUpdates,
    unmatched,
    changed: out !== original,
  };
}

function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
  const asinToSlug = buildAsinToSlug(products);

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(POSTS_DIR, f));

  const results = files.map((f) => rewriteFile(f, asinToSlug));

  let totalUrls = 0;
  let totalRel = 0;
  const allUnmatched = [];

  for (const r of results) {
    if (r.changed) {
      console.log(`✓ ${r.file}: ${r.urlReplacements} URLs, ${r.relUpdates} rel attrs`);
    }
    totalUrls += r.urlReplacements;
    totalRel += r.relUpdates;
    allUnmatched.push(...r.unmatched.map((u) => ({ file: r.file, ...u })));
  }

  console.log('');
  console.log(`Total: ${totalUrls} URLs replaced, ${totalRel} rel attrs updated`);

  if (allUnmatched.length) {
    console.log('');
    console.log(`! ${allUnmatched.length} unmatched links (need manual handling or new products.json entry):`);
    for (const u of allUnmatched.slice(0, 20)) {
      console.log(`  ${u.file}: ${u.kind} ${u.asin || u.code} — ${u.snippet}`);
    }
    if (allUnmatched.length > 20) {
      console.log(`  (... ${allUnmatched.length - 20} more)`);
    }
  }
}

main();
