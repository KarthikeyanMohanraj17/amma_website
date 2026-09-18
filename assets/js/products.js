/* ==========================================================================
   ADISIL ORGANIC FOODS — PRODUCT DATA
   ==========================================================================

   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE THE SITE.

   To add a price:      find the product, fill in the numbers in `prices`.
   To add a product:    copy a whole { ... } block, paste it, change the values.
   To hide a product:   add     hidden: true,     anywhere inside its block.
   To reorder products: move the { ... } blocks up or down.

   Rules that matter:
   - Keep the commas and the quote marks exactly as they are.
   - `slug` must match the image filename in assets/labels/ (without .jpg).
   - `prices` uses plain numbers, no rupee sign and no quotes:  250  not  "₹250"
   - A price left as  null  shows "Price on WhatsApp" instead of a number.
     The layout is identical either way, so you can fill these in any time.

   After editing, save the file and refresh the page. That's the whole workflow.
   ========================================================================== */

window.ADISIL = {

  /* ---- Business details. Change these in one place. ------------------- */
  business: {
    name:       "Adisil Organic Foods",
    nameTamil:  "அடிசில்",
    tagline:    "Traditional • Nutritious",
    whatsapp:   "919080404565",          // country code + number, digits only
    whatsappDisplay: "+91 90804 04565",
    // Once you have a domain, put it here (e.g. "https://adisilorganicfoods.com")
    // and re-run `node build.js`. It makes WhatsApp/Facebook link previews and
    // Google listings use full URLs. Leave empty until then.
    siteUrl:    "",
    fssai:      "22426525000345",
    instagram:  "https://www.instagram.com/adisilorganicfoods/",
    facebook:   "https://www.facebook.com/profile.php?id=61593239707349",
    shelfLife:  "3 months from the date the packet is opened"
  },

  /* ---- The weights every product is sold in. -------------------------- */
  weights: [100, 250, 500],

  /* ---- Products with label artwork. ----------------------------------- */
  products: [

    {
      slug: "health-mix",
      name: "Health Mix",
      nameTamil: "ஹெல்த் மிக்ஸ்",
      category: "Health Mix",
      colour: "#3E0100",                  // from this product's own label rail
      kicker: "Traditional Nutri Blend",
      tagline: "Wholesome nutrition for a stronger you",
      ingredientCount: 20,
      // Price for 100g, 250g, 500g. Fill these in when ready.
      // Declared from this product's own printed ingredient list.
      allergens: ["Peanuts", "Almonds", "Pistachios", "Cashews"],
      veg: true,
      prices: { 100: null, 250: null, 500: null },
      blurb:
        "The everyday mix. Twenty grains, pulses, nuts and spices, roasted and " +
        "stone-ground in small batches — the same blend a Tamil grandmother would " +
        "put together, without the shortcuts a factory needs to take.",
      ingredients: [
        "Ragi", "Pearl Millet (Kambu)", "Maize (Makka Solam)", "Barley",
        "Black Rice (Karupu Koinu Arisi)", "Red Rice (Segapu Arisi)",
        "Black Chickpeas (Karupu Kondai Kadalai)", "Black Rajma",
        "Horse Gram (Kollu)", "Roasted Bengal Gram (Pottu Kadalai)",
        "Peanuts (Ver Kadalai)", "Green Gram (Paadi Payiru)",
        "Black Urad Dal (Karupu Ulundhu)", "Almonds", "Pistachios", "Cashews",
        "Sago (Javarisi)", "Dry Ginger (Sukku)", "Cardamom (Elaka)",
        "Nutmeg (Jathika)"
      ],
      benefits: [
        ["leaf",        "Rich in protein, fibre, calcium & iron"],
        ["shield-check","Supports bone health, immunity & digestion"],
        ["ban",         "100% natural — no added preservatives"],
        ["users-group", "Suitable for all ages"]
      ],
      prepare: [
        "Mix 2 tbsp (30g) of powder into 100ml water, without lumps.",
        "Cook 5–7 minutes on a low flame.",
        "Add milk if you like it richer.",
        "Sweeten with palm jaggery or country sugar. Serve hot."
      ]
    },

    {
      slug: "dosai-mix",
      name: "Multi Millet Dosai Mix",
      nameTamil: "மல்டி மில்லெட் தோசை மாவு",
      category: "Dosai Mix",
      colour: "#340000",
      kicker: "Traditional Nutri Blend",
      tagline: "Wholesome millet nutrition for a healthier you",
      // NOTE: the printed label header says "12 Natural Ingredients" but lists 13
      // items below it — see README. Left as null so the site doesn't repeat the
      // discrepancy. Set it to a number once the label is corrected.
      ingredientCount: null,
      allergens: [],
      veg: true,
      prices: { 100: null, 250: null, 500: null },
      blurb:
        "Six millets, three dals and idli rice, ground to a dosai batter powder. " +
        "Ten minutes of resting and you have breakfast — no overnight soaking, " +
        "no grinding, no fermenting.",
      ingredients: [
        "Pearl Millet (Kambu)", "Finger Millet (Ragi)", "Sorghum (Solam)",
        "Green Gram (Pachai Payiru)", "Bengal Gram Dal (Kadalaiparuppu)",
        "Split Bengal Gram (Kadalai Paruppu)", "Little Millet (Thinai)",
        "Barnyard Millet (Samai)", "Kodo Millet (Varagu)",
        "Foxtail Millet (Kuthiraivali)", "Idli Rice",
        "Urad Dal (Uluthamparuppu)", "Fenugreek (Vendhayam)"
      ],
      benefits: [
        ["leaf",        "Rich in protein, fibre, calcium & iron"],
        ["ban",         "100% natural — no preservatives"],
        ["clock",       "Easy to digest, good for everyday meals"],
        ["users-group", "Suitable for all ages"]
      ],
      prepare: [
        "Mix 2 tbsp (30g) with water to a dosai batter consistency.",
        "Let it rest 10 minutes.",
        "Heat a tawa, pour the batter and spread.",
        "Cook until golden brown. Serve hot with chutney or sambar."
      ]
    },

    {
      slug: "karuppu-kavuni-kanji",
      name: "Karuppu Kavuni Kanji Mix",
      nameTamil: "கருப்பு கவுனி கஞ்சி",
      category: "Kanji Mix",
      colour: "#063314",
      kicker: "Traditional Goodness • Nutritious Living",
      tagline: "Rooted in tradition, made for today",
      ingredientCount: 2,
      allergens: [],
      veg: true,
      prices: { 100: null, 250: null, 500: null },
      blurb:
        "Two ingredients. Black kavuni rice — the rice Chettinad families kept " +
        "for people who needed strength — and green gram. Nothing else goes in, " +
        "which is why the list is this short.",
      ingredients: [
        "Karuppu Kavuni Arisi (Black Kavuni Rice)",
        "Paasi Paruppu (Green Gram)"
      ],
      benefits: [
        ["leaf",        "Rich in antioxidants — helps protect cells"],
        ["plant-2",     "High in fibre — keeps you full longer"],
        ["shield-check","Iron & natural minerals for healthy blood"],
        ["clock",       "Cooling and easy on the stomach"]
      ],
      prepare: [
        "Add water, cook, and enjoy.",
        "Mix 2 tbsp (30g) into 150ml water without lumps.",
        "Cook 5–7 minutes on a medium flame.",
        "Sweeten with palm jaggery or add milk to taste."
      ]
    },

    {
      slug: "karupu-ulundhu-kanji",
      name: "Karupu Ulundhu Kanji Mix",
      nameTamil: "கருப்பு உளுந்து கஞ்சி",
      category: "Kanji Mix",
      colour: "#450D31",
      kicker: "Traditional Nutritious Blend",
      tagline: "Wholesome ingredients for a stronger you",
      ingredientCount: 7,
      allergens: ["Cashew", "Almond"],
      veg: true,
      // Circular ingredient photos cut from this product's own label.
      // A product may only list these if it has one per ingredient.
      ingredientIcons: ["black-urad-dal","raw-rice","dry-ginger","cardamom",
                        "black-kavuni-rice","cashew","almond"],
      prices: { 100: null, 250: null, 500: null },
      blurb:
        "Black urad dal kanji is what Tamil homes give girls and women for bone " +
        "strength, and everyone else for iron. Cashew and almond go in for body, " +
        "dry ginger and cardamom so it sits well.",
      ingredients: [
        "Black Urad Dal", "Raw Rice", "Dry Ginger", "Cardamom",
        "Black Kavuni Rice", "Cashew", "Almond"
      ],
      benefits: [
        ["shield-check","Rich in iron — helps improve haemoglobin"],
        ["leaf",        "Improves digestion, natural & gut friendly"],
        ["flame",       "Boosts energy, keeps you active all day"],
        ["users-group", "Good for kids, adults and elders"]
      ],
      prepare: [
        "Mix 2 tablespoons (30g) into 150ml water.",
        "Stir well, without lumps.",
        "Cook 5–7 minutes on a medium flame.",
        "Add palm jaggery, honey or milk as you like.",
        "Serve hot."
      ],
      perfectFor: ["Breakfast", "Evening drink", "Post workout", "Healthy lifestyle"]
    },

    {
      slug: "mappillai-samba-kanji",
      name: "Mappillai Samba Kanji Mix",
      nameTamil: "மாப்பிள்ளை சம்பா கஞ்சி",
      category: "Kanji Mix",
      colour: "#002D68",
      kicker: "Traditional Taste • Wholesome Nutrition",
      tagline: "A nutritious start for a healthy life",
      ingredientCount: 5,
      allergens: [],
      veg: true,
      prices: { 100: null, 250: null, 500: null },
      blurb:
        "Mappillai samba is the red rice a bridegroom was fed to build strength — " +
        "that is literally what the name means. Five ingredients, cumin included, " +
        "and nothing that needs explaining.",
      ingredients: [
        "Mappillai Samba Rice", "Black Urad Dal", "Green Moong Dal",
        "Raw Rice", "Cumin Seeds"
      ],
      benefits: [
        ["shield-check","Strengthens immunity"],
        ["leaf",        "Rich in calcium & iron for strong bones"],
        ["clock",       "Aids digestion — light on the stomach"],
        ["flame",       "Boosts energy & stamina"]
      ],
      prepare: [
        "Add water, cook, and enjoy.",
        "Mix 2 tbsp (30g) into 150ml water without lumps.",
        "Cook 5–7 minutes on a medium flame.",
        "Sweeten with palm jaggery, or add milk."
      ]
    }

  ],

  /* ---- Products that exist but have no label artwork yet. -------------
     These render as text-only cards in the brand colour for their category,
     styled so they don't look broken beside the photographed products.

     Add yours here. Copy a line, change the words. Delete the examples that
     don't apply. If you leave this list empty, the whole section disappears
     from the site automatically.
     ------------------------------------------------------------------- */
  comingSoon: {
    heading: "Also from our kitchen",
    note: "Made in the same small batches. Photographs on the way — " +
          "message us on WhatsApp and we'll send you what's ready this week.",
    groups: [
      {
        category: "Homemade Masalas",
        colour: "#3E0100",
        icon: "flame",
        items: [ /* e.g. "Sambar Podi", "Rasam Podi", "Garam Masala" */ ]
      },
      {
        category: "Podi Varieties",
        colour: "#450D31",
        icon: "chef-hat",
        items: [ /* e.g. "Idly Podi", "Puliyodharai Podi", "Curry Leaf Podi" */ ]
      },
      {
        category: "Gravies & Thokku",
        colour: "#063314",
        icon: "leaf",
        items: [ /* e.g. "Tomato Thokku", "Brinjal Thokku", "Kara Kulambu" */ ]
      }
    ]
  },

  /* ---- Customer testimonials. ------------------------------------------

     PASTE YOUR REAL ONES HERE. Copy the commented example, uncomment it,
     and change the values. They appear on the home page, and on the page of
     whichever product they mention.

     While this list is empty the whole testimonials section hides itself, on
     every page — so the site never shows an empty "reviews" box.

     Fields:
       name    - the customer's name, however they'd like to be credited
       place   - town or city. Optional; leave "" to hide it
       rating  - a whole number 1 to 5. Optional; omit it for a quote with no stars
       text    - what they actually said
       product - the `slug` of the product they're talking about, so it shows on
                 that product's page. Use "" for general feedback about the brand
       date    - "YYYY-MM", used for ordering. Optional

     Only put real feedback here. Invented reviews are the fastest way for a
     small food brand to lose trust, and Google penalises fake review markup.
     ------------------------------------------------------------------- */
  testimonials: [

    // {
    //   name: "Lakshmi R.",
    //   place: "Coimbatore",
    //   rating: 5,
    //   text: "My daughter refuses every health drink but finishes this one. " +
    //         "The smell when you open the packet is exactly like my mother's kitchen.",
    //   product: "health-mix",
    //   date: "2026-08"
    // },

  ],

  /* ---- Sample review layout -------------------------------------------

     >>> TURN THIS OFF BEFORE YOU SHARE THE SITE PUBLICLY. <<<

     This shows an EMPTY placeholder layout so you can see how the reviews
     section will look and move. Nothing in it is attributed to a person —
     there are no names, no towns, no star ratings and no dates, because
     inventing those is illegal for a food business in India (BIS IS 19000
     requires a real identity, a real rating and a date on every published
     review) and Google penalises fake review markup.

     The cards below just restate facts already printed on your packets.

     The moment you paste one real review into `testimonials` above, the real
     section takes over and these disappear automatically. You can also just
     set this to false to hide the section entirely.
     ------------------------------------------------------------------- */
  showSampleReviews: true,

  sampleReviews: [
    "Health Mix — 20 ingredients, every one named on the pack",
    "Karuppu Kavuni Kanji — 2 ingredients, nothing else",
    "Nothing added to make it keep longer",
    "Best before 3 months once the packet is opened",
    "FSSAI licence 22426525000345",
    "Roasted and stone-ground in small batches",
    "100 g · 250 g · 500 g on every mix"
  ],

  /* ---- Enquiry options. Each opens WhatsApp with the first line written.
     Edit the wording freely. `icon` must be a name in assets/icons/.
     ------------------------------------------------------------------- */
  enquiries: [
    {
      id: "bulk",
      icon: "users-group",
      label: "Bulk or function order",
      desc: "Weddings, functions, temple prasadam, office orders.",
      text: "Hello Adisil! I'd like a bulk order.\n\n" +
            "What for (wedding / function / office / shop): \n" +
            "Which mixes: \nHow much: \nWhen you need it: \nDelivery area: "
    },
    {
      id: "custom",
      icon: "chef-hat",
      label: "Custom blend",
      desc: "A mix made to your recipe, or one of ours without something in it.",
      text: "Hello Adisil! I'd like to ask about a custom blend.\n\n" +
            "What I'd like changed or made: \n" +
            "Who it's for (age / any allergy): \nHow much: "
    },
    {
      id: "abroad",
      icon: "plant-2",
      label: "Send it abroad",
      desc: "Posting to family outside India. Tell us the country and we'll work out packing and cost.",
      text: "Hello Adisil! I'd like to send this to someone outside India.\n\n" +
            "Country: \nWhich mixes and sizes: \nWho it's going to: "
    },
    {
      id: "question",
      icon: "message-circle",
      label: "A question about a product",
      desc: "Ingredients, allergens, how to make it, how long it keeps.",
      text: "Hello Adisil! I have a question about:\n\nProduct: \nMy question: "
    },
    {
      id: "feedback",
      icon: "star",
      label: "Feedback",
      desc: "Tell us how it turned out. If you're happy for us to put it on the site, say so.",
      text: "Hello Adisil! Here's my feedback:\n\n" +
            "What I ordered: \nHow it was: \n\n" +
            "(Happy for you to publish this on your website: yes / no)"
    }
  ],

  /* ---- Questions customers actually ask. Rendered as an FAQ.
     Answer honestly. An awkward true answer builds more trust than a
     polished vague one.
     ------------------------------------------------------------------- */
  faq: [
    {
      q: "How long does it keep?",
      a: "Three months from the day you open the packet. That is short on purpose — " +
         "nothing goes in to make it keep longer. Unopened and stored cool and dry, " +
         "go by the date printed on your pack."
    },
    {
      q: "How should I store it?",
      a: "Cool and dry, out of sunlight. Use a clean, dry spoon every time — a wet " +
         "spoon is the fastest way to spoil a mix with no preservatives in it — and " +
         "press the pack closed after each use."
    },
    {
      q: "Why is there no price on the site?",
      a: "We are still settling the price list. Message us on WhatsApp and we will " +
         "tell you the price for the sizes you want, the same day."
    },
    {
      q: "How do I pay?",
      a: "On WhatsApp, after we confirm what you want. There is no checkout on this " +
         "site and nothing is charged here."
    },
    {
      q: "Do you deliver outside Tamil Nadu?",
      a: "Ask us. We arrange delivery personally for each order, so it depends on " +
         "where you are and how much you want. We would rather tell you honestly " +
         "than print a map we cannot keep to."
    },
    {
      q: "Is it safe for children, or during pregnancy?",
      a: "Every ingredient is listed in full on this site and on the pack, so you can " +
         "check it against anything you need to avoid. Several mixes contain nuts. " +
         "For anything medical, please ask your doctor — we are cooks, not clinicians."
    }
  ]
};
