# Article plan

Written 2026-10-03. Search volumes are US monthly searches from Ahrefs (keyword difficulty 0 to 3 unless noted). Positions are from Search Console, Sep 4 to Oct 1, 2026.

Every roundup follows the layout and rules in `CLAUDE.md` (Amazon Affiliate System): Q:A opener, `<top-picks>`, comparison table, numbered picks with `<product-card>`, buying guidance, FAQ. Budget about 10 SerpAPI searches per roundup.

## Done

| Page | Target keyword | Volume |
|---|---|---|
| `/best-left-handed-golf-clubs/` | left handed golf clubs | 6,400 |
| `/best-left-handed-guitars/` (picks and cards added, two basses) | left handed guitar | 6,700 |
| `/best-left-handed-computer-mice/` (cards added) | left handed mouse | 2,700 |
| `/best-left-handed-keyboards/` (picks and cards added) | left handed keyboard | 1,600 |
| `/left-handed-baseball-gloves/` (rebuilt as a roundup) | left handed baseball gloves | 1,400 |
| `/best-left-handed-baitcasters/` | left handed baitcaster | 1,400 |
| `/best-left-handed-watches/`, `/best-left-handed-calligraphy-sets/` (cards added) | | |

## P1. New product roundups

| Code | Page to build | Target keywords | Volume | Notes |
|---|---|---|---|---|
| P1.1 | `/best-left-handed-bows/` | left handed bow, left handed compound bow | 1,100 + 800 | `/left-hand-vs-right-hand-bow/` is the info page. Eye dominance decides the bow hand, so link both ways. |
| P1.2 | `/best-left-handed-bass-guitars/` | left handed bass, left handed bass guitar | 1,000 + 1,000 | Two basses are already in the guitars roundup. Split out only if that page does not rank for bass terms. |
| P1.3 | `/best-left-handed-acoustic-guitars/` | left handed acoustic guitar | 1,600 (difficulty 12) | Same split-out test as P1.2. |
| P1.4 | `/best-left-handed-putters/` | left handed putter, left handed putters | 1,100 + 800 | Child page of the golf roundup. Also covers "left handed driver" (900) and "left handed 7 wood" (1,100) as later siblings. |
| P1.5 | `/best-left-handed-kids-golf-clubs/` | kids left handed golf clubs, left handed kids golf clubs | 800 + 500 | Child page of the golf roundup. |
| P1.6 | `/best-left-handed-pencils/` | left handed pencil | 700 | Could be a section in `/best-left-handed-pens/` instead. |
| P1.7 | `/best-left-handed-ukuleles/` and banjo | left handed ukulele, left handed banjo | 450 (difficulty 14) + 400 | `/playing-the-ukulele-left-handed/` is the how-to. |
| P1.8 | `/best-left-handed-hockey-sticks/` | left handed hockey stick | 400 | Explain that stick hand and writing hand differ, like the baitcaster page. |
| P1.9 | `/left-handed-circular-saws/` and hammer | left handed circular saw, left handed hammer | 500 + 900 | "Left handed hammer" is mostly a joke query. Answer it honestly and link real lefty tools. |

Not worth building for Amazon revenue: left-handed rifles, AR-15s, shotguns, and pistols (about 6,000 searches combined). Amazon does not sell firearms.

## P2. Informational gaps

| Code | Page to build | Target keywords | Volume | Notes |
|---|---|---|---|---|
| P2.1 | `/left-hand-itching-meaning/` | left hand itching meaning, left hand itching | 17,000 + 11,000 (difficulty 0 to 18) | Superstition topic. Largest single gap. No product angle. |
| P2.2 | `/left-handed-facts/` | left handed facts, facts about left handed people | 450 + 450 (difficulty 0 to 24) | A sourced facts list. Link from the statistics page. |
| P2.3 | Expand `/what-is-a-left-handed-door/` | left hand inswing door, right hand vs left hand door, left hand door | about 6,000 combined | Page sits at position 60. Add inswing and outswing diagrams and a "how to tell" section. |
| P2.4 | `/why-does-morgan-freeman-wear-a-glove/` | morgan freeman left hand | 1,400 + 900 + 450 | Off-topic for lefties but ranks on the "left hand" term. Low priority. |

## P3. Celebrity pages with proven demand

Each needs photo evidence before writing, like the Damon, Watson, Page, and Carrey posts. Do not assume the answer is yes.

| Code | Page | Volume |
|---|---|---|
| P3.1 | Is Paul McCartney left-handed? | 600 |
| P3.2 | Is Obama left-handed? | 600 |
| P3.3 | Was Kurt Cobain left-handed? | 500 |
| P3.4 | Is Messi left-handed? | 500 |
| P3.5 | Is Keanu Reeves left-handed? | 450 |
| P3.6 | Was Jimi Hendrix left-handed? | 400 |
| P3.7 | Is Sylvester Stallone left-handed? | 400 |
| P3.8 | Is Brad Pitt left-handed? (51 impressions at position 7 to 8 from the actors list) | |

## P4. Fixes to existing pages

| Code | Work | Why |
|---|---|---|
| P4.1 | Fact-check `/famous-left-handed-comedians/` and `/famous-left-handed-people/` | The actors, guitarists, drummers, and chefs lists were mostly wrong when checked. These two have not been checked. |
| P4.2 | Convert the older roundups to `<product-card>` tokens and add `<top-picks>` | Gifts, drill bits, gaming mouse, notebooks, scissors, spatulas, can opener, kitchen knives, pens, and tennis rackets use hand-written card HTML and have no top-picks box. |
| P4.3 | Re-verify product claims in the mice, watches, and keyboards body text | Written before the product system. The Sinn and Seiko watch entries look doubtful. |
| P4.4 | Add real photos to `/famous-left-handed-chefs/` | The people-listicle rule requires them. |
| P4.5 | Shorten 42 meta descriptions over 160 characters | Truncated in search results. |
| P4.6 | Run `node scripts/fetch-products.mjs --all` each quarter | Product data was last fully refreshed in April and May 2026 before this round. Left-handed stock changes often. |
| P4.7 | Decide on a body image for the celebrity posts | They rely on the featured portrait only, which conflicts with the body-image rule in `CLAUDE.md`. |

## Suggested order

1. P2.1 (largest search volume on the list).
2. P1.1, then P1.4 and P1.5 (extend the golf cluster while it is new).
3. P4.1 and P4.2.
4. P3 pages, two or three at a time.
