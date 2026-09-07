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
   Google lists each product separately. A single template reading ?p=slug
   cannot do either.
   ========================================================================== */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const rd = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

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

/* Intrinsic label dimensions, so the browser reserves space before load. */
const DIMS = {
  'health-mix': [900, 1260], 'dosai-mix': [900, 1260],
  'karuppu-kavuni-kanji': [900, 1274], 'karupu-ulundhu-kanji': [900, 1350],
  'mappillai-samba-kanji': [864, 1223]
};
const dim = s => DIMS[s] || [900, 1260];

const priceOf = (p, g) => {
  const v = p.prices && p.prices[g];
  return (v === null || v === undefined || v === '') ? null : v;
};
const priceLabel = (p, g) => {
  const v = priceOf(p, g);
  return v === null ? 'Price on WhatsApp' : '₹' + v;
};
const hasAnyPrice = p => D.weights.some(g => priceOf(p, g) !== null);

const icon = (n, cls) => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${n}"></use></svg>`;

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
<meta name="theme-color" content="#FDF7EC">${canonical}

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
<body${o.pageColour ? ` style="--pc:${o.pageColour}"` : ''}>

<a class="skip-link" href="#main">Skip to content</a>

<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
${SPRITE}
</svg>
`;
}

function nav(o) {
  const on = k => (o.here === k ? ' aria-current="page"' : '');
  return `
<header class="nav" id="nav">
  <div class="wrap nav__inner">
    <a class="nav__logo" href="${o.base}index.html">
      <img src="${o.base}assets/brand/logo.png" alt="Adisil Organic Foods" width="75" height="42" fetchpriority="high">
      <span class="nav__logo-text">
        <b>Adisil</b>
        <span>Organic Food</span>
      </span>
    </a>
    <nav class="nav__links" aria-label="Main">
      <a href="${o.base}products.html"${on('products')}>All products</a>
      <a href="${o.base}index.html#why">Why it keeps 3 months</a>
      <a href="${o.base}index.html#order">How to order</a>
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

/* The cart drawer and the floating WhatsApp button appear on every page. */
function chrome(o) {
  return `
<div class="drawer" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>
  <div class="drawer__scrim" data-cart-close></div>
  <div class="drawer__panel">
    <header class="drawer__head">
      <h2 id="cart-title">Your order</h2>
      <button type="button" class="drawer__close" data-cart-close aria-label="Close order list">
        ${icon('x')}
      </button>
    </header>

    <div class="drawer__body">
      <p class="drawer__empty" data-cart-empty>
        Nothing here yet. Add a mix and its size, and it will collect here so you
        can send everything in one message.
      </p>
      <ul class="cart-list" data-cart-list></ul>
    </div>

    <footer class="drawer__foot" data-cart-foot hidden>
      <div class="cart-total" data-cart-total></div>
      <a class="btn btn--wa" data-cart-send href="${WA_GENERAL}">
        ${icon('brand-whatsapp')}
        Send this order on WhatsApp
      </a>
      <p class="drawer__note">
        This opens WhatsApp with your list already written out. Nothing is
        charged here — we reply with the price and delivery.
      </p>
    </footer>
  </div>
</div>

<div class="wa-dock" data-wa-dock>
  <button type="button" class="wa-dock__min" data-wa-toggle aria-label="Collapse the WhatsApp button">
    ${icon('minus')}
  </button>
  <a class="wa-dock__btn" href="${WA_GENERAL}" aria-label="Order on WhatsApp">
    ${icon('brand-whatsapp')}
    <span class="wa-dock__label">Order on WhatsApp</span>
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
        <h3>Adisil Organic Food</h3>
        <p style="color:var(--ink-soft)">
          Traditional Tamil health mixes, kanji mixes, masalas, podis and thokku.
          Freshly packed, no preservatives.
        </p>
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
          <li><a href="${o.base}index.html#order">How ordering works</a></li>
          <li><a href="${o.base}index.html#why">Storage &amp; shelf life</a></li>
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

function productCard(p, o) {
  const [w, h] = dim(p.slug);
  const count = p.ingredientCount
    ? `<span class="card__count">${p.ingredientCount} ingredients</span>` : '';
  return `
  <article class="card" style="--pc:${p.colour}" data-category="${esc(p.category)}">
    <div class="card__media">
      <picture>
        <source srcset="${o.base}assets/labels/${p.slug}.webp" type="image/webp">
        <img src="${o.base}assets/labels/${p.slug}.jpg" width="${w}" height="${h}"
             loading="lazy" decoding="async" alt="">
      </picture>
    </div>
    <div class="card__body">
      <span class="kicker card__cat">${esc(p.category)}</span>
      <p class="card__tamil tamil">${esc(p.nameTamil)}</p>
      <h3><a href="${o.base}product/${p.slug}.html">${esc(p.name)}</a></h3>
      ${count}
      <p class="card__price">${esc(priceLabel(p, D.weights[0]))}<span> · ${D.weights[0]}g</span></p>
      <span class="card__more">View product ${icon('chevron-right')}</span>
    </div>
  </article>`;
}

function buyBox(p) {
  const weights = D.weights.map((g, i) => `
        <button type="button" class="weight" data-grams="${g}" aria-pressed="${i === 0}">
          <b>${g} g</b>
          <span>${esc(priceLabel(p, g))}</span>
        </button>`).join('');

  return `
  <div class="buy" data-buy data-slug="${esc(p.slug)}" data-name="${esc(p.name)}">
    <span class="kicker">Choose a size</span>
    <div class="weights" role="group" aria-label="Pack size for ${esc(p.name)}">${weights}
    </div>
    <div class="buy__actions">
      <button type="button" class="btn btn--product" data-add-to-cart>
        ${icon('plus')} Add to order
      </button>
      <a class="btn btn--ghost" data-buy-now href="${wa(
          "Hello Adisil! I'd like to know more about:\n" + p.name + " — " + D.weights[0] + "g")}">
        ${icon('brand-whatsapp')} Ask about this one
      </a>
    </div>
    <p class="buy__note" data-buy-note hidden></p>
    ${p.perfectFor ? `<p class="buy__note">Good for: ${esc(p.perfectFor.join(' · '))}</p>` : ''}
  </div>`;
}

function reviewsFor(slug) {
  return reviews
    .filter(t => (slug ? t.product === slug : true))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function testimonialSection(list, o, opts) {
  if (!list.length) return '';           // empty list -> section does not exist
  opts = opts || {};
  const cards = list.map(t => {
    const who = [esc(t.name), t.place ? esc(t.place) : ''].filter(Boolean).join(' · ');
    const prod = t.product && products.find(p => p.slug === t.product);
    return `
      <figure class="quote"${prod ? ` style="--pc:${prod.colour}"` : ''} data-reveal>
        ${stars(t.rating)}
        <blockquote>${esc(t.text)}</blockquote>
        <figcaption>
          ${who}
          ${prod && !opts.hideProduct ? `<span class="quote__prod">on ${esc(prod.name)}</span>` : ''}
        </figcaption>
      </figure>`;
  }).join('');

  return `
  <section class="reviews" id="reviews">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">${esc(opts.kicker || 'What people say')}</p>
        <h2>${esc(opts.heading || 'From the people cooking it')}</h2>
      </header>
      <div class="quotes">${cards}
      </div>
    </div>
  </section>`;
}

/* ==========================================================================
   Pages
   ========================================================================== */

function homePage() {
  const o = { base: '', here: 'home' };
  const cards = products.map(p => productCard(p, o)).join('');

  return head({
    base: '', url: 'index.html',
    title: 'Adisil Organic Foods — Traditional Tamil health mixes, masalas & podis',
    description: 'Homemade Tamil health mixes, kanji mixes, masalas and podis. Made in small batches with nothing added to make them keep longer. FSSAI licensed. Order on WhatsApp.',
    image: 'assets/labels/health-mix.jpg',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Organization',
      name: 'Adisil Organic Foods', description: 'Traditional Tamil homemade health mixes, kanji mixes, masalas and podis.',
      sameAs: [B.instagram, B.facebook],
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+' + B.whatsapp }
    }
  }) + nav(o) + `
<main id="main">

  <section class="hero">
    <div class="wrap">
      <div class="hero__frame">
        <p class="hero__kicker kicker">${icon('wheat')} Traditional • Nutritious</p>
        <h1 data-reveal>Everything in the packet <em>is printed on the packet.</em></h1>
        <p class="hero__sub" data-reveal>
          Adisil is two people making traditional Tamil health mixes, kanji mixes,
          masalas and podis the way they were made at home — roasted and ground in
          small batches, with nothing added to make them keep longer.
        </p>
        <div class="hero__cta" data-reveal>
          <a class="btn btn--wa" href="${WA_GENERAL}">${icon('brand-whatsapp')} Order on WhatsApp</a>
          <a class="btn btn--ghost" href="products.html">See what we make ${icon('arrow-right')}</a>
        </div>
        <figure class="hero__art" data-reveal>
          <picture>
            <source srcset="assets/art/hero-family.webp" type="image/webp">
            <img src="assets/art/hero-family.jpg" width="1400" height="500"
                 alt="Illustration of a mother feeding her son a bowl of health mix at a wooden table, with palm trees and a thatched village house behind them.">
          </picture>
        </figure>
        <p class="hero__caption">From the Adisil Health Mix label</p>
      </div>
    </div>
  </section>

  <section class="stakes" id="why">
    <div class="wrap stakes__grid">
      <div>
        <p class="kicker">Why the shelf life is short</p>
        <h2 data-reveal>A three-month shelf life is <em>the point</em>.</h2>
        <p class="stakes__lede" data-reveal>
          Our mixes keep for three months from the day you open the packet. That is
          not a corner we cut — it is what happens when nothing goes in to make food
          keep longer. The list printed on the back of the pack is the entire recipe,
          and there is nothing on it you would not have in your own kitchen.
        </p>
      </div>
      <ul class="facts">
        <li class="fact" data-reveal><span class="fact__num">20</span>
          <span class="fact__body"><b>Ingredients in the Health Mix</b>
          <span>Every one of them named on the pack — ragi, kambu, kollu, javarisi, and sixteen more.</span></span></li>
        <li class="fact" data-reveal><span class="fact__num">03</span>
          <span class="fact__body"><b>Months, once the packet is opened</b>
          <span>Short on purpose. Store it cool and dry, and keep the pack closed after every use.</span></span></li>
        <li class="fact" data-reveal><span class="fact__num">00</span>
          <span class="fact__body"><b>Preservatives, colours or fillers</b>
          <span>Nothing is added to bulk the mix out, hold the colour, or stretch the date.</span></span></li>
      </ul>
    </div>
  </section>

  <section class="catalogue" id="catalogue">
    <div class="wrap">
      <header class="section-head section-head--row">
        <div>
          <p class="kicker">What we make</p>
          <h2>${products.length} mixes, and the whole list for each one.</h2>
          <p>Every product page shows its complete ingredient list, in the order it
          is printed on the pack. Nothing is summarised, nothing hidden behind a
          "natural blend".</p>
        </div>
        <a class="btn btn--ghost" href="products.html">All products ${icon('arrow-right')}</a>
      </header>
      <div class="cards">${cards}
      </div>
    </div>
  </section>

${testimonialSection(reviewsFor(null), o, {})}

  <section class="order" id="order">
    <div class="wrap">
      <header class="section-head">
        <p class="kicker">How to order</p>
        <h2>Three steps, one conversation.</h2>
        <p>There is no checkout. You build a list, send it on WhatsApp, and we
        confirm. For a kitchen this size, that is genuinely the fastest way.</p>
      </header>
      <ol class="steps">
        <li class="step" data-reveal><b>Add what you want</b>
          <p>Pick the mixes and sizes. They collect in one list — you do not have to
          message us separately for each one.</p></li>
        <li class="step" data-reveal><b>Send the list on WhatsApp</b>
          <p>One tap opens WhatsApp with everything written out. Edit it if you want
          to change something.</p></li>
        <li class="step" data-reveal><b>We confirm and send</b>
          <p>We reply with the price, the packing and how long delivery takes to your
          area.</p></li>
      </ol>
    </div>
  </section>

  <section class="proof">
    <div class="wrap proof__grid">
      <div class="proof__lead">
        <p class="kicker">Why you can trust a kitchen this small</p>
        <h2 data-reveal>Small kitchen. Real licence.</h2>
        <p class="proof__lede" data-reveal>
          Every ingredient is shown and named on the pack — not grouped into a
          "blend", not abbreviated. This is the row printed on the Karupu Ulundhu
          Kanji packet.
        </p>
        <figure class="proof__strip" data-reveal>
          <picture>
            <source srcset="assets/art/ingredients-seven.webp" type="image/webp">
            <img src="assets/art/ingredients-seven.jpg" width="1200" height="216" loading="lazy" decoding="async"
                 alt="The seven ingredients printed on the Karupu Ulundhu Kanji Mix pack, each photographed in a bowl and labelled: black urad dal, raw rice, dry ginger, cardamom, black kavuni rice, cashew and almond.">
          </picture>
        </figure>
      </div>
      <ul class="creds">
        <li class="cred" data-reveal>${icon('certificate')}
          <span><b>FSSAI licensed</b><span>Licence no. <code>${esc(B.fssai)}</code> — a registered
          food business. You can look the number up on the FSSAI register.</span></span></li>
        <li class="cred" data-reveal>${icon('ban')}
          <span><b>Nothing added</b><span>No preservatives, no added colour, no artificial flavour.
          Every ingredient is named on the pack and on this site.</span></span></li>
        <li class="cred" data-reveal>${icon('chef-hat')}
          <span><b>Made in small batches</b><span>By two people, to traditional Tamil recipes —
          roasted and ground in quantities we can actually watch over.</span></span></li>
        <li class="cred" data-reveal>${icon('clock')}
          <span><b>Best before three months</b><span>From the date the packet is opened. Store cool
          and dry, and keep the pack tightly closed.</span></span></li>
      </ul>
    </div>
  </section>

  <section class="close">
    <div class="wrap">
      <h2 data-reveal>Tell us what you'd like.</h2>
      <p data-reveal>Build your list, send it on WhatsApp, and we will confirm the
      price and the packing.</p>
      <a class="btn btn--wa" href="${WA_GENERAL}" data-reveal>${icon('brand-whatsapp')} Start a message on WhatsApp</a>
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
        <article class="more__card" style="--cc:${g.colour}" data-reveal>
          ${icon(g.icon)}
          <h3>${esc(g.category)}</h3>
          <ul>${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        </article>`).join('')}
      </div>
    </div>
  </section>` : '';

  return head({
    base: '', url: 'products.html',
    title: 'All products — Adisil Organic Foods',
    description: `Every Adisil mix, with its complete ingredient list: ${products.map(p => p.name).join(', ')}. Made in small batches, no preservatives. Order on WhatsApp.`,
    image: 'assets/labels/health-mix.jpg'
  }) + nav(o) + `
<main id="main">
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="index.html">Home</a> ${icon('chevron-right')} <span aria-current="page">All products</span>
      </nav>
      <h1>Everything we make</h1>
      <p class="page-head__lede">
        ${products.length} products, each with its full ingredient list printed on
        this site exactly as it appears on the pack. Every one comes in
        ${D.weights.join('g, ')}g.
      </p>
      <div class="chips" role="group" aria-label="Filter by category">
        ${chips}
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
</main>
` + chrome(o) + footer(o);
}

function productPage(p, i) {
  const o = { base: '../', here: 'products' };
  const [w, h] = dim(p.slug);

  const ings = p.ingredients.map((n, k) =>
    `<li><i>${pad(k + 1)}</i><span>${esc(n)}</span></li>`).join('\n          ');

  const bens = (p.benefits || []).map(b =>
    `<li class="benefit">${icon(b[0])}<span>${esc(b[1])}</span></li>`).join('\n          ');

  const prep = (p.prepare || []).map(s => `<li><span>${esc(s)}</span></li>`).join('\n          ');

  const mine = reviewsFor(p.slug);
  const rated = mine.filter(t => typeof t.rating === 'number');

  /* Product schema. aggregateRating and review are included ONLY when real
     reviews exist — never fabricated to fill the shape. */
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, description: p.blurb,
    image: (SITE ? SITE + '/' : '') + `assets/labels/${p.slug}.jpg`,
    brand: { '@type': 'Brand', name: 'Adisil Organic Foods' },
    category: p.category
  };
  if (rated.length) {
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

  return head({
    base: '../', url: `product/${p.slug}.html`,
    title: `${p.name} — Adisil Organic Foods`,
    ogTitle: `${p.name} · Adisil Organic Foods`,
    description: `${p.blurb} ${p.ingredientCount ? p.ingredientCount + ' named ingredients. ' : ''}Available in ${D.weights.join('g, ')}g. No preservatives. Order on WhatsApp.`.trim(),
    image: `assets/labels/${p.slug}.jpg`,
    ogType: 'product', pageColour: p.colour, jsonld
  }) + nav(o) + `
<main id="main">
  <article class="detail">
    <div class="wrap detail__grid">

      <figure class="detail__plate">
        <picture>
          <source srcset="../assets/labels/${p.slug}.webp" type="image/webp">
          <img src="../assets/labels/${p.slug}.jpg" width="${w}" height="${h}" fetchpriority="high"
               alt="The printed label for Adisil ${esc(p.name)}, showing the full ingredient list and preparation instructions.">
        </picture>
      </figure>

      <div class="detail__body">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="../index.html">Home</a> ${icon('chevron-right')}
          <a href="../products.html">Products</a> ${icon('chevron-right')}
          <span aria-current="page">${esc(p.name)}</span>
        </nav>

        <p class="detail__index"><span class="kicker">${esc(p.category)}</span></p>
        <p class="detail__tamil tamil">${esc(p.nameTamil)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="detail__tagline">${esc(p.tagline)}</p>
        <p class="detail__blurb">${esc(p.blurb)}</p>

${buyBox(p)}

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

        ${bens ? `<ul class="benefits" data-reveal-group>
          ${bens}
        </ul>` : ''}

        ${prep ? `<div class="prepare">
          <span class="kicker">How to prepare</span>
          <ol>
          ${prep}
          </ol>
        </div>` : ''}

        <dl class="spec">
          <div><dt>Net weights</dt><dd>${D.weights.join('g · ')}g</dd></div>
          <div><dt>Best before</dt><dd>${esc(B.shelfLife)}</dd></div>
          <div><dt>Storage</dt><dd>Cool, dry place. Use a clean, dry spoon and keep the pack tightly closed.</dd></div>
          <div><dt>FSSAI licence</dt><dd><code>${esc(B.fssai)}</code></dd></div>
        </dl>
      </div>
    </div>
  </article>

${testimonialSection(mine, o, { kicker: 'What people say', heading: `On ${p.name}`, hideProduct: true })}

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
products.forEach((p, i) => write(`product/${p.slug}.html`, productPage(p, i)));

console.log(`\n${products.length} products · ${reviews.length} testimonial(s)` +
            (reviews.length ? '' : ' — testimonial sections are hidden until you add some'));
if (!SITE) {
  console.log('\nTip: set business.siteUrl in products.js once you have a domain, and');
  console.log('     re-run this. It adds canonical + absolute social-preview URLs.');
}
console.log('\nDone.\n');
