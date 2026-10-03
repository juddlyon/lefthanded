import products from '../data/products.json';

// Build-time expansion of product tokens in post HTML. Post bodies are raw
// HTML rendered with set:html, so these stand in for Astro components:
//
//   <product-card slug="x">Optional one-paragraph description.</product-card>
//   <top-picks>
//     <pick slug="x" badge="Best Overall">One-line reason.</pick>
//   </top-picks>
//
// Link data comes from src/data/products.json (written by
// scripts/fetch-products.mjs). No prices are rendered (Amazon Operating
// Agreement without PA-API).

type Product = {
  name?: string;
  asin?: string;
  image?: string;
  url?: string;
  store?: string;
};

const catalog = products as Record<string, Product>;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function link(slug: string) {
  const p = catalog[slug];
  if (!p) throw new Error(`Unknown product slug "${slug}" (not in src/data/products.json)`);
  if (p.url) {
    return { p, href: p.url, rel: 'noopener', cta: `View at ${p.store || 'the maker'}` };
  }
  return {
    p,
    href: `/go/${slug}`,
    rel: 'nofollow sponsored noopener',
    cta: p.asin ? 'Check Amazon Price' : 'Find It on Amazon',
  };
}

function card(slug: string, description: string) {
  const { p, href, rel, cta } = link(slug);
  const name = esc(p.name || slug);
  const image = p.image
    ? `<a href="${href}" target="_blank" rel="${rel}"><img src="${p.image}" class="kg-product-card-image" loading="lazy" alt="${name}"></a>`
    : '';
  const desc = description.trim()
    ? `<div class="kg-product-card-description"><p>${description.trim()}</p></div>`
    : '';
  return `<div class="kg-card kg-product-card">
  <div class="kg-product-card-container">
    ${image}
    <div class="kg-product-card-title-container">
      <h4 class="kg-product-card-title">${name}</h4>
    </div>
    ${desc}
    <a class="kg-product-card-button kg-product-card-btn-accent" href="${href}" target="_blank" rel="${rel}"><span>${cta}</span></a>
  </div>
</div>`;
}

function topPicks(inner: string) {
  const rows = [...inner.matchAll(/<pick\s+slug="([^"]+)"\s+badge="([^"]+)"\s*>([\s\S]*?)<\/pick>/g)]
    .map(([, slug, badge, reason]) => {
      const { p, href, rel, cta } = link(slug);
      return `<li class="top-picks-row">
      <span class="top-picks-badge">${esc(badge)}</span>
      <span class="top-picks-info"><span class="top-picks-name">${esc(p.name || slug)}</span><span class="top-picks-reason">${reason.trim()}</span></span>
      <a class="top-picks-cta" href="${href}" target="_blank" rel="${rel}">${cta}</a>
    </li>`;
    })
    .join('\n');
  return `<aside class="top-picks" aria-label="Our top picks">
  <p class="top-picks-heading">Our top picks</p>
  <ul class="top-picks-list">
${rows}
  </ul>
  <p class="top-picks-disclosure">As an Amazon Associate, lefthanded.io earns from qualifying purchases.</p>
</aside>`;
}

export function expandProducts(html: string): string {
  return html
    .replace(/<top-picks>([\s\S]*?)<\/top-picks>/g, (_, inner) => topPicks(inner))
    .replace(/<product-card\s+slug="([^"]+)"\s*>([\s\S]*?)<\/product-card>/g, (_, slug, desc) => card(slug, desc));
}
