import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import * as cheerio from 'cheerio';

const GHOST_DIR = join(dirname(new URL(import.meta.url).pathname), '..', 'lefthanded.io');
const OUT_DIR = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'content', 'posts');

// Find all post/page HTML files (not tag/author/page pagination pages)
function findPostHtmlFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip non-post directories
      if (['tag', 'author', 'page', 'assets', 'content', 'public', 'rss', 'cdn-cgi', 'cdn.jsdelivr.net', 'plausible.io', 'members'].includes(entry)) continue;

      const indexPath = join(fullPath, 'index.html');
      if (existsSync(indexPath)) {
        files.push({ slug: entry, path: indexPath });
      }
    }
  }

  return files;
}

function extractPost(slug, htmlPath) {
  const html = readFileSync(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  // Title
  const title = $('h1.post-title').text().trim() || $('title').text().trim();

  // Description from meta
  const description = $('meta[name="description"]').attr('content') || '';

  // Tags from meta or body classes
  const tags = [];
  $('meta[property="article:tag"]').each((_, el) => {
    tags.push($(el).attr('content'));
  });

  // If no meta tags, try body classes
  if (tags.length === 0) {
    const bodyClass = $('body').attr('class') || '';
    const tagMatches = bodyClass.match(/tag-(\w+)/g);
    if (tagMatches) {
      tagMatches.forEach(t => {
        const tagName = t.replace('tag-', '');
        if (!['hash'].includes(tagName)) {
          tags.push(tagName.charAt(0).toUpperCase() + tagName.slice(1));
        }
      });
    }
  }

  // Published date
  const publishedTime = $('meta[property="article:published_time"]').attr('content') || '';
  const modifiedTime = $('meta[property="article:modified_time"]').attr('content') || '';

  // Featured image from og:image
  let featuredImage = $('meta[property="og:image"]').attr('content') || '';

  // Convert absolute image URLs to relative paths if they're local
  if (featuredImage.startsWith('https://lefthanded.io/')) {
    featuredImage = '/' + featuredImage.replace('https://lefthanded.io/', '');
  }

  // Post content - the actual article body
  let content = '';
  const postContent = $('.post-content.gh-content');
  if (postContent.length) {
    content = postContent.html().trim();

    // Fix image paths: ../content/images/ -> /content/images/
    content = content.replace(/(?:\.\.\/)+content\/images\//g, '/content/images/');
    // Fix absolute URLs to relative
    content = content.replace(/https:\/\/lefthanded\.io\/content\/images\//g, '/content/images/');
  }

  // Determine if it's a page (about, contact) vs post
  const bodyClass = $('body').attr('class') || '';
  const isPage = bodyClass.includes('page-template');

  return { title, description, tags, publishedTime, modifiedTime, featuredImage, content, isPage, slug };
}

function escapeYaml(str) {
  if (!str) return '""';
  // If string contains special chars, wrap in quotes and escape internal quotes
  if (str.includes(':') || str.includes('#') || str.includes("'") || str.includes('"') || str.includes('\n') || str.startsWith(' ')) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return str;
}

function writeMarkdown(post) {
  const frontmatter = [
    '---',
    `title: ${escapeYaml(post.title)}`,
    `description: ${escapeYaml(post.description)}`,
    `slug: ${escapeYaml(post.slug)}`,
    `tags: [${post.tags.map(t => `"${t}"`).join(', ')}]`,
    `pubDate: ${escapeYaml(post.publishedTime)}`,
    `updatedDate: ${escapeYaml(post.modifiedTime)}`,
    `featuredImage: ${escapeYaml(post.featuredImage)}`,
    `isPage: ${post.isPage}`,
    '---',
    '',
    post.content,
  ].join('\n');

  writeFileSync(join(OUT_DIR, `${post.slug}.md`), frontmatter);
  console.log(`  Wrote ${post.slug}.md (${post.isPage ? 'page' : 'post'}, tags: ${post.tags.join(', ') || 'none'})`);
}

// Main
console.log('Extracting content from Ghost HTML...\n');

const postFiles = findPostHtmlFiles(GHOST_DIR);
console.log(`Found ${postFiles.length} pages to extract.\n`);

const posts = [];
for (const { slug, path } of postFiles) {
  try {
    const post = extractPost(slug, path);
    posts.push(post);
    writeMarkdown(post);
  } catch (err) {
    console.error(`Error processing ${slug}: ${err.message}`);
  }
}

console.log(`\nDone! Extracted ${posts.length} posts/pages.`);
console.log(`Posts: ${posts.filter(p => !p.isPage).length}`);
console.log(`Pages: ${posts.filter(p => p.isPage).length}`);

// Also output a summary of all tags
const allTags = new Set();
posts.forEach(p => p.tags.forEach(t => allTags.add(t)));
console.log(`Tags: ${[...allTags].join(', ')}`);
