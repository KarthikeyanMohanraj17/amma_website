# Adisil Organic Foods — website

Plain HTML, CSS and JavaScript. No frameworks, nothing to install.

There is **one command**, and you only run it after changing product content:

```
node build.js
```

That reads `assets/js/products.js` and rewrites the pages. It takes a second and
needs no internet, no `npm install`, and no dependencies.

---

## The workflow

1. Edit **`assets/js/products.js`** — the only file with your content in it.
2. Run **`node build.js`**.
3. Refresh the browser.

If you skip step 2 nothing changes, because the pages are real HTML files rather
than something assembled in the browser. That is deliberate — see *Why there's a
build step* below.

---

## What's on the site

```
index.html                     home
products.html                  all products, with category filters
product/health-mix.html        one real page per product
product/dosai-mix.html
product/karuppu-kavuni-kanji.html
product/karupu-ulundhu-kanji.html
product/mappillai-samba-kanji.html
```

Every page has the order list (cart) and the floating WhatsApp button.

---

## Editing content

### Prices

Find the product in `products.js`:

```js
prices: { 100: 60, 250: 140, 500: 260 },
```

Plain numbers. No `₹`, no quotes. Left as `null` it shows "Price on WhatsApp",
and the layout is identical either way — so you can add them whenever.

Once every size of every item in an order has a price, the order list shows a
real total and puts it in the WhatsApp message. Until then it says "Price on
WhatsApp" and we confirm in the chat.

### A new product with label art

1. Save the label as `assets/labels/your-slug.jpg` (and `.webp` if you have it).
2. Copy a whole `{ ... }` block in `products.js`, paste it, change the values.
   `slug` must match the filename without the extension.
3. `node build.js`.

A new page, a new card on the home page and products page, and new footer links
all appear by themselves.

### A product with no art yet

Add it to `comingSoon` in `products.js`. If every `items` list there is empty,
that whole section disappears from the site — it never looks unfinished.

### Testimonials

Near the bottom of `products.js`:

```js
testimonials: [
  { name: "Lakshmi R.", place: "Coimbatore", rating: 5,
    text: "What they actually said.",
    product: "health-mix", date: "2026-08" },
]
```

- `product` is a product's `slug`, and puts the quote on that product's page as
  well as the home page. Use `""` for general feedback about the brand.
- `rating` is 1–5, or leave it out for a quote with no stars.
- `place` can be `""`.

**While the list is empty the testimonials section does not exist on any page.**
No empty "reviews" box, no "be the first to review". It appears the moment you
add a real one.

Only put real feedback here. Beyond the honesty of it: the site publishes review
data in a format Google reads, and Google penalises sites that publish invented
ratings. Right now no rating data is published at all, because you have none yet.

---

## Two things worth understanding

### The order list (cart)

Customers add several products and sizes, then send **one** WhatsApp message
with everything:

```
Hello Adisil! I'd like to order:

1. Health Mix — 250g × 2
2. Mappillai Samba Kanji Mix — 500g × 1

Could you confirm the price and delivery?
```

The list is saved in their own browser, so it survives moving between pages and
closing the tab. Nothing is sent anywhere until they tap the button, and no
payment happens on the site.

### Why there's a build step

Each product is a real file, so when someone shares
`.../product/health-mix.html` on WhatsApp, the preview shows **that** product's
photo and name. A single page that filled itself in with JavaScript would show
the same preview for all five, and Google would see one page instead of five.
For a business that spreads by people forwarding links, that difference matters
more than avoiding one command.

---

## Putting it online

Drag the whole folder onto **app.netlify.com/drop**. Live in about ten seconds,
free, custom domain supported. GitHub Pages and Cloudflare Pages work the same
way.

To update later: edit `products.js`, run `node build.js`, drag the folder again.

**When you have a domain**, put it in `products.js`:

```js
siteUrl: "https://adisilorganicfoods.com",
```

then re-run `node build.js`. That makes the WhatsApp and Facebook link previews
use full URLs, which they need in order to show the image.

---

## Two things to fix on your packaging

Neither is a website bug.

1. **The Karupu Ulundhu label reads "ORGANIC HOOD"** where every other label says
   "ORGANIC FOOD".

2. **The Dosai Mix label says "12 Natural Ingredients" but lists 13** — and
   "Bengal Gram Dal (Kadalaiparuppu)" and "Split Bengal Gram (Kadalai Paruppu)"
   look like the same thing written twice. The site prints the full list with no
   count so it doesn't repeat the error. Once you've confirmed the real list,
   fix `ingredients` and set `ingredientCount` in `products.js`.

---

## What would improve the site most

**Photographs of the actual packets.** Every product image on the site is the
printed label artwork, because that is all there is. Ten phone photos — a packet
on a plain surface in daylight, a bowl of the cooked kanji, hands grinding —
would lift it more than any amount of code. Natural light, no flash, plain
background.

---

## File map

```
build.js                   the generator. Run it after editing products.js
assets/js/products.js      ← ALL YOUR CONTENT LIVES HERE
assets/js/site.js          cart, floating button, filters, animation
assets/css/style.css       all styling; design tokens at the top
assets/labels/             product label images
assets/art/                artwork cropped from the labels
assets/brand/              logo and favicons
assets/icons/              source icons + sprite.html (inlined at build time)
.tastemaker/style-lock.md  the design system: colours, type, spacing, and why
index.html                 generated — edit products.js, not this
products.html              generated
product/*.html             generated
```

Anything marked *generated* is overwritten by `node build.js`. Put your changes
in `products.js`.
