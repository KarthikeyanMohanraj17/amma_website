#!/usr/bin/env node
/* ==========================================================================
   ADISIL ORGANIC FOODS — site generator

     node build.js

   Reads assets/js/products.js and writes:
     index.html                  home
     products.html               the full catalogue, filterable
     product/<slug>.html         one real page per product

   Run this after you edit products.js. No npm install, no dependencies —
   only Node's own built-in modules.

   Why generate instead of rendering in the browser: each product gets its own
   file, so sharing a link on WhatsApp shows THAT product's photo and name, and
   Google lists each product separately.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { imgSize } = require('./lib/imgsize');

const ROOT = __dirname;
const rd = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const exists = p => fs.existsSync(path.join(ROOT, p));

/* --- Load products.js by running it with a fake `window` ------------------ */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(rd('assets', 'js', 'products.js'), sandbox, { filename: 'products.js' });
const D = sandbox.window.ADISIL;
if (!D) { console.error('products.js did not set window.ADISIL'); process.exit(1); }

const B = D.business;
const SPRITE = rd('assets', 'icons', 'sprite.html').trim();
const SITE = (B.siteUrl || '').replace(/\/$/, '');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pad = n => (n < 10 ? '0' + n : String(n));
const wa = msg => 'https://wa.me/' + B.whatsapp + '?text=' + encodeURIComponent(msg);
const WA_GENERAL = wa("Hello Adisil! I saw your website and I'd like to order.");

const products = D.products.filter(p => !p.hidden);
const reviews  = (D.testimonials || []).filter(t => t && t.text);
const samplesOn = !reviews.length && D.showSampleReviews && (D.sampleReviews || []).length;

const icon = (n, cls) =>
  `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;

/* Emit a <picture> with real intrinsic dimensions read from the file itself,
   so the browser reserves the right space and the page never jumps. */
function pic(src, alt, o) {
  o = o || {};
  const dim = imgSize(path.join(ROOT, src));
  const webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
  const useWebp = webp !== src && exists(webp);
  const base = o.base || '';
  const attrs = [
    `src="${base}${src}"`,
    dim ? `width="${dim.w}" height="${dim.h}"` : '',
    `alt="${esc(alt)}"`,
    o.eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"',
    o.cls ? `class="${o.cls}"` : '',
  ].filter(Boolean).join(' ');
  return '<picture>' +
    (useWebp ? `<source srcset="${base}${webp}" type="image/webp">` : '') +
    `<img ${attrs}>` +
  '</picture>';
}

const priceOf = (p, g) => {
  const v = p.prices && p.prices[g];
  return (v === null || v === undefined || v === '') ? null : v;
};
const priceLabel = (p, g) => {
  const v = priceOf(p, g);
  return v === null ? 'Price on WhatsApp' : '₹' + v;
};

/* ==========================================================================
   Shared partials
   ========================================================================== */

function head(o) {
  const canonical = SITE && o.url ? `\n<link rel="canonical" href="${SITE}/${o.url}">` : '';
  const ogUrl     = SITE && o.url ? `\n<meta property="og:url" content="${SITE}/${o.url}">` : '';
  const ogImg     = SITE ? `${SITE}/${o.image}` : o.image;
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="theme-color" content="${o.themeColour || '#FDF7EC'}">${canonical}

<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="Adisil Organic Foods">
<meta property="og:title" content="${esc(o.ogTitle || o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:image" content="${ogImg}">${ogUrl}
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="${o.base}assets/brand/icon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${o.base}assets/brand/icon-180.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;500;700&family=Noto+Serif+Tamil:wght@600&display=swap">
<link rel="stylesheet" href="${o.base}assets/css/style.css">
${o.jsonld ? `<script type="application/ld+json">${JSON.stringify(o.jsonld)}</script>\n` : ''}
<script>
document.documentElement.classList.remove('no-js');
window.ADISIL_BASE = ${JSON.stringify(o.base)};
</script>
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ''}${o.pageColour ? ` style="--pc:${o.pageColour}"` : ''}>

<a class="skip-link" href="#main">Skip to content</a>

<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
${SPRITE}
</svg>
`;
}

function nav(o) {
  const on = k => (o.here === k ? ' aria-current="page"' : '');
  const dark = o.navOnDark ? ' nav--on-dark' : '';
  return `
<header class="nav${dark}" id="nav">
  <div class="wrap nav__inner">
    <a class="nav__logo" href="${o.base}index.html">
      <img class="nav__logo-dark" src="${o.base}assets/brand/logo.png" alt="Adisil Organic Foods" width="461" height="258" fetchpriority="high">
      <img class="nav__logo-light" src="${o.base}assets/brand/logo-light.png" alt="" aria-hidden="true" width="461" height="258">
      <span class="nav__logo-text"><b>Adisil</b><span>Organic Food</span></span>
    </a>
    <nav class="nav__links" aria-label="Main">
      <a href="${o.base}products.html"${on('products')}>All products</a>
      <a href="${o.base}index.html#enquiry">Bulk &amp; enquiries</a>
      <a href="${o.base}index.html#faq">Questions</a>
    </nav>
    <button type="button" class="cart-btn" data-cart-open aria-haspopup="dialog">
      ${icon('shopping-bag')}
      <span class="cart-btn__label">Order</span>
      <span class="cart-btn__count" data-cart-count hidden>0</span>
    </button>
  </div>
</header>
`;
}

/* The order drawer, the sticky order bar, the floating WhatsApp button and the
   one polite live region — present on every page. */
function chrome(o) {
  return `
<div class="sr-only" role="status" aria-live="polite" data-live></div>

<div class="drawer" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>
  <div class="drawer__scrim" data-cart-close></div>
  <div class="drawer__panel">
    <header class="drawer__head">
      <h2 id="cart-title">Your order</h2>
      <button type="button" class="drawer__close" data-cart-close aria-label="Close order list">${icon('x')}</button>
    </header>
    <div class="drawer__body">
      <div class="drawer__empty" data-cart-empty>
        <p>Nothing here yet. Tap a size on any mix and it collects here, so you can
        send everything in one message.</p>
        <p><a href="${o.base}products.html">See all products</a> ·
           <a href="${o.base}index.html#enquiry">Bulk or custom order</a></p>
      </div>
      <ul class="cart-list" data-cart-list></ul>
    </div>
    <footer class="drawer__foot" data-cart-foot hidden>
      <div class="cart-total" data-cart-total></div>
      <a class="btn btn--wa" data-cart-send href="${WA_GENERAL}">
        ${icon('brand-whatsapp')} Send this order on WhatsApp
      </a>
      <p class="drawer__note">Opens WhatsApp with your list already written out.
      Nothing is charged here — we reply with the price and delivery.</p>
    </footer>
  </div>
</div>

<div class="order-bar" data-order-bar hidden>
  <div class="wrap order-bar__inner">
    <button type="button" class="order-bar__summary" data-cart-open>
      ${icon('shopping-bag')}
      <span data-order-bar-text>0 packets</span>
      <span class="order-bar__hint">Price on WhatsApp</span>
      <span class="order-bar__edit">Edit</span>
    </button>
    <a class="btn btn--wa" data-cart-send href="${WA_GENERAL}">
      ${icon('brand-whatsapp')} Send on WhatsApp
    </a>
  </div>
</div>

<div class="wa-dock" data-wa-dock>
  <button type="button" class="wa-dock__min" data-wa-toggle aria-label="Collapse the WhatsApp button">${icon('minus')}</button>
  <a class="wa-dock__btn" href="${WA_GENERAL}" aria-label="Order on WhatsApp">
    ${icon('brand-whatsapp')}<span class="wa-dock__label">Order on WhatsApp</span>
  </a>
</div>
`;
}

function footer(o) {
  const links = products.map(p =>
    `<li><a href="${o.base}product/${p.slug}.html">${esc(p.name)}</a></li>`).join('\n          ');
  return `
<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div>
        <img class="footer__mark" src="${o.base}assets/brand/logo-light.png" alt="" aria-hidden="true" width="461" height="258">
        <h3>Adisil Organic Food</h3>
        <p>Traditional Tamil health mixes, kanji mixes, masalas, podis and thokku.
        Freshly packed, no preservatives.</p>
      </div>
      <div>
        <h3>What we make</h3>
        <ul>
          ${links}
          <li><a href="${o.base}products.html">See all products</a></li>
        </ul>
      </div>
      <div>
        <h3>Order &amp; enquiries</h3>
        <ul>
          <li><a href="${WA_GENERAL}">WhatsApp ${esc(B.whatsappDisplay)}</a></li>
          <li><a href="${o.base}index.html#enquiry">Bulk, custom &amp; feedback</a></li>
          <li><a href="${o.base}index.html#faq">Storage &amp; shelf life</a></li>
        </ul>
      </div>
      <div>
        <h3>Follow</h3>
        <div class="footer__social">
          <a href="${B.instagram}" rel="me noopener" aria-label="Adisil Organic Foods on Instagram">${icon('brand-instagram')}</a>
          <a href="${B.facebook}" rel="me noopener" aria-label="Adisil Organic Foods on Facebook">${icon('brand-facebook')}</a>
        </div>
      </div>
    </div>
    <div class="footer__legal">
      <span>FSSAI Licence no. ${esc(B.fssai)}</span>
      <span>&copy; ${new Date().getFullYear()} Adisil Organic Foods</span>
    </div>
  </div>
</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
        integrity="sha512-7eHRwcbYkK4d9g/6tD/mhkf++eoTHwpNM9woBxtPUBWm67zeAfFC+HrdoE2GanKeocly/VxeLvIqwvCdk7qScg=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
        integrity="sha512-onMTRKJBKz8M1TnqqDuGBlowlH0ohFzMXYRNebz+yOcc5TQr/zAKsthzhuv0hiyUKEiQEQXEynnXCvNTOk50dg=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="${o.base}assets/js/products.js"></script>
<script src="${o.base}assets/js/site.js"></script>
</body>
</html>
`;
}

/* ==========================================================================
   Components
   ========================================================================== */

function stars(n) {
  if (!n) return '';
  let out = `<span class="stars" role="img" aria-label="${n} out of 5">`;
  for (let i = 1; i <= 5; i++) out += icon(i <= n ? 'star-filled' : 'star');
  return out + '</span>';
}

/* One quick-add component. Emitted by productCard() only, so there is exactly
   one implementation and one delegated handler in site.js. */
function quickAdd(p) {
  const btns = D.weights.map(g =>
    `<button type="button" class="qa" data-qa-add data-grams="${g}"
              aria-label="Add ${esc(p.name)}, ${g} grams">${g}<span>g</span></button>`
  ).join('\n        ');
  return `
      <div class="quickadd" data-buy data-slug="${esc(p.slug)}" data-name="${esc(p.name)}">
        <span class="quickadd__label kicker">Add a pack</span>
        <div class="quickadd__row" role="group" aria-label="Pack sizes for ${esc(p.name)}">
        ${btns}
        </div>
      </div>`;
}

function productCard(p, o) {
  const dish = `assets/art/dish-${p.slug}.jpg`;
  const media = exists(dish)
    ? pic(dish, '', { base: o.base, cls: 'card__dish' })
    : pic(`assets/labels/${p.slug}.jpg`, '', { base: o.base });
  const count = p.ingredientCount
    ? `<span class="card__count">${p.ingredientCount} ingredients, all named</span>` : '';
  const nuts = (p.allergens || []).length
    ? `<span class="card__nuts">Contains ${esc(p.allergens.join(', ').toLowerCase())}</span>` : '';
  return `
  <article class="card" style="--pc:${p.colour}" data-category="${esc(p.category)}" data-card="${esc(p.slug)}">
    <div class="card__media">${media}</div>
    <div class="card__body">
      <span class="kicker card__cat">${esc(p.category)}</span>
      <p class="card__tamil tamil">${esc(p.nameTamil)}</p>
      <h3><a href="${o.base}product/${p.slug}.html">${esc(p.name)}</a></h3>
      ${count}
      ${nuts}
      <p class="card__state" data-card-state hidden></p>
      <p class="card__price">${esc(priceLabel(p, D.weights[0]))}<span> · ${D.weights[0]}g</span></p>
    </div>
${quickAdd(p)}
  </article>`;
}

/* The seven ingredient photos, cut from the pack and laid out natively so
   nothing sits in a white box on a dark ground. */
function ingredientDiscs(o, p) {
  if (!p || !p.ingredientIcons || p.ingredientIcons.length !== p.ingredients.length) return '';
  const index = JSON.parse(rd('assets', 'ingredients', 'index.json'));
  const byslug = {};
  index.forEach(i => { byslug[i.slug] = i.label; });
  const items = p.ingredientIcons.map(slug => {
    const src = `assets/ingredients/${slug}.png`;
    if (!exists(src)) return '';
    return `
        <li class="ingr__item">
          ${pic(src, '', { base: o.base })}
          <span>${esc(byslug[slug] || slug)}</span>
        </li>`;
  }).join('');
  if (!items) return '';
  return `
      <figure class="ingr" aria-label="The ${p.ingredientIcons.length} ingredients printed on the ${esc(p.name)} pack">
        <ul class="ingr__row" role="list">${items}
        </ul>
        <figcaption>Every ingredient printed on the ${esc(p.name)} pack — all
        ${p.ingredientIcons.length} of them, in the order they appear on the label.</figcaption>
      </figure>`;
}

function enquirySection(o, product) {
  const tiles = (D.enquiries || []).map(e => {
    let text = e.text;
    if (e.id === 'question' && product) text = text.replace('Product: ', 'Product: ' + product.name);
    return `
      <a class="tile" href="${wa(text)}">
        ${icon(e.icon, 'tile__icon')}
        <span class="tile__body">
          <b>${esc(e.label)}</b>
          <span>${esc(e.desc)}</span>
        </span>
        ${icon('chevron-right', 'tile__go')}
      </a>`;
  }).join('');
  if (!tiles) return '';
  return `
  <section class="enquiry" id="enquiry">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">Ask us directly</p>
        <h2>Bulk orders, custom blends, and anything else.</h2>
        <p class="enquiry__lede">There is no form. Pick what you need and it opens
        WhatsApp with the first line already written, so you are not starting from a
        blank screen. We are two people — you get a real reply, usually the same day.</p>
      </header>
      <div class="tiles">${tiles}
      </div>
      <p class="enquiry__foot">We reply from the same number the order goes to:
      ${esc(B.whatsappDisplay)}</p>
    </div>
  </section>`;
}

/* Real reviews if there are any. Otherwise a clearly-labelled sample layout,
   which carries no name, no rating and no date — because inventing those for a
   food business is both dishonest and, in India, regulated. */
function reviewsSection(o) {
  if (reviews.length) {
    const cards = reviews.map(t => {
      const who = [esc(t.name), t.place ? esc(t.place) : ''].filter(Boolean).join(' · ');
      const prod = t.product && products.find(p => p.slug === t.product);
      return `
        <figure class="quote"${prod ? ` style="--pc:${prod.colour}"` : ''}>
          ${stars(t.rating)}
          <blockquote>${esc(t.text)}</blockquote>
          <figcaption>${who}${prod ? `<span class="quote__prod">on ${esc(prod.name)}</span>` : ''}</figcaption>
        </figure>`;
    }).join('');
    return `
  <section class="reviews" id="reviews">
    <div class="wrap">
      <header class="section-head"><p class="kicker">What people say</p>
      <h2>From the people cooking it</h2></header>
      <div class="quotes">${cards}
      </div>
    </div>
  </section>`;
  }

  if (!samplesOn) return '';

  const card = t => `
        <li class="sample-card" data-placeholder>
          <span class="sample-card__tag">Sample — not a customer review</span>
          <span class="sample-card__body">${esc(t)}</span>
        </li>`;
  const once = D.sampleReviews.map(card).join('');
  return `
  <section class="reviews reviews--sample" id="reviews">
    <div class="wrap">
      <header class="section-head section-head--row">
        <div>
          <p class="kicker">Sample layout</p>
          <h2>No customer reviews yet.</h2>
          <p>This is a placeholder so we can see how reviews will sit on the page.
          Nothing here was written by a customer. When people send us feedback on
          WhatsApp and say we may publish it, their words replace this — with their
          name, their town and the date.</p>
        </div>
        <button type="button" class="btn btn--ghost" data-marquee-toggle aria-pressed="false">
          ${icon('minus')}<span data-marquee-label>Pause</span>
        </button>
      </header>
    </div>
    <div class="marquee" data-marquee>
      <ul class="marquee__track" role="list">${once}</ul>
      <ul class="marquee__track" role="list" aria-hidden="true" inert>${once}</ul>
    </div>
    <div class="wrap">
      <p class="reviews__cta">
        <a href="${wa((D.enquiries.find(e => e.id === 'feedback') || {}).text || 'Hello Adisil!')}">
          Ordered from us? Tell us how it went ${icon('chevron-right')}</a>
      </p>
    </div>
  </section>`;
}

function faqSection(o) {
  const items = (D.faq || []).map((f, i) => `
        <details class="faq__item"${i === 0 ? ' open' : ''}>
          <summary>${esc(f.q)}${icon('chevron-down', 'faq__chev')}</summary>
          <div class="faq__a"><p>${esc(f.a)}</p></div>
        </details>`).join('');
  if (!items) return '';
  return `
  <section class="faq" id="faq">
    <div class="wrap faq__grid">
      <div class="faq__side">
        <p class="kicker">Before you ask</p>
        <h2>The things people message us about.</h2>
        <p class="faq__note">Anything else, just ask on WhatsApp — you get a real
        reply, usually the same day.</p>
      </div>
      <div class="faq__list">${items}
      </div>
    </div>
  </section>`;
}

function howToOrder(o) {
  return `
  <section class="howto">
    <div class="wrap howto__inner">
      <p class="howto__lead"><b>No checkout.</b> You build a list, we reply on WhatsApp.</p>
      <ol class="howto__steps">
        <li><b>1</b><span>Tap the sizes you want</span></li>
        <li><b>2</b><span>Your list builds at the bottom of the page</span></li>
        <li><b>3</b><span>Send it — we reply with the price and delivery</span></li>
      </ol>
    </div>
  </section>`;
}

/* Who makes this. The illustration comes off the Health Mix label. */
function storySection(o) {
  return `
  <section class="story" id="story">
    <div class="wrap story__grid">
      <figure class="story__art">
        ${pic('assets/art/hero-family.jpg',
              'Illustration from the Adisil Health Mix label: a mother feeding her son a bowl of health mix at a wooden table.',
              { base: o.base })}
        <figcaption>From our Health Mix label</figcaption>
      </figure>
      <div class="story__copy">
        <p class="kicker">Who makes this</p>
        <h2>Two people, one kitchen, one grinder.</h2>
        <p>Adisil is a small kitchen in Tamil Nadu. We roast and stone-grind in
        batches we can stand over — which is why the packets say three months and
        not a year, and why you can read every ingredient on the back.</p>
        <p>These are the mixes our own families eat: health mix in the morning,
        kanji when someone needs feeding up, dosai maavu when there is no time to
        soak and grind. Nothing in them is new. We have just packed them properly
        so you can get them without making them yourself.</p>
        <p class="story__sign">— Adisil Organic Food, Tamil Nadu</p>
      </div>
    </div>
  </section>`;
}

/* Every ingredient across the whole range, and which mixes use it.

   The same ingredient is spelled differently on different packs — "Almond" on
   one and "Almonds" on another, "Cardamom" and "Cardamom (Elaka)", and four
   spellings of green gram. Counting those as separate ingredients would inflate
   the headline number, so they are folded together here. Each entry below maps
   the variants that appear in products.js onto one canonical name.

   Things that only LOOK alike are deliberately NOT merged: idli rice, raw rice,
   red rice and mappillai samba rice are different rices; bengal gram dal, split
   bengal gram and roasted bengal gram are different preparations. */
const INGREDIENT_ALIASES = [
  { name: 'Almonds',                            variants: ['Almond', 'Almonds'] },
  { name: 'Cashews',                            variants: ['Cashew', 'Cashews'] },
  { name: 'Cardamom (Elaka)',                   variants: ['Cardamom', 'Cardamom (Elaka)'] },
  { name: 'Dry Ginger (Sukku)',                 variants: ['Dry Ginger', 'Dry Ginger (Sukku)'] },
  { name: 'Black Urad Dal (Karupu Ulundhu)',    variants: ['Black Urad Dal', 'Black Urad Dal (Karupu Ulundhu)'] },
  { name: 'Black Kavuni Rice (Karuppu Kavuni Arisi)',
    variants: ['Black Kavuni Rice', 'Karuppu Kavuni Arisi (Black Kavuni Rice)'] },
  { name: 'Green Gram (Moong)',
    variants: ['Green Gram (Paadi Payiru)', 'Green Gram (Pachai Payiru)',
               'Green Moong Dal', 'Paasi Paruppu (Green Gram)'] },
];

const canonical = (() => {
  const m = new Map();
  INGREDIENT_ALIASES.forEach(a => a.variants.forEach(v => m.set(v.toLowerCase(), a.name)));
  return n => m.get(n.trim().toLowerCase()) || n.trim();
})();

function ingredientIndexSection(o) {
  const map = new Map();
  products.forEach(p => p.ingredients.forEach(n => {
    const k = canonical(n);
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(p);
  }));
  const names = [...map.keys()].sort((a, b) => a.localeCompare(b));
  if (!names.length) return '';

  const items = names.map(n => {
    const used = [...map.get(n)];
    const many = used.length > 1;
    return `<li${many ? ' class="is-shared"' : ''}${!many ? ` style="--pc:${used[0].colour}"` : ''}>` +
           `${esc(n)}${many ? `<i>in ${used.length}</i>` : ''}</li>`;
  }).join('');

  return `
  <section class="index" id="ingredients">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">Everything that goes in</p>
        <h2>${names.length} ingredients across ${products.length} mixes. That is the whole list.</h2>
        <p>Not "a blend of grains and pulses" — the actual names, the same ones
        printed on the back of each packet. If something is not on this list, it is
        not in anything we make.</p>
      </header>
      <ul class="index__wall" role="list">${items}
      </ul>
      <p class="index__foot">No preservatives, no added colour, no artificial
      flavour, no anti-caking agent, no filler.</p>
    </div>
  </section>`;
}

/* The fold. Dark ground, the food first, and the category said plainly. */
function heroSection(o) {
  const rangeItems = products.map(p => {
    const dish = `assets/art/dish-${p.slug}.jpg`;
    const src = exists(dish) ? dish : `assets/labels/${p.slug}.jpg`;
    return `
          <li><a href="product/${p.slug}.html" style="--pc:${p.colour}"
                 aria-label="${esc(p.name)}">
            ${pic(src, '', { base: '' })}
          </a></li>`;
  }).join('');

  return `
  <section class="hero">
    <div class="hero__glow" aria-hidden="true"></div>
    <div class="wrap hero__grid">

      <div class="hero__copy">
        <p class="hero__mark">
          <span class="tamil">${esc(B.nameTamil)}</span>
          <span class="hero__rule" aria-hidden="true"></span>
          <span>Organic Food</span>
        </p>

        <h1>Health mix, kanji and dosai maavu<em>ground in our kitchen, sent to yours.</em></h1>

        <p class="hero__sub">Two of us, one kitchen in Tamil Nadu. Traditional mixes
        roasted and stone-ground in small batches, packed at 100g, 250g or 500g,
        and ordered straight on WhatsApp.</p>

        <div class="hero__cta">
          <a class="btn btn--wa" href="${WA_GENERAL}">${icon('brand-whatsapp')} Order on WhatsApp</a>
          <a class="btn btn--ghost-dark" href="products.html">See all ${products.length} mixes ${icon('arrow-right')}</a>
        </div>

        <p class="hero__enq"><a href="#enquiry">Bulk order, custom blend, or sending it
        abroad? Message us.</a></p>

        <div class="hero__range">
          <ul role="list">${rangeItems}
          </ul>
          <a class="hero__range-all" href="products.html">All ${products.length}, made in the same kitchen ${icon('chevron-right')}</a>
        </div>

        <p class="hero__licence">Nothing added to make it keep longer ·
        100g / 250g / 500g · FSSAI licensed</p>
      </div>

      <div class="hero__table">
        <figure class="plate plate--kanji">
          ${pic('assets/art/dish-karuppu-kavuni-kanji.jpg',
                'A clay bowl of black kavuni rice kanji with a sprig of mint.',
                { base: '', eager: true })}
          <figcaption class="plate__tag">
            <b>Kavuni Kanji</b><span class="tamil">கருப்பு கவுனி கஞ்சி</span>
          </figcaption>
        </figure>
        <figure class="plate plate--dosai">
          ${pic('assets/art/dish-dosai-mix.jpg',
                'A golden multi-millet dosai on a banana leaf with coconut chutney and sambar.',
                { base: '', eager: true })}
        </figure>
        <figure class="plate plate--samba">
          ${pic('assets/art/dish-mappillai-samba-kanji.jpg',
                'A blue and white porcelain bowl of mappillai samba kanji with scoops of red rice, black urad and green moong.',
                { base: '' })}
        </figure>
        <figure class="plate plate--packet">
          ${pic('assets/labels/health-mix.jpg',
                'The Adisil Health Mix packet, showing the full list of twenty ingredients.',
                { base: '', eager: true })}
        </figure>
      </div>

    </div>
  </section>`;
}

/* ==========================================================================
   Pages
   ========================================================================== */

function homePage() {
  const o = { base: '', here: 'home', navOnDark: true };
  return head({
    base: '', url: 'index.html', bodyClass: 'page-home', themeColour: '#063314',
    title: 'Adisil Organic Foods — Tamil health mix, kanji mixes, masalas & podis',
    description: 'Traditional Tamil health mix, kanji mixes and dosai maavu, roasted and stone-ground by hand in small batches. No preservatives. FSSAI licensed. Order on WhatsApp.',
    image: 'assets/labels/health-mix.jpg',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: 'Adisil Organic Foods',
      description: 'Traditional Tamil homemade health mixes, kanji mixes, masalas and podis.',
      sameAs: [B.instagram, B.facebook],
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+' + B.whatsapp }
    }
  }) + nav(o) + `
<main id="main">
${heroSection(o)}
${howToOrder(o)}

  <section class="catalogue" id="catalogue">
    <div class="wrap">
      <header class="section-head section-head--row">
        <div>
          <p class="kicker">What we make</p>
          <h2>${products.length} mixes. Tap a size to start a list.</h2>
          <p>Every product page shows its complete ingredient list, in the order it is
          printed on the pack. Nothing summarised, nothing behind a "natural blend".</p>
        </div>
        <a class="btn btn--ghost" href="products.html">All products ${icon('arrow-right')}</a>
      </header>
      <div class="cards">${products.map(p => productCard(p, o)).join('')}
      </div>
    </div>
  </section>


  <section class="proof">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">Why you can trust a kitchen this small</p>
        <h2>Small kitchen. Real licence.</h2>
      </header>
      <div class="proof__grid">
        <ul class="creds">
          <li class="cred">${icon('certificate')}
            <span><b>FSSAI licensed</b><span>Licence no. <code>${esc(B.fssai)}</code> — a
            registered food business. You can look the number up on the FSSAI register.</span></span></li>
          <li class="cred">${icon('ban')}
            <span><b>Nothing added</b><span>No preservatives, no added colour, no artificial
            flavour. Every ingredient is named on the pack and on this site.</span></span></li>
          <li class="cred">${icon('chef-hat')}
            <span><b>Made in small batches</b><span>By two people, to traditional Tamil
            recipes — roasted and ground in quantities we can actually watch over.</span></span></li>
          <li class="cred">${icon('clock')}
            <span><b>Best before three months</b><span>From the date the packet is opened.
            Short on purpose: nothing goes in to make it keep longer.</span></span></li>
        </ul>
${ingredientDiscs(o, products.find(p => p.slug === 'karupu-ulundhu-kanji'))}
      </div>
    </div>
  </section>
${storySection(o)}
${ingredientIndexSection(o)}
${reviewsSection(o)}
${enquirySection(o)}


${faqSection(o)}

  <section class="close">
    <div class="wrap">
      <h2>Tell us what you'd like.</h2>
      <p>Build your list, send it on WhatsApp, and we will confirm the price and the packing.</p>
      <a class="btn btn--wa" href="${WA_GENERAL}">${icon('brand-whatsapp')} Start a message on WhatsApp</a>
      <p class="close__num">${esc(B.whatsappDisplay)}</p>
    </div>
  </section>

</main>
` + chrome(o) + footer(o);
}

function productsPage() {
  const o = { base: '', here: 'products' };
  const cats = [...new Set(products.map(p => p.category))];
  const chips = ['All', ...cats].map((c, i) =>
    `<button type="button" class="chip" data-filter="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`
  ).join('\n        ');

  const groups = (D.comingSoon && D.comingSoon.groups || []).filter(g => g.items && g.items.length);
  const soon = groups.length ? `
  <section class="more">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">In the kitchen</p>
        <h2>${esc(D.comingSoon.heading)}</h2>
        <p>${esc(D.comingSoon.note)}</p>
      </header>
      <div class="more__grid">
        ${groups.map(g => `
        <article class="more__card" style="--cc:${g.colour}">
          ${icon(g.icon)}<h3>${esc(g.category)}</h3>
          <ul>${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        </article>`).join('')}
      </div>
    </div>
  </section>` : '';

  const presets = D.weights.slice(0, 2).map(g =>
    `<button type="button" class="chip chip--preset" data-preset="${g}">Add all ${products.length} · ${g}g each</button>`
  ).join('\n        ');

  return head({
    base: '', url: 'products.html', themeColour: '#F7E9CF',
    title: 'All products — Adisil Organic Foods',
    description: `Every Adisil mix with its complete ingredient list: ${products.map(p => p.name).join(', ')}. Small batches, no preservatives. Order on WhatsApp.`,
    image: 'assets/labels/health-mix.jpg'
  }) + nav(o) + `
<main id="main">
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="index.html">Home</a> ${icon('chevron-right')} <span aria-current="page">All products</span>
      </nav>
      <h1>Everything we make</h1>
      <p class="page-head__lede">${products.length} products, each with its full
      ingredient list printed here exactly as it appears on the pack. Every one comes
      in ${D.weights.join('g, ')}g. Tap a size to add it — you can pick several and
      send one message.</p>
      <div class="chips" role="group" aria-label="Filter by category">
        ${chips}
      </div>
      <div class="chips chips--presets">
        ${presets}
      </div>
    </div>
  </section>

  <section class="catalogue catalogue--flush">
    <div class="wrap">
      <div class="cards" data-grid>${products.map(p => productCard(p, o)).join('')}
      </div>
      <p class="cards__none" data-none hidden>Nothing in that category yet.</p>
    </div>
  </section>
${soon}
${enquirySection(o)}
</main>
` + chrome(o) + footer(o);
}

function productPage(p) {
  const o = { base: '../', here: 'products' };

  const ings = p.ingredients.map((n, k) =>
    `<li><i>${pad(k + 1)}</i><span>${esc(n)}</span></li>`).join('\n          ');
  const bens = (p.benefits || []).map(b =>
    `<li class="benefit">${icon(b[0])}<span>${esc(b[1])}</span></li>`).join('\n          ');
  const prep = (p.prepare || []).map(s => `<li><span>${esc(s)}</span></li>`).join('\n          ');

  const mine = reviews.filter(t => t.product === p.slug);
  const rated = mine.filter(t => typeof t.rating === 'number');

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, description: p.blurb,
    image: (SITE ? SITE + '/' : '') + `assets/labels/${p.slug}.jpg`,
    brand: { '@type': 'Brand', name: 'Adisil Organic Foods' },
    category: p.category
  };
  /* Rating markup only ever appears when real, named, rated reviews exist. */
  if (rated.length && !samplesOn) {
    jsonld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (rated.reduce((s, t) => s + t.rating, 0) / rated.length).toFixed(1),
      reviewCount: rated.length
    };
    jsonld.review = rated.map(t => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.name },
      reviewRating: { '@type': 'Rating', ratingValue: t.rating },
      reviewBody: t.text
    }));
  }

  const others = products.filter(x => x.slug !== p.slug).slice(0, 3);
  const weights = D.weights.map((g, i) => `
        <button type="button" class="weight" data-grams="${g}" aria-pressed="${i === 0}">
          <b>${g} g</b><span>${esc(priceLabel(p, g))}</span>
        </button>`).join('');

  const allerg = (p.allergens || []).length
    ? `<div><dt>Allergens</dt><dd><b>Contains ${esc(p.allergens.join(', ').toLowerCase())}.</b>
       Made in a kitchen that also handles nuts.</dd></div>`
    : `<div><dt>Allergens</dt><dd>None of the listed ingredients is a declared allergen.
       Made in a kitchen that also handles nuts.</dd></div>`;

  const myQuotes = mine.length ? `
  <section class="reviews">
    <div class="wrap">
      <header class="section-head"><p class="kicker">What people say</p>
      <h2>On ${esc(p.name)}</h2></header>
      <div class="quotes">${mine.map(t => `
        <figure class="quote" style="--pc:${p.colour}">
          ${stars(t.rating)}<blockquote>${esc(t.text)}</blockquote>
          <figcaption>${esc(t.name)}${t.place ? ' · ' + esc(t.place) : ''}</figcaption>
        </figure>`).join('')}
      </div>
    </div>
  </section>` : '';

  return head({
    base: '../', url: `product/${p.slug}.html`, themeColour: p.colour,
    title: `${p.name} — Adisil Organic Foods`,
    ogTitle: `${p.name} · Adisil Organic Foods`,
    description: `${p.blurb} ${p.ingredientCount ? p.ingredientCount + ' named ingredients. ' : ''}Available in ${D.weights.join('g, ')}g. No preservatives. Order on WhatsApp.`.trim(),
    image: `assets/labels/${p.slug}.jpg`,
    ogType: 'product', pageColour: p.colour, jsonld
  }) + nav(o) + `
<main id="main">
  <article class="detail">
    <div class="detail__band">
      <div class="wrap detail__grid">
        <figure class="detail__plate">
          ${pic(`assets/labels/${p.slug}.jpg`,
                `The printed label for Adisil ${p.name}, showing the full ingredient list and preparation instructions.`,
                { base: '../', eager: true })}
        </figure>
        <div class="detail__intro">
          <nav class="crumbs crumbs--dark" aria-label="Breadcrumb">
            <a href="../index.html">Home</a> ${icon('chevron-right')}
            <a href="../products.html">Products</a> ${icon('chevron-right')}
            <span aria-current="page">${esc(p.name)}</span>
          </nav>
          <p class="kicker detail__cat">${esc(p.category)}</p>
          <p class="detail__tamil tamil">${esc(p.nameTamil)}</p>
          <h1>${esc(p.name)}</h1>
          <p class="detail__tagline">${esc(p.tagline)}</p>
          <p class="detail__blurb">${esc(p.blurb)}</p>

          <div class="buy" data-buy data-slug="${esc(p.slug)}" data-name="${esc(p.name)}">
            <span class="kicker">Choose a size</span>
            <div class="weights" role="group" aria-label="Pack size for ${esc(p.name)}">${weights}
            </div>
            <div class="buy__actions">
              <button type="button" class="btn btn--product" data-add-to-cart>${icon('plus')} Add to order</button>
              <a class="btn btn--ghost-dark" data-buy-now href="${wa("Hello Adisil! I'd like to know more about:\n" + p.name + ' — ' + D.weights[0] + 'g')}">
                ${icon('brand-whatsapp')} Ask about this one
              </a>
            </div>
            <p class="buy__note" data-buy-note hidden></p>
          </div>
        </div>
      </div>
    </div>

    <div class="wrap detail__body">
      <div class="detail__main">
        <div class="ingredients">
          <div class="ingredients__head">
            <span class="kicker">Ingredients</span>
            ${p.ingredientCount ? `<span class="ingredients__count">${p.ingredientCount}</span>` : ''}
          </div>
          <ol>
          ${ings}
          </ol>
          <p class="ingredients__note">Printed on the pack in this order.</p>
        </div>
        ${bens ? `<ul class="benefits">
          ${bens}
        </ul>` : ''}
        ${prep ? `<div class="prepare">
          <span class="kicker">How to prepare</span>
          <ol>
          ${prep}
          </ol>
        </div>` : ''}
      </div>

      <aside class="detail__aside">
        <dl class="spec">
          <div><dt>Net weights</dt><dd>${D.weights.join('g · ')}g</dd></div>
          ${allerg}
          <div><dt>Veg</dt><dd>Vegetarian. ${p.veg ? 'Green mark.' : ''}</dd></div>
          <div><dt>Best before</dt><dd>${esc(B.shelfLife)}</dd></div>
          <div><dt>Storage</dt><dd>Cool, dry place. Use a clean, dry spoon and keep the pack tightly closed.</dd></div>
          <div><dt>Batch &amp; date</dt><dd>Printed on your pack.</dd></div>
          <div><dt>FSSAI licence</dt><dd><code>${esc(B.fssai)}</code></dd></div>
          <div><dt>Consumer care</dt><dd><a href="${WA_GENERAL}">${esc(B.whatsappDisplay)}</a></dd></div>
        </dl>
      </aside>
    </div>
${p.ingredientIcons ? `    <div class="wrap">${ingredientDiscs(o, p)}</div>` : ''}
  </article>

${myQuotes}
${enquirySection(o, p)}

  <section class="related">
    <div class="wrap">
      <header class="section-head section-head--row">
        <div><p class="kicker">More from our kitchen</p><h2>You might also like</h2></div>
        <a class="btn btn--ghost" href="../products.html">All products ${icon('arrow-right')}</a>
      </header>
      <div class="cards">${others.map(x => productCard(x, o)).join('')}
      </div>
    </div>
  </section>
</main>
` + chrome(o) + footer(o);
}

/* ==========================================================================
   Write everything
   ========================================================================== */

const write = (rel, html) => {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  console.log('  ' + rel.padEnd(38) + (html.length / 1024).toFixed(1) + ' KB');
};

console.log('\nBuilding Adisil site…\n');
write('index.html', homePage());
write('products.html', productsPage());
products.forEach(p => write(`product/${p.slug}.html`, productPage(p)));

console.log(`\n${products.length} products · ${reviews.length} real review(s)`);
if (samplesOn) {
  console.log('\n  ⚠  SAMPLE review layout is showing on the site.');
  console.log('     Set  showSampleReviews: false  in assets/js/products.js before');
  console.log('     you share the site publicly, or paste in a real review.');
}
if (!SITE) {
  console.log('\n  Tip: set business.siteUrl in products.js once you have a domain,');
  console.log('       then re-run. It adds canonical + absolute social-preview URLs.');
}
console.log('\nDone.\n');
