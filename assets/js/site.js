/* ==========================================================================
   ADISIL — shared runtime for every page

   Page content is static HTML written by build.js. This file only adds
   behaviour: the order list, quick-add steppers, the sticky order bar, the
   floating WhatsApp button, category filters, the sample-review marquee, and
   scroll animation.

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

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
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

  function indexOf(slug, grams) {
    grams = Number(grams);
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug && Number(cart[i].grams) === grams) return i;
    }
    return -1;
  }

  function qtyOf(slug, grams) {
    var i = indexOf(slug, grams);
    return i === -1 ? 0 : (cart[i].qty || 1);
  }

  function setQtyFor(slug, grams, qty, name) {
    grams = Number(grams);
    qty = Math.max(0, Math.min(99, qty));
    var i = indexOf(slug, grams);
    if (i === -1) {
      if (qty > 0) cart.push({ slug: slug, grams: grams, name: name, qty: qty });
    } else if (qty === 0) {
      cart.splice(i, 1);
    } else {
      cart[i].qty = qty;
    }
    save(cart);
    render();
  }

  function totalItems() {
    return cart.reduce(function (n, it) { return n + (it.qty || 1); }, 0);
  }

  /* One message for the whole list — the reason the order list exists.
     English product names only: Tamil text roughly quadruples the encoded URL
     length and WhatsApp truncates long ones in its own UI. */
  function orderMessage() {
    if (!cart.length) return "Hello Adisil! I saw your website and I'd like to order.";

    var lines = ["*Hello Adisil! I'd like to order:*", ""];
    var allPriced = true, total = 0, packets = 0;

    cart.forEach(function (it) {
      var p = findProduct(it.slug);
      var unit = p ? priceOf(p, it.grams) : null;
      var qty = it.qty || 1;
      packets += qty;
      var line = "- " + (p ? p.name : it.name) + " " + it.grams + "g x" + qty;
      if (unit === null) allPriced = false;
      else { total += unit * qty; line += "  (Rs " + (unit * qty) + ")"; }
      lines.push(line);
    });

    lines.push("");
    if (allPriced && total > 0) lines.push("*Total: Rs " + total + "*");
    lines.push("Could you confirm the price and delivery?");

    var msg = lines.join("\n");
    // Long lists get truncated inside WhatsApp's own UI; collapse instead.
    if (encodeURIComponent(msg).length > 900) {
      msg = "*Hello Adisil! I'd like to order " + packets + " packets across " +
            cart.length + " mixes.*\n\n" +
            cart.map(function (it) {
              var p = findProduct(it.slug);
              return "- " + (p ? p.name : it.name) + " " + it.grams + "g x" + (it.qty || 1);
            }).join("\n") +
            "\n\nCould you confirm the price and delivery?";
    }
    return msg;
  }

  /* ------------------------------------------------------- announcements */

  var liveTimer = null;
  function announce(text) {
    var el = $("[data-live]");
    if (!el) return;
    el.textContent = text;                    // textContent only — never innerHTML
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(function () { el.textContent = ""; }, 4000);
  }

  /* ---------------------------------------------------------- quick-add UI
     Each pack-size button becomes a stepper in place once that size is in the
     order, so a second size is always one tap away and nothing covers the grid. */

  function renderQuickAdds() {
    // remember where focus was so rebuilding the row doesn't lose the keyboard
    var act = document.activeElement;
    var focusKey = null;
    if (act && act.closest) {
      var box = act.closest("[data-buy]");
      if (box && box.querySelector(".quickadd__row")) {
        focusKey = {
          slug: box.getAttribute("data-slug"),
          grams: act.getAttribute("data-grams") || (act.closest("[data-grams]") || {}).getAttribute
                 ? (act.closest("[data-grams]") || act).getAttribute("data-grams") : null,
          role: act.getAttribute("data-qa-inc") ? "inc"
              : act.getAttribute("data-qa-dec") ? "dec"
              : act.getAttribute("data-qa-add") ? "add" : null
        };
      }
    }

    $$(".quickadd").forEach(function (box) {
      var slug = box.getAttribute("data-slug");
      var name = box.getAttribute("data-name");
      var row = $(".quickadd__row", box);
      if (!row) return;

      row.innerHTML = D.weights.map(function (g) {
        var q = qtyOf(slug, g);
        if (!q) {
          return '<button type="button" class="qa" data-qa-add data-grams="' + g +
                 '" aria-label="Add ' + esc(name) + ', ' + g + ' grams">' +
                 g + "<span>g</span></button>";
        }
        return '<span class="qa-step" data-grams="' + g + '">' +
                 '<button type="button" data-qa-dec data-grams="' + g +
                   '" aria-label="' + (q === 1 ? "Remove " : "One less ") + esc(name) + " " + g + ' grams">' +
                   '<svg class="icon" aria-hidden="true"><use href="#i-' + (q === 1 ? "trash" : "minus") + '"></use></svg>' +
                 "</button>" +
                 '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" ' +
                   'class="qa-step__n" value="' + q + '" data-qa-qty data-grams="' + g +
                   '" aria-label="' + esc(name) + " " + g + ' grams, quantity">' +
                 '<button type="button" data-qa-inc data-grams="' + g +
                   '" aria-label="One more ' + esc(name) + " " + g + ' grams"' +
                   (q >= 99 ? " disabled" : "") + '>' +
                   '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg>' +
                 "</button>" +
                 '<b class="qa-step__g">' + g + "g</b>" +
               "</span>";
      }).join("");
    });

    // card-level "already in your order" state
    $$("[data-card]").forEach(function (card) {
      var slug = card.getAttribute("data-card");
      var n = cart.reduce(function (t, it) {
        return t + (it.slug === slug ? (it.qty || 1) : 0);
      }, 0);
      var state = $("[data-card-state]", card);
      if (n > 0) {
        card.setAttribute("data-in-order", "");
        if (state) { state.textContent = "In your order · " + n + (n === 1 ? " packet" : " packets"); state.hidden = false; }
      } else {
        card.removeAttribute("data-in-order");
        if (state) { state.textContent = ""; state.hidden = true; }
      }
    });

    if (focusKey && focusKey.slug) {
      var sel = '.quickadd[data-slug="' + focusKey.slug + '"] ';
      var target = focusKey.grams
        ? $(sel + '[data-grams="' + focusKey.grams + '"][data-qa-' + (focusKey.role || "add") + "]")
        : null;
      if (!target && focusKey.grams) target = $(sel + '[data-grams="' + focusKey.grams + '"]');
      if (target && target.focus) target.focus();
    }
  }

  /* ------------------------------------------------------------- rendering */

  function render() {
    var n = totalItems();

    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
    });

    renderQuickAdds();

    // sticky order bar
    var bar = $("[data-order-bar]");
    if (bar) {
      bar.hidden = n === 0;
      document.body.classList.toggle("has-orderbar", n > 0);
      var t = $("[data-order-bar-text]", bar);
      if (t) t.textContent = n + (n === 1 ? " packet" : " packets");
    }

    var list  = $("[data-cart-list]");
    var empty = $("[data-cart-empty]");
    var foot  = $("[data-cart-foot]");

    if (list) {
      if (empty) empty.hidden = n > 0;
      if (foot)  foot.hidden  = n === 0;

      list.innerHTML = cart.map(function (it, i) {
        var p = findProduct(it.slug);
        var unit = p ? priceOf(p, it.grams) : null;
        var name = p ? p.name : it.name;
        var href = (window.ADISIL_BASE || "") + "product/" +
                   encodeURIComponent(String(it.slug)) + ".html";
        return '' +
          '<li class="cart-item"' + (p ? ' style="--pc:' + p.colour + '"' : "") + ">" +
            '<div class="cart-item__main">' +
              '<a class="cart-item__name" href="' + href + '">' + esc(name) + "</a>" +
              '<span class="cart-item__size">' + it.grams + " g" +
                (unit === null ? " · price on WhatsApp" : " · ₹" + unit + " each") + "</span>" +
            "</div>" +
            '<div class="qty" role="group" aria-label="Quantity for ' + esc(name) + " " + it.grams + 'g">' +
              '<button type="button" data-qty="' + i + '" data-delta="-1" aria-label="One less">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
              "<output>" + (it.qty || 1) + "</output>" +
              '<button type="button" data-qty="' + i + '" data-delta="1" aria-label="One more">' +
                '<svg class="icon" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
            "</div>" +
            '<button type="button" class="cart-item__del" data-remove="' + i +
              '" aria-label="Remove ' + esc(name) + '">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
          "</li>";
      }).join("");
    }

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

    var msg = orderMessage();
    $$("[data-cart-send]").forEach(function (a) { a.href = waLink(msg); });
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
      requestAnimationFrame(function () {
        drawer.setAttribute("data-open", "true");
        var c = $(".drawer__close", drawer);
        if (c) c.focus();
      });
    });
  }

  function closeCart() {
    if (!drawer) return;
    drawer.removeAttribute("data-open");
    document.body.style.overflow = "";
    window.setTimeout(function () { drawer.hidden = true; }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* --------------------------------------------------------------- events */

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    if (t.closest("[data-cart-open]"))  { e.preventDefault(); openCart(); return; }
    if (t.closest("[data-cart-close]")) { e.preventDefault(); closeCart(); return; }

    /* --- quick-add: add, increment, decrement. NOTE: adding deliberately does
       NOT open the drawer. Opening it on every add was the reason adding
       several products meant a close-tap between each one. --- */
    var add = t.closest("[data-qa-add]");
    if (add) {
      var boxA = add.closest("[data-buy]");
      var g = add.getAttribute("data-grams");
      setQtyFor(boxA.getAttribute("data-slug"), g, 1, boxA.getAttribute("data-name"));
      announce(boxA.getAttribute("data-name") + " " + g + "g added. " +
               totalItems() + " packets in your order.");
      return;
    }
    var inc = t.closest("[data-qa-inc]");
    if (inc) {
      var boxI = inc.closest("[data-buy]");
      var gi = inc.getAttribute("data-grams"), si = boxI.getAttribute("data-slug");
      setQtyFor(si, gi, qtyOf(si, gi) + 1, boxI.getAttribute("data-name"));
      announce(boxI.getAttribute("data-name") + " " + gi + "g, " + qtyOf(si, gi) + " packets.");
      return;
    }
    var dec = t.closest("[data-qa-dec]");
    if (dec) {
      var boxD = dec.closest("[data-buy]");
      var gd = dec.getAttribute("data-grams"), sd = boxD.getAttribute("data-slug");
      var next = qtyOf(sd, gd) - 1;
      setQtyFor(sd, gd, next, boxD.getAttribute("data-name"));
      announce(next === 0
        ? boxD.getAttribute("data-name") + " " + gd + "g removed."
        : boxD.getAttribute("data-name") + " " + gd + "g, " + next + " packets.");
      return;
    }

    // drawer quantity + remove
    var q = t.closest("[data-qty]");
    if (q) {
      var qi = Number(q.getAttribute("data-qty"));
      var item = cart[qi];
      if (item) setQtyFor(item.slug, item.grams, (item.qty || 1) + Number(q.getAttribute("data-delta")), item.name);
      return;
    }
    var rm = t.closest("[data-remove]");
    if (rm) {
      var ri = Number(rm.getAttribute("data-remove"));
      var it2 = cart[ri];
      if (it2) { setQtyFor(it2.slug, it2.grams, 0, it2.name); announce("Removed from your order."); }
      return;
    }

    // product-page size buttons
    var wbtn = t.closest(".weight");
    if (wbtn) {
      var boxW = wbtn.closest("[data-buy]");
      $$(".weight", boxW).forEach(function (b) { b.setAttribute("aria-pressed", String(b === wbtn)); });
      syncBuy(boxW);
      return;
    }
    var addBtn = t.closest("[data-add-to-cart]");
    if (addBtn) {
      var b2 = addBtn.closest("[data-buy]");
      var sel = $('.weight[aria-pressed="true"]', b2) || $(".weight", b2);
      var gsel = sel.getAttribute("data-grams"), slug2 = b2.getAttribute("data-slug");
      setQtyFor(slug2, gsel, qtyOf(slug2, gsel) + 1, b2.getAttribute("data-name"));
      var note = $("[data-buy-note]", b2);
      if (note) {
        note.textContent = "Added — " + gsel + "g. It's in your order list at the bottom.";
        note.hidden = false;
      }
      announce(b2.getAttribute("data-name") + " " + gsel + "g added. " +
               totalItems() + " packets in your order.");
      return;
    }

    // "add all five" presets
    var preset = t.closest("[data-preset]");
    if (preset) {
      var pg = preset.getAttribute("data-preset");
      D.products.filter(function (p) { return !p.hidden; }).forEach(function (p) {
        setQtyFor(p.slug, pg, qtyOf(p.slug, pg) + 1, p.name);
      });
      announce("Added all products at " + pg + " grams. " + totalItems() + " packets in your order.");
      return;
    }
  });

  // typed quantity in a stepper
  document.addEventListener("change", function (e) {
    var inp = e.target.closest ? e.target.closest("[data-qa-qty]") : null;
    if (!inp) return;
    var box = inp.closest("[data-buy]");
    var n = parseInt(String(inp.value).replace(/\D/g, ""), 10);
    if (isNaN(n)) n = 0;
    setQtyFor(box.getAttribute("data-slug"), inp.getAttribute("data-grams"), n,
              box.getAttribute("data-name"));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && !drawer.hidden) closeCart();
    if (e.key === "Tab" && drawer && !drawer.hidden) {
      var f = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', drawer)
                .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function syncBuy(box) {
    if (!box) return;
    var p = findProduct(box.getAttribute("data-slug"));
    var sel = $('.weight[aria-pressed="true"]', box) || $(".weight", box);
    if (!sel) return;
    var g = sel.getAttribute("data-grams");
    var link = $("[data-buy-now]", box);
    if (link) {
      link.href = waLink("Hello Adisil! I'd like to know more about:\n" +
        (p ? p.name : box.getAttribute("data-name")) + " — " + g + "g");
    }
  }
  $$("[data-buy] .weight").length && $$("[data-buy]").forEach(syncBuy);

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
        toggle.setAttribute("aria-label", now ? "Collapse the WhatsApp button" : "Expand the WhatsApp button");
        try { window.localStorage.setItem(DKEY, now ? "0" : "1"); } catch (e) {}
      });
    }
  }

  /* --------------------------------------------- sample-review marquee
     WCAG 2.2.2: auto-starting motion over 5s needs a real pause control.
     Hover/focus pausing alone does not satisfy it. */

  var marquee = $("[data-marquee]");
  var mToggle = $("[data-marquee-toggle]");
  if (marquee && mToggle) {
    mToggle.addEventListener("click", function () {
      var paused = marquee.classList.toggle("is-paused");
      mToggle.setAttribute("aria-pressed", String(paused));
      var label = $("[data-marquee-label]", mToggle);
      if (label) label.textContent = paused ? "Play" : "Pause";
    });
  }

  /* ------------------------------------------------- category filtering */

  var chips = $$(".chip[data-filter]");
  if (chips.length) {
    var applyFilter = function (want, push) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === want));
      });
      var shown = 0;
      $$("[data-grid] .card").forEach(function (card) {
        var ok = want === "All" || card.getAttribute("data-category") === want;
        card.hidden = !ok;
        if (ok) shown++;
      });
      var none = $("[data-none]");
      if (none) none.hidden = shown > 0;
      if (push) {
        var hash = want === "All" ? " " : "#" + want.toLowerCase().replace(/\s+/g, "-");
        try { history.replaceState(null, "", want === "All" ? location.pathname : hash); } catch (e) {}
      }
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { applyFilter(chip.getAttribute("data-filter"), true); });
    });
    // a shared link like products.html#kanji-mix lands on that filter
    if (location.hash) {
      var want = decodeURIComponent(location.hash.slice(1)).replace(/-/g, " ");
      var match = chips.filter(function (c) {
        return c.getAttribute("data-filter").toLowerCase() === want.toLowerCase();
      })[0];
      if (match) applyFilter(match.getAttribute("data-filter"), false);
    }
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

      // hero plates settle onto the table
      var plates = gsap.utils.toArray(".plate");
      if (plates.length) {
        gsap.from(plates, {
          opacity: 0, y: 26, rotation: "-=1.5", duration: 0.68,
          ease: "power2.out", stagger: 0.09
        });
      }
    }
  );

  ScrollTrigger.create({
    start: "top -12",
    onToggle: function (self) {
      var n = document.getElementById("nav");
      if (n) n.setAttribute("data-stuck", String(self.isActive));
    }
  });
})();
