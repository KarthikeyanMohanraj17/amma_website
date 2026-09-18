# Style lock — Adisil Organic Foods

Established 2026-09-05. Cold start. Every token below was extracted from the
brand's existing printed labels, not generated from a mood. Reuse these exact
values for any new screen in this project; do not re-derive.

## Grounding

Source of truth: five product label artworks in `/Users/karthikeyanmohanraj/Desktop/product_photo`.
Sampled with Pillow, region-masked to skip the cream field and isolate saturated
brand colour (logo zone, border rails, footer strip). The brand already had an
identity; this lock records it rather than inventing one.

## Colour contract

Core tokens:

| Role | Hex | Provenance |
|---|---|---|
| `--ink` | `#2A1C12` | Label illustration sepia `#785B40`, darkened for body legibility |
| `--paper` | `#FDF7EC` | Page ground — one step lighter than label cream so labels sit *on* it |
| `--surface` | `#F7E9CF` | Label cream `#FCEAD0`, for cards and insets |
| `--green` | `#15551C` | The அடிசில் logo green. The one constant across all five labels |
| `--gold` | `#D07C0A` | The millet-sheaf mark. Sampled `#C27804`–`#E68908` |
| `--rule` | `#D9C4A0` | Hairline, derived from cream |
| `--on-green` | `#FDF7EC` | Paper, on green fills |

Per-product colours — these are a real brand feature, not decoration. Each
product's label already has its own rail colour, so the site colour-codes by
product and the palette moves as you scroll the catalogue.

| Product | Hex | Ratio vs `--paper` |
|---|---|---|
| Health Mix | `#3E0100` | 16.29:1 |
| Multi Millet Dosai Mix | `#340000` | 17.18:1 |
| Karuppu Kavuni Kanji | `#063314` | 13.20:1 |
| Mappillai Samba Kanji | `#002D68` | 12.50:1 |
| Karupu Ulundhu Kanji | `#450D31` | 14.53:1 |

Verified with `check_contrast.py --matrix`. Legal pairings:

- **Text-safe (>=4.5)** — `ink/paper` 15.47, `ink/on-green` 15.47, `ink/surface` 13.75,
  `ink/rule` 9.70, `paper/green` 8.39, `green/on-green` 8.39, `surface/green` 7.46,
  `green/rule` 5.26, `ink/gold` 5.16. Every product colour on `paper` or `surface`.
- **UI-safe (>=3.0, <4.5)** — none.
- **Decorative (<3.0)** — `paper/gold` 3.00, `gold/on-green` 3.00, `green/gold` 2.80,
  `surface/gold` 2.67, `gold/rule` 1.88, `ink/green` 1.84, and all cream-on-cream pairs.

**Hard rule that follows from the matrix:** gold never carries light text and is
never body text on cream — it failed at exactly 3.00:1. Gold is a fill, a rule, and
an underline, and any text sitting on a gold fill is `--ink`. This is how the
printed labels already use gold, so the constraint matches the brand.

Dark mode: none. This is a single-mode warm-paper design; a dark variant would
fight the packaging it is derived from.

## Type

| Role | Family | Notes |
|---|---|---|
| Display | Fraunces (var, opsz + SOFT + WONK) | Warm high-contrast serif. Deliberately *not* Playfair — that is the AI default in this segment |
| Body | Karla | Humanist sans, holds up in dense ingredient lists |
| Tamil | Noto Serif Tamil | For அடிசில் and Tamil product names; serif to match Fraunces |

Fluid scale via `clamp()`, base 17px, ratio ~1.26 mobile → 1.33 desktop.

## Density & spacing

4px base. Tokens: `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 24, `--s6` 32,
`--s7` 48, `--s8` 64, `--s9` 96, `--s10` 128, `--s11` 160.

Section padding weighted by role, not uniform: pivotal sections (hero, catalogue
entries) get `--s10`/`--s11`; connective sections get `--s8`. Card internal padding
floor is `--s5` (24px) and never exceeds the gap between cards.

Radius: `--r1` 2px, `--r2` 6px, `--r3` 14px. Restrained on purpose — the labels are
rectangular with a thin rule inset, and the site echoes that. No pill buttons.

## Structure

- **Macrostructure:** 11 · Catalogue. Cold start, no previous build to rotate against.
  Chosen over Feature Stack / Gallery Grid because every close competitor
  (Venjanam, Iyarkai Pantry, Spicy Samayals) runs the same Shopify hero →
  4-icon-cards → rated product grid, and the brief was explicitly "not another
  regular website."
- **Arc:** Hook (poster hero, the label's own amma-and-child illustration) →
  Problem/stakes (why a 3-month shelf life is the point) → Solution (five
  colour-coded specimen entries, full ingredient lists set as editorial type) →
  How it works (order in 3 steps + prepare in 5) → Proof (FSSAI number, named
  ingredient counts, no invented metrics) → Close (WhatsApp). No beats skipped.
- **Archetypes:** nav N-inline-rule, hero H-poster, feature F-specimen (custom to
  this project), how-it-works F4 numbered, proof P-credential, close C2 statement.

The argument the page makes is the ingredient list itself. Health Mix names twenty
things; a factory mix cannot print that. So ingredient lists are set in the open as
real typography — never behind an accordion, never summarised.

## Assets

- **Photography:** none sourced. Openverse's CC0 pool returned one usable grain
  texture out of three results (the others: a 1940s B&W photograph and a Japanese
  scroll painting) — not commercial-food-grade, so it was not used. Reported to the
  user rather than shipped.
- **What is used instead:** the brand's own label artwork. Full labels are the
  product images; the hero illustration, the seven-ingredient circle row, and the
  kanji-bowl photographs are cropped out of the labels themselves. On-brand by
  construction because it *is* the brand's art.
- **Logo:** cropped from the Health Mix label and keyed to transparency
  (`assets/brand/logo.png`). Preserved, not redesigned. Used on cream only — the
  keyed edge fringes on dark grounds, so dark surfaces use the wordmark as type.
- **Illustration:** `~/.ideagram/undraw/` is not populated on this machine. Not
  worked around with primitives — unDraw's flat vector style would have been wrong
  against hand-drawn sepia packaging art anyway.
- **Icons:** Tabler via Iconify, inlined as one SVG sprite, converted to
  `currentColor` so CSS drives colour. 15 icons.
- **Motion:** GSAP + ScrollTrigger via CDN.

## Open items

- Prices are `null` in `assets/js/products.js` by the user's instruction. The card
  renders correctly without them; filling them in needs no redesign.
- Additional products (masalas, podis, gravies/thokku) exist but have no artwork.
  Awaiting names.
- Dosai Mix label prints "12 Natural Ingredients" over a list of 13 items, two of
  which appear to be the same ingredient. `ingredientCount` is `null` for that
  product so the site does not repeat the error.

## Verified (2026-09-05)

Checked in real Chrome 152 (headless, and over CDP with device metrics so phone
widths are not clamped to Chrome's 500px window floor):

- No horizontal overflow at 390 / 500 / 700 / 900 / 1024 / 1440 (`scrollWidth ==
  clientWidth` at every width). One real bug was found and fixed here: the
  single-column media queries used bare `1fr`, which is `minmax(auto, 1fr)` — the
  `auto` floor is min-content, so the track outgrew its container by 8px. All
  single-column grid rules now use `minmax(0, 1fr)`.
- Per-product accent colour correct for all five products, and resets at the top.
  Ranges are `top center` → `bottom center` so adjacent sections tile exactly;
  the earlier overlapping ranges left the colour one product behind.
- WhatsApp deep links carry product + selected size; weight buttons update both
  `aria-pressed` and the message.
- Lazy label images load on scroll. All images have `alt`. No interactive element
  lacks an accessible name. One `h1`, no skipped heading levels.
- `anti_slop_scan.py` clean (one false positive: `href="#" + slug` in main.js is a
  real anchor). `audit_motion.py` passes. All SVGs valid.
- Renders correctly from `file://` with no server.

---

## Revision 2 (2026-09-19) — colour ratio, quick-add, enquiry, reviews

The owner's complaint was that the site read as "creamy white". Measured before
touching anything: **90.5% of the home page was cream, 0.3% was the brand green.**
The palette was right; the *ratio* was wrong — five label colours surviving as
4px rails. After this revision: **67.8% cream, 28.7% deep ground.**

### New section grounds — all five already existed as label rails

| Token | Hex | Used for | Cream on it |
|---|---|---|---|
| `--hero-ground` | `#063314` | hero top, proof band, order bar | 13.20:1 |
| `--hero-ground-2` | `#052810` | hero gradient mid-stop | 14.95:1 |
| `--oxblood` | `#3E0100` | hero gradient end, close band | 16.29:1 |
| `--plum` | `#450D31` | enquiry band | 14.53:1 |
| `--maroon` | `#340000` | Dosai Mix product band | 17.18:1 |
| `--navy` | `#002D68` | Mappillai Samba product band | 12.50:1 |
| `--ink` | `#2A1C12` | footer | 15.47:1 |

Deep colours are now full-bleed **sections**, never 3–4px accents. No two deep
bands sit adjacent without a cream or sand band between them.

### A real contrast failure was fixed, not introduced

`--gold #D07C0A` on `--green #15551C` measures **2.80:1** — below even the 3:1
non-text floor. The proof band's gold icons were failing that in the shipped
site. Moving the band to `--hero-ground #063314` raises the same pairing to
**4.40:1**. `--green` is therefore **retired as a section ground** and survives
only as the WhatsApp button fill on cream (8.39:1).

Gold's remaining rules, verified with `check_contrast.py`:
- On the deep grounds it is **large text only** (≥18.66px bold): 4.40:1 on
  bottle green, 4.85:1 on plum. `.hero h1 em` renders at 33.4px/600 and
  `.hero__mark .tamil` at 20px/600 — both measured, both legal.
- On cream it is **3.00:1 and stays fill-only**, exactly as revision 1 said. The
  how-to-order numerals were briefly gold and are now `--oxblood` for that reason.
- `--ink` on `--gold` is 5.16:1, which is what makes the gold order-bar and
  close buttons legal.

### Structure added

- **Hero** replaced. The poster fold ("Everything in the packet is printed on the
  packet") was clever but did not say what is sold. Now: dark ground, four
  overlapping photographic plates cut from the labels, and a headline that names
  the category outright. The family illustration left the fold for the FAQ block.
- **Quick-add** on every product card — pack-size buttons that become steppers in
  place. `openCart()` no longer fires on add; that single call was why adding
  several products meant a close-tap between each one.
- **Sticky order bar** on `--hero-ground`, with `env(safe-area-inset-bottom)`.
  Suppresses `.wa-dock` while shown (verified collision at z-index 250/260).
- **Enquiry band** on `--plum`: bulk, custom, abroad, question, feedback.
- **Sample review marquee** — CSS-only, with a real pause button (WCAG 2.2.2;
  hover/focus pause alone does not satisfy it) and a reduced-motion static grid.
- **Ingredient discs** replace the pasted-on white strip. Each of the seven bowls
  is cut from the pack with an alpha mask; the disc is filled with `--surface`,
  which is the artwork's own cream, so there is no cut edge to hide. The
  `mask-image` fade this replaced was the cause of the seam, not the cure.

### Assets corrected

`bowl-samba.jpg` was a crop of the label's **title block**, not a bowl —
verified and re-cut. `bowl-ulundhu.jpg` carried the plum rail and caption text;
`dish-millet-flour.jpg` carried a cream sliver. All re-cut from the source
labels. Dish crops are now named `dish-<slug>` so the generator finds them
mechanically. `assets/brand/logo-light.png` added for dark grounds.

Image dimensions are now read from the file headers at build time
(`lib/imgsize.js`, no dependency) — the old hero declared `1400×500` on a
997×356 image, which is a layout-shift bug that can no longer recur.

### Honesty constraints held

No invented reviews, names, towns, ratings or dates. Sample cards carry no
person and no rating, are `<div>` not `<figure>/<blockquote>`, and are marked
`data-placeholder`. No `Review` or `AggregateRating` markup is emitted while
`testimonials` is empty — verified in the built HTML. `node build.js` prints a
warning while the sample layout is live.
