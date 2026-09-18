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

### Sample reviews — turn these off before you share the site

`products.js` has `showSampleReviews: true`. That shows a placeholder layout so
you can see how the reviews section looks and moves.

**Set it to `false` before you share the site publicly**, or paste a real review
into `testimonials` (which switches the real section on automatically). `node
build.js` prints a warning every time you build while the samples are showing.

The sample cards deliberately carry **no name, no town, no star rating and no
date**. That is not laziness — India's BIS IS 19000 requires a verified identity,
a real rating and a date on any published review, and Google penalises fake
review markup. Nothing in the site's machine-readable data claims a rating while
you have none.

### Enquiry options

`products.js` has an `enquiries` list — bulk order, custom blend, sending it
abroad, a product question, and feedback. Each one opens WhatsApp with its first
line already written. Edit the wording there; the tiles rebuild themselves.

The feedback option is the honest route to real reviews: it asks the customer in
the message whether you may publish what they say.

### Questions (FAQ)

`products.js` has a `faq` list. Answer honestly — an awkward true answer earns
more trust than a polished vague one. "Prices are on WhatsApp while we finish the
price list" is a line a template would never write, which is exactly why it works.

### Allergens

Each product has an `allergens` list, shown on its page. Health Mix declares
peanuts, almonds, pistachios and cashews. Under India's FSS labelling rules these
declarations must reach the customer **before** they buy when you sell online, so
keep them accurate and consistent with the printed pack.

---

## Two things worth understanding

### The order list (cart)

Customers tap pack sizes straight on the product cards — no need to open each
product page — and send **one** WhatsApp message with everything:

```
*Hello Adisil! I'd like to order:*

- Health Mix 250g x2
- Multi Millet Dosai Mix 500g x1
- Mappillai Samba Kanji Mix 500g x1

Could you confirm the price and delivery?
```

The `*bold*` is WhatsApp's own formatting, so the first line and the total stand
out in a busy inbox. Product names are sent in English only: the same list in
Tamil is about four times longer once encoded into a link, and WhatsApp truncates
long ones.

Tapping a size turns that button into a **− 1 +** stepper in place, so a second
size is one more tap. A running total sits in a bar at the bottom of the screen.

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
lib/imgsize.js             reads real image sizes at build time (no dependency)
assets/js/products.js      ← ALL YOUR CONTENT LIVES HERE
assets/js/site.js          cart, floating button, filters, animation
assets/css/style.css       all styling; design tokens at the top
assets/labels/             product label images
assets/art/                artwork cropped from the labels
assets/brand/              logo and favicons
assets/icons/              source icons + sprite.html (inlined at build time)
assets/ingredients/        the 7 ingredient bowls, cut from the Ulundhu pack
.tastemaker/style-lock.md  the design system: colours, type, spacing, and why
index.html                 generated — edit products.js, not this
products.html              generated
product/*.html             generated
```

Anything marked *generated* is overwritten by `node build.js`. Put your changes
in `products.js`.
