# Content Strategy & Production Queue

Site is at **108 posts**. Strong on Sports/People lists, product roundups, and a growing famous-people hub. Edinburgh Handedness Inventory shipped as linkable asset; affiliate cloaking live across all roundups.

This doc is a **living queue + strategy**. The Production Queue at the top is the actual next-to-write list — pull from it sequentially. Tier sections below show the broader strategic landscape and feed new items into the queue as they're prioritized.

Source dumps:
- `_etc/google_us_left-handed-people_matching-terms_2026-04-25_09-10-07.csv` — 1,715 US keywords, identity/biology angle
- `_etc/google_us_is-left-handed_matching-terms_2026-04-25_09-36-06.csv` — 2,500 US keywords, "is X left-handed?" celebrity queries
- `_etc/google_us_left-handed_matching-terms_2026-03-24_18-57-25.csv` — prior broad dump

---

## Production queue (write next, in order)

Items here are vetted, brief-ready, and ranked by expected ROI per hour. Pull the top item, write it, mark as shipped, repeat.

### Round 1 — celebrity standalones (highest volume × lowest difficulty)

Each is ~600–900 words, ~30–45 min to write. KD 0 across the board.

- [ ] **Is Paul McCartney left-handed?** — 600/mo, KD 1. Yes. Iconic lefty bassist; Höfner violin bass; restrung style. Cross-link famous-musicians + famous-guitarists.
- [ ] **Is Keanu Reeves left-handed?** — 500/mo, KD 0. Yes. Visible in interviews/signings; trained right-handed for action roles.
- [ ] **Is Obama left-handed?** — ~500/mo combined, KD 0–3. Yes. Cross-link presidents-usa pillar.
- [ ] **Is Daniel Negreanu left-handed?** — ~500/mo, KD 0. Yes. Poker world's biggest name; opens new lefty-poker angle.
- [ ] **Is Jalen Brunson left-handed?** — 400/mo, KD 0. Right-handed (debunk). Knicks PG, currently relevant.
- [ ] **Is James Harden left-handed?** — 300/mo, KD 0. Yes (shoots lefty). NBA cluster.
- [ ] **Is Tom Cruise left-handed?** — 300/mo, KD 0. Yes (mentioned in iconic-actors hub but no standalone).
- [ ] **Is Angel Reese left-handed?** — 250/mo, KD 0. Yes. WNBA, current.
- [ ] **Is Sylvester Stallone left-handed?** — 250/mo, KD 0. Yes.
- [ ] **Is Link (from Zelda) left-handed?** — 250/mo, KD 0. Yes (originally) — Nintendo's flip from lefty to righty in newer games is the whole story. Niche but unique.
- [ ] **Is Eminem left-handed?** — 200/mo, KD 0. Yes.
- [ ] **Is Mike Tyson left-handed?** — 200/mo, KD 0. No (right-handed orthodox boxer).
- [ ] **Is Nicole Kidman left-handed?** — 200/mo, KD 2. Yes.
- [ ] **Is Stephen Miller left-handed?** — 250/mo. (verify before writing — politically loaded)
- [ ] **Is Thanos left-handed?** — 350/mo, KD 0. Fictional curio. Comic continuity (Yes); MCU is right-handed. Fun piece.

Combined target volume for Round 1: **~5,300/mo at KD ≤2**.

### Round 2 — identity/biology gaps from the keyword dump

Each is ~1,200–1,800 words, ~1.5h to write. Brief with serp-gap before drafting.

- [ ] **Are left-handed people right-brained?** — 200/mo, KD 15. Standalone debunk separate from `left-handed-brain`.
- [ ] **What are left-handed people good at?** — 80/mo + advantages/sports/jobs sub-cluster (~150/mo combined).
- [ ] **What country has the most left-handed people?** — 80/mo (KD 7) + 30/mo variants. Map post, fast win.
- [ ] **Why are left-handed people rare / special?** — 30+30+20+20+10+10 = ~120/mo. Combined post; debunk "special" framing.
- [ ] **Do left-handed people think differently?** — 100/mo, KD 7. Cognitive-style angle.

### Round 3 — lifestyle/etiquette quick FAQs

Short pieces (400–600 words) with affiliate uplift.

- [ ] **What hand do left-handed people wear a watch on?** — ~150/mo combined, KD 0–4. Uplifts `best-left-handed-watches`.
- [ ] **Can left-handed people use fountain pens?** — 30/mo, KD 0. Uplifts pens roundup.
- [ ] **Do left-handed people shake hands with their left hand?** — 30/mo. Etiquette piece.
- [ ] **How do left-handed people use a mouse?** — ~60/mo combined. Uplifts mouse/gaming roundups.
- [ ] **Why do left-handed people write sideways? (the hook grip)** — 20/mo.

### Round 4 — health debunks (high CPC, AI-Overview-friendly)

- [ ] **Left-handedness and autism** — was on old list, still gap.
- [ ] **Left-handedness and depression** — debunk angle.
- [ ] **Left-handedness and schizophrenia** — debunk angle.
- [ ] **The "vanishing twin" myth** — small volume but unique viral debunk.

### Round 5 — strategic linkable assets (engineering required)

- [ ] **Lifetime Cost of Being Left-Handed (interactive calculator)** — biggest viral ceiling on the roadmap; affiliate hookups bake in. Single Astro page + vanilla JS, similar to Edinburgh Inventory.
- [ ] **The Lefty Hall of Fame** — single-page filterable timeline (data already on site after famous-lefties hub shipped).
- [ ] **Free downloadable lefty handwriting worksheets (PDF)** — teachers reflexively link to free classroom resources.

---

## Shipped this session (2026-04-25)

| Slug | Target | Vol/mo | KD | Image | H1 | FAQ |
|---|---|---|---|---|---|---|
| `/are-left-handed-people-smarter/` | parent | 1,000 | 12 | ✓ unique | ✓ | ✓ 6Q |
| `/famous-left-handed-people/` | hub | ~2,800 combined | 1–5 | ✓ unique | ✓ | ✓ 5Q |
| `/left-handed-statistics/` (retrofit) | parent | ~9,000 cluster | varied | (existing) | ✓ | ✓ 7Q |
| `/is-donald-trump-left-handed/` | celeb | ~3,200 combined | 0–2 | ✓ unique | ✓ | ✓ 5Q |
| `/is-jayden-daniels-left-handed/` | celeb | 700 | 0 | ✓ unique | ✓ | ✓ 4Q |
| `/is-tua-tagovailoa-left-handed/` | celeb | 250 | 0 | ✓ unique | ✓ | ✓ 5Q |

**Combined target volume: ~17,000/mo.** All articles have body H1 + TL;DR aside + question-form H2s with anchor IDs + FAQPage schema + BreadcrumbList. Template change: `[slug].astro` now skips its template H1 if the body starts with one (backwards-compatible — all 102 prior posts unaffected).

---

## Quality gate (run before shipping any new article)

Every new post must clear all of the following before merge:

1. **Frontmatter:** title ≤60 chars, description 30–160 chars, `pubDate` and `updatedDate` set, `featuredImage` points to an existing file ≥5 KB.
2. **Image:** unique to this post (not shared with another article).
   - **Celeb/athlete articles** ("is X left-handed?", individual celebrity profiles): use the Wikipedia portrait of the actual subject via `scripts/fetch-wikipedia-portraits.mjs`. Add the slug to `HERO_SLUGS`. Never use generic stock for a person-specific page.
   - **Concept/topic articles** (statistics, debunks, biology): Pexels stock via `scripts/fetch-pexels-covers.mjs` is fine.
   - To refresh an existing portrait, bump `HERO_VERSION` in the fetcher and update each affected `featuredImage` path — the immutable CDN cache requires a URL change.
3. **Body structure:**
   - First element is `<h1 class="post-title">{matching frontmatter title}</h1>`.
   - First paragraph is the SVO direct answer in `<strong>` Q+A format, ≤250 chars.
   - `<aside class="tldr">` with 3–6 bullets capturing the article's central claims.
   - All H2s are question-form or self-contained; each has an `id` attribute.
   - FAQ section starts with `<h2>Frequently asked questions</h2>` and uses `<h3>`+`<p>` pairs (auto-extracted into FAQPage schema).
4. **Links:** at least 3 internal cross-links to relevant posts; no broken `/go/` redirects.
5. **Build:** `npm run build` exits 0.
6. **Inbound link:** add at least one inbound link from an existing high-traffic article so the new post is not orphaned. Verify with `internal-linker orphans`.
7. **No duplicate H1:** confirm `grep -c "<h1" dist/<slug>/index.html` returns exactly `1`.
8. **FAQPage schema present:** `grep -o "FAQPage" dist/<slug>/index.html` returns at least one match.

---

## Strategy tiers (full landscape)

These are the broader buckets feeding the Production Queue. Items move up to the queue as their priority/relevance changes.

### Tier 1: identity/biology cluster (mostly absorbed into queue)

- [ ] Are left-handed people right-brained? *(in queue Round 2)*
- [ ] What are left-handed people good at? *(in queue Round 2)*
- [ ] What country has the most left-handed people? *(in queue Round 2)*
- [ ] Why are left-handed people rare/special? *(in queue Round 2)*
- [ ] Do left-handed people think differently? *(in queue Round 2)*
- [ ] Traits and personality of left-handed people — `left-handed-personality-characteristics` exists; verify it targets the plural noun phrasing.

### Tier 2: parenting funnel (under-served, high-spend audience)

- [ ] Signs your child is left-handed (early-discovery query)
- [ ] At what age does handedness become clear?
- [ ] Left-handed kids and writing reversals (b/d, p/q)
- [ ] Left-handed kindergarten supplies (transactional, July–September seasonality)
- [ ] Helping your left-handed child with homework
- [ ] Do left-handed parents have left-handed children? (genetics angle aimed at expectant parents)

### Tier 3: health/medical depth

- [ ] Left-handedness and autism *(in queue Round 4)*
- [ ] Left-handedness and depression *(in queue Round 4)*
- [ ] Left-handedness and schizophrenia *(in queue Round 4)*
- [ ] Left-handedness and autoimmune disorders
- [ ] Left-handedness and migraines
- [ ] Left-handedness and sleep
- [ ] The "vanishing twin" myth *(in queue Round 4)*

### Tier 4: decision/comparison content

- [ ] Left-handed vs right-handed brain — actual differences (cluster pillar)
- [ ] Flipping a right-handed notebook vs buying a lefty notebook
- [ ] Left-handed scissors vs universal scissors
- [ ] Left-handed guitar vs flipped right-handed guitar
- [ ] Restringing a uke vs buying a left-handed uke
- [ ] Hook grip vs underwriter — which left-handed writing position is better?
- [ ] Left-handed golfer playing right-handed clubs vs buying lefty clubs

### Tier 5: terminology / etymology

- [ ] **Slurs, insults, and nicknames for left-handed people** — ~200/mo combined, KD 0. Etymology of "sinister," "cack-handed," "southpaw," etc. Strong link bait.
- [ ] What does the Bible say about left-handed people? — 40/mo (KD 0) + variants. `left-handed-in-bible` exists; confirm it ranks for "what does the bible say…" phrasing.

### Tier 6: single-product deep reviews

Long-tail buyer intent goes to standalone reviews, not roundups. Pick highest-converting items.

- [ ] Uni-Ball Jetstream review for left-handed writers
- [ ] Stabilo EASYoriginal review (genuinely lefty-specific, easy win)
- [ ] Logitech G502 X Plus review for left-handed gamers
- [ ] Wilson Pro Staff review for left-handed tennis players
- [ ] Roaring Spring Lefty Notebook deep review

### Tier 7: programmatic / seasonal

- [ ] Left-handed back-to-school supplies (publish July, refresh annually)
- [ ] Left-handed gifts under $25 / under $50 / under $100 (November)
- [ ] Best left-handed gifts for [audience] — kids, students, partners (November)
- [ ] International Left-Handers Day events (annual refresh of existing post)
- [ ] Best left-handed Black Friday deals (annual)
- [ ] **Annual scholarship roundup with year in title** — `scholarships for left handed people 2025` (150/mo) and `2026` long-tail show year-stamped queries. Refresh `left-handed-scholarships.md` headline + URL annually.

### Tier 8: linkable assets (engineering required)

- [x] Online Edinburgh Handedness Inventory
- [x] Famous left-handed people hub
- [ ] **Lifetime Cost of Being Left-Handed (interactive calculator)** *(in queue Round 5)*
- [ ] Dominant-eye test (paired with the bow article)
- [ ] Annual *State of Left-Handedness* report (original survey or aggregated stats with charts)
- [ ] "Is this product actually left-handed?" checker (interactive)
- [ ] The Lefty Hall of Fame *(in queue Round 5)*
- [ ] Free downloadable lefty handwriting worksheets (PDF) *(in queue Round 5)*

### Tier 9: refresh strategy

- [ ] Quarterly review of all "best of" articles — check brand/product changes, refresh `updatedDate`
- [ ] Add 2026 entries to *Greatest left-handed drummers/golfers/etc.* lists
- [ ] Audit dead Amazon ASINs in product roundups

---

## Carryover backlog (lower priority)

### Sports
- [ ] Left-handed MMA/UFC fighters
- [ ] Left-handed badminton players
- [ ] Left-handed table tennis players
- [ ] Left-handed swimmers
- [ ] Left-handed basketball shooting technique
- [ ] Left-handed volleyball players
- [ ] Left-handed rock climbing

### Products
- [ ] Best left-handed power tools
- [ ] Best left-handed measuring tapes and rulers
- [ ] Best left-handed sewing machines
- [ ] Best left-handed gardening tools
- [ ] Best left-handed firearms overview (140/mo combined for guns/pistols/rifles "for left handed people"; informational, no affiliate)

### People (deprioritized — hub captures the volume)
- [ ] Famous left-handed comedians (only "famous" niche worth writing — high search appeal)
- [ ] ~~Famous left-handed photographers~~
- [ ] ~~Famous left-handed fashion designers~~
- [ ] ~~Famous left-handed military leaders~~
- [ ] ~~Famous left-handed tech founders~~
- [ ] ~~Famous left-handed royals~~

### How-to
- [ ] How to play violin left-handed
- [ ] How to play drums left-handed
- [ ] How to do calligraphy left-handed
- [ ] How to shoot a gun left-handed
- [ ] How to set up a left-handed sewing station
- [ ] How to set up a left-handed gaming station

### Facts
- [ ] Left-handedness in twins (genetics angle; pairs with vanishing-twin debunk)
- [ ] Left-handed language etymology (beyond southpaw/sinister; pairs with slurs piece)

### Music
- [ ] Left-handed bass players
- [ ] Famous left-handed DJs and producers

### Professions (mostly deprioritize)
- [ ] ~~Left-handed dentists~~
- [ ] ~~Left-handed teachers~~
- [ ] Left-handed barbers and hairstylists (high anxiety query — "can a lefty cut hair?")
- [ ] ~~Left-handed tattoo artists~~
- [ ] ~~Left-handed nurses and paramedics~~
- [ ] ~~Left-handed graphic designers~~
