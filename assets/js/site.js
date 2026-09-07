/* ==========================================================================
   ADISIL — shared runtime for every page

   The page content itself is static HTML written by build.js. This file only
   adds behaviour: the order list (cart), the floating WhatsApp button, the
   size selector, category filtering, and scroll animation.

   You should not need to edit this. Product content lives in products.js.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.ADISIL;
  if (!D) return;
  var B = D.business;
  var KEY = "adisil_cart_v1";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function waLink(msg) {
    return "https://wa.me/" + B.whatsapp + "?text=" + encodeURIComponent(msg);
  }

  function priceOf(product, grams) {
    var v = product && product.prices && product.prices[grams];
    return (v === null || v === undefined || v === "") ? null : v;
  }

  function findProduct(slug) {
    for (var i = 0; i < D.products.length; i++) {
      if (D.products[i].slug === slug) return D.products[i];
    }
    return null;
  }

  /* ---------------------------------------------------------------- storage
     localStorage can throw outright (private mode, blocked site data), so
     every read and write is guarded and the page works with an empty list. */

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var val = raw ? JSON.parse(raw) : [];
      return Object.prototype.toString.call(val) === "[object Array]" ? val : [];
    } catch (e) { return []; }
  }

  function save(items) {
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }

  var cart = load();

  /* ------------------------------------------------------------------ cart */

  function addItem(slug, grams, name) {
    grams = Number(grams);
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug && Number(cart[i].grams) === grams) {
        cart[i].qty = Math.min(99, (cart[i].qty || 1) + 1);
        save(cart); render(); return;
      }
    }
    cart.push({ slug: slug, grams: grams, name: name, qty: 1 });
    save(cart); render();
  }

  function setQty(index, qty) {
    if (!cart[index]) return;
    qty = Math.max(0, Math.min(99, qty));
    if (qty === 0) cart.splice(index, 1);
    else cart[index].qty = qty;
    save(cart); render();
  }

  function totalItems() {
    return cart.reduce(function (n, it) { return n + (it.qty || 1); }, 0);
  }

  /* One message for the whole list — the reason the cart exists. */
  function orderMessage() {
    if (!cart.length) return "Hello Adisil! I saw your website and I'd like to order.";

    var lines = ["Hello Adisil! I'd like to order:", ""];
    var allPriced = true, total = 0;

    cart.forEach(function (it, i) {
      var p = findProduct(it.slug);
      var unit = p ? priceOf(p, it.grams) : null;
      var line = (i + 1) + ". " + (p ? p.name : it.name) + " — " + it.grams + "g × " + (it.qty || 1);
      if (unit === null) { allPriced = false; }
      else { total += unit * (it.qty || 1); line += "  (₹" + (unit * (it.qty || 1)) + ")"; }
      lines.push(line);
    });

    lines.push("");
    if (allPriced && total > 0) lines.push("Total: ₹" + total);
    lines.push("Could you confirm the price and delivery?");
    return lines.join("\n");
  }

  function render() {
    var n = totalItems();

    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
    });

    var list  = $("[data-cart-list]");
    var empty = $("[data-cart-empty]");
    var foot  = $("[data-cart-foot]");
    if (!list) return;

    if (empty) empty.hidden = n > 0;
    if (foot)  foot.hidden  = n === 0;

    list.innerHTML = cart.map(function (it, i) {
      var p = findProduct(it.slug);
      var unit = p ? priceOf(p, it.grams) : null;
      var name = p ? p.name : it.name;
      var href = (window.ADISIL_BASE || "") + "product/" +
                 encodeURIComponent(String(it.slug)) + ".html";
      return '' +
        '<li class="cart-item"' + (p ? ' style="--pc:' + p.colour + '"' : '') + '>' +
          '<div class="cart-item__main">' +
            '<a class="cart-item__name" href="' + href + '">' + escape_(name) + "</a>" +
            '<span class="cart-item__size">' + it.grams + " g" +
              (unit === null ? " · price on WhatsApp" : " · ₹" + unit + " each") +
            "</span>" +
          "</div>" +
          '<div class="qty" role="group" aria-label="Quantity for ' + escape_(name) + ' ' + it.grams + 'g">' +
            '<button type="button" data-qty="' + i + '" data-delta="-1" aria-label="One less">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
            '<output>' + (it.qty || 1) + "</output>" +
            '<button type="button" data-qty="' + i + '" data-delta="1" aria-label="One more">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
          "</div>" +
          '<button type="button" class="cart-item__del" data-remove="' + i + '" aria-label="Remove ' + escape_(name) + '">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        "</li>";
    }).join("");

    var totalEl = $("[data-cart-total]");
    if (totalEl) {
      var allPriced = true, total = 0;
      cart.forEach(function (it) {
        var p = findProduct(it.slug);
        var u = p ? priceOf(p, it.grams) : null;
        if (u === null) allPriced = false; else total += u * (it.qty || 1);
      });
      if (allPriced && total > 0) {
        totalEl.removeAttribute("data-nopricing");
        totalEl.innerHTML = "<span>Total</span><b>₹" + total + "</b>";
      } else {
        totalEl.setAttribute("data-nopricing", "");
        totalEl.innerHTML = "<span>" + n + (n === 1 ? " item" : " items") +
                            "</span><b>Price on WhatsApp</b>";
      }
    }

    var send = $("[data-cart-send]");
    if (send) send.href = waLink(orderMessage());
  }

  function escape_(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* -------------------------------------------------------------- drawer UI */

  var drawer = $("#cart");
  var lastFocus = null;

  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      drawer.setAttribute("data-open", "true");
      var c = $(".drawer__close", drawer);
      if (c) c.focus();
    });
  }

  function closeCart() {
    if (!drawer) return;
    drawer.removeAttribute("data-open");
    document.body.style.overflow = "";
    window.setTimeout(function () { drawer.hidden = true; }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t.closest) return;

    if (t.closest("[data-cart-open]"))  { e.preventDefault(); openCart(); return; }
    if (t.closest("[data-cart-close]")) { e.preventDefault(); closeCart(); return; }

    var q = t.closest("[data-qty]");
    if (q) {
      var i = Number(q.getAttribute("data-qty"));
      setQty(i, (cart[i] ? cart[i].qty || 1 : 0) + Number(q.getAttribute("data-delta")));
      return;
    }

    var rm = t.closest("[data-remove]");
    if (rm) { setQty(Number(rm.getAttribute("data-remove")), 0); return; }

    // size buttons
    var wbtn = t.closest(".weight");
    if (wbtn) {
      var box = wbtn.closest("[data-buy]");
      $$(".weight", box).forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === wbtn));
      });
      syncBuy(box);
      return;
    }

    var add = t.closest("[data-add-to-cart]");
    if (add) {
      var b2 = add.closest("[data-buy]");
      var sel = $('.weight[aria-pressed="true"]', b2) || $(".weight", b2);
      addItem(b2.getAttribute("data-slug"), sel.getAttribute("data-grams"), b2.getAttribute("data-name"));
      var note = $("[data-buy-note]", b2);
      if (note) {
        note.textContent = "Added — " + sel.getAttribute("data-grams") + "g. It's in your order list.";
        note.hidden = false;
      }
      openCart();
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && !drawer.hidden) closeCart();
    // keep focus inside the drawer while it is open
    if (e.key === "Tab" && drawer && !drawer.hidden) {
      var f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', drawer)
                .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Keep the "ask about this one" link in step with the chosen size. */
  function syncBuy(box) {
    if (!box) return;
    var slug = box.getAttribute("data-slug");
    var p = findProduct(slug);
    var sel = $('.weight[aria-pressed="true"]', box) || $(".weight", box);
    if (!sel) return;
    var g = sel.getAttribute("data-grams");
    var link = $("[data-buy-now]", box);
    if (link) {
      link.href = waLink("Hello Adisil! I'd like to know more about:\n" +
        (p ? p.name : box.getAttribute("data-name")) + " — " + g + "g");
    }
  }
  $$("[data-buy]").forEach(syncBuy);

  /* -------------------------------------------- floating WhatsApp button */

  var dock = $("[data-wa-dock]");
  if (dock) {
    var DKEY = "adisil_wa_collapsed";
    var collapsed = false;
    try { collapsed = window.localStorage.getItem(DKEY) === "1"; } catch (e) {}
    if (collapsed) dock.setAttribute("data-collapsed", "true");

    var toggle = $("[data-wa-toggle]", dock);
    if (toggle) {
      toggle.addEventListener("click", function () {
        var now = dock.getAttribute("data-collapsed") === "true";
        if (now) dock.removeAttribute("data-collapsed");
        else dock.setAttribute("data-collapsed", "true");
        toggle.setAttribute("aria-label", now
          ? "Collapse the WhatsApp button" : "Expand the WhatsApp button");
        try { window.localStorage.setItem(DKEY, now ? "0" : "1"); } catch (e) {}
      });
    }
  }

  /* ------------------------------------------------- category filtering */

  var chips = $$(".chip");
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var want = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        var shown = 0;
        $$("[data-grid] .card").forEach(function (card) {
          var ok = want === "All" || card.getAttribute("data-category") === want;
          card.hidden = !ok;
          if (ok) shown++;
        });
        var none = $("[data-none]");
        if (none) none.hidden = shown > 0;
      });
    });
  }

  render();

  /* ----------------------------------------------------------- motion */

  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add("gsap-failed");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add(
    { motion: "(prefers-reduced-motion: no-preference)" },
    function (ctx) {
      if (!ctx.conditions.motion) return;

      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        gsap.from(el, {
          opacity: 0, y: 22, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });

      gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
        gsap.from(group.children, {
          opacity: 0, y: 18, duration: 0.55, ease: "power2.out", stagger: 0.07,
          scrollTrigger: { trigger: group, start: "top 88%", once: true }
        });
      });

      gsap.utils.toArray(".card").forEach(function (card, i) {
        gsap.from(card, {
          opacity: 0, y: 26, duration: 0.6, ease: "power2.out", delay: (i % 3) * 0.06,
          scrollTrigger: { trigger: card, start: "top 92%", once: true }
        });
      });
    }
  );

  /* The page accent follows whichever product you are reading. Only the home
     page has several products in a row; elsewhere the colour is set on <body>
     by the generator, so this is a no-op. */
  var root = document.documentElement;
  var sections = gsap.utils.toArray("[data-colour]");
  if (sections.length) {
    var base = sections[0].getAttribute("data-colour");
    sections.forEach(function (el) {
      var colour = el.getAttribute("data-colour");
      ScrollTrigger.create({
        trigger: el, start: "top center", end: "bottom center",
        onEnter:     function () { root.style.setProperty("--pc", colour); },
        onEnterBack: function () { root.style.setProperty("--pc", colour); }
      });
    });
    ScrollTrigger.create({
      trigger: sections[0], start: "top bottom",
      onLeaveBack: function () { root.style.setProperty("--pc", base); }
    });
  }

  ScrollTrigger.create({
    start: "top -12",
    onToggle: function (self) {
      var n = document.getElementById("nav");
      if (n) n.setAttribute("data-stuck", String(self.isActive));
    }
  });
})();
