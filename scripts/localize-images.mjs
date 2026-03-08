import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const POSTS_DIR = './src/content/posts';
const PUBLIC_DIR = './public';

// Extract all external image URLs from markdown files
function findExternalImages() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const results = []; // { file, url, context: 'frontmatter' | 'body' }

  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');

    // Frontmatter featuredImage
    const fmMatch = content.match(/featuredImage:\s*"?(https?:\/\/[^\s"]+)"?/);
    if (fmMatch) {
      results.push({ file, url: fmMatch[1], context: 'frontmatter' });
    }

    // Body image references (markdown and HTML)
    // Markdown: ![alt](url)
    const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g;
    let match;
    while ((match = mdImgRegex.exec(content)) !== null) {
      results.push({ file, url: match[1], context: 'body' });
    }

    // HTML: src="url"
    const htmlImgRegex = /src="(https?:\/\/[^"]+)"/g;
    while ((match = htmlImgRegex.exec(content)) !== null) {
      // Skip non-image URLs
      if (match[1].includes('youtube') || match[1].includes('vimeo')) continue;
      results.push({ file, url: match[1], context: 'body' });
    }
  }

  return results;
}

// Generate a local path for an external URL
function localPath(url) {
  const u = new URL(url);

  if (u.hostname === 'images.unsplash.com') {
    // Use the photo ID from the path
    const photoId = u.pathname.split('/').pop().split('?')[0];
    return `/content/images/external/unsplash/${photoId}.jpg`;
  }

  if (u.hostname === 'm.media-amazon.com') {
    const filename = u.pathname.split('/').pop();
    return `/content/images/external/amazon/${filename}`;
  }

  if (u.hostname.includes('ghost.org')) {
    const filename = u.pathname.split('/').pop();
    return `/content/images/external/ghost/${filename}`;
  }

  // Fallback
  const filename = u.pathname.split('/').pop() || 'image.jpg';
  return `/content/images/external/other/${filename}`;
}

// Download a file
function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(PUBLIC_DIR, destPath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(fullPath)) {
      resolve('skipped');
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const request = (reqUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }
      client.get(reqUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location, redirectCount + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
          return;
        }
        const ws = fs.createWriteStream(fullPath);
        res.pipe(ws);
        ws.on('finish', () => { ws.close(); resolve('downloaded'); });
        ws.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

async function main() {
  const images = findExternalImages();

  // Dedupe by URL
  const uniqueUrls = [...new Set(images.map(i => i.url))];
  console.log(`Found ${images.length} external image references (${uniqueUrls.length} unique URLs) across ${new Set(images.map(i => i.file)).size} files\n`);

  // Build URL -> local path mapping
  const urlMap = new Map();
  for (const url of uniqueUrls) {
    urlMap.set(url, localPath(url));
  }

  // Download all
  let downloaded = 0, skipped = 0, failed = 0;
  for (const [url, dest] of urlMap) {
    try {
      const result = await download(url, dest);
      if (result === 'skipped') {
        skipped++;
        process.stdout.write('s');
      } else {
        downloaded++;
        process.stdout.write('.');
      }
    } catch (err) {
      failed++;
      console.error(`\nFAILED: ${url}\n  ${err.message}`);
    }
  }
  console.log(`\n\nDownloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}\n`);

  // Update markdown files
  let filesUpdated = 0;
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const [url, dest] of urlMap) {
      if (content.includes(url)) {
        content = content.replaceAll(url, dest);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      filesUpdated++;
      console.log(`Updated: ${file}`);
    }
  }

  console.log(`\n${filesUpdated} files updated.`);
}

main().catch(console.error);
