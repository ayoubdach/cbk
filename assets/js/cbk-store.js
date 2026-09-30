/* ============================================================================
   CBK STORE — shared data layer
   ----------------------------------------------------------------------------
   Single source of truth for the catalogue, the cart and customer feedback.
   Loaded by BOTH the storefront (index.html) and the admin panel (admin.html),
   so a product added in the back office really does show up in the shop.

   Deliberately a plain IIFE (not an ES module) so the site keeps working when
   the HTML files are opened straight from disk with file://.
   ============================================================================ */
(function (global) {
  "use strict";

  /* ---------------------------------------------------------------- keys -- */
  var KEYS = {
    catalog:  "cbk.catalog.v1",
    cart:     "cbk.cart.v1",
    feedback: "cbk.feedback.v1",
    // pre-existing keys kept around so nothing already saved is lost
    legacyProducts: "cbkCustomProducts",
    legacyFeedback: "cbkFeedback"
  };

  /* -------------------------------------------------------------- images -- */
  var IMG = {
    tiles:       "assets/products/tiles.jpg",
    marble:      "assets/products/marble.jpg",
    sanitary:    "assets/products/sanitary.jpg",
    toilet:      "assets/products/toilet.jpg",
    bathtub:     "assets/products/bathtub.jpg",
    faucet:      "assets/products/faucet.jpg",
    vanity:      "assets/products/vanity.jpg",
    accessories: "assets/products/accessories.jpg"
  };

  /* ---------------------------------------------------------- categories -- */
  var CATEGORIES = [
    { id: "Faience",     label: "Faïence",      icon: "fa-border-all" },
    { id: "Gres",        label: "Grés",         icon: "fa-layer-group" },
    { id: "Sanitaire",   label: "Sanitaire",    icon: "fa-toilet" },
    { id: "Baignoire",   label: "Baignoire",    icon: "fa-bath" },
    { id: "Robinetterie",label: "Robinetterie", icon: "fa-faucet-drip" },
    { id: "Meubles",     label: "Meubles",      icon: "fa-cabinet-filing" },
    { id: "Accessoires", label: "Accessoires",  icon: "fa-trowel" }
  ];

  /* ------------------------------------------------------------ catalogue -- */
  var DEFAULT_PRODUCTS = [
    // ---- Faïence
    { id:1,  name:"Carreau Faïence Méditerranée 30x30",  cat:"Faience",     price:12.50, spec:"30x30 cm · Brillant",        img:IMG.tiles,       rating:4.5, badge:"",      stock:240, unit:"m²" },
    { id:2,  name:"Faïence Zellige Artisanal 20x20",     cat:"Faience",     price:18.00, spec:"20x20 cm · Fait main",       img:IMG.tiles,       rating:5,   badge:"best",  stock:85,  unit:"m²" },
    { id:3,  name:"Faïence Motif Andalou 25x40",         cat:"Faience",     price:15.50, spec:"25x40 cm · Mat",             img:IMG.tiles,       rating:4,   badge:"new",   stock:130, unit:"m²" },
    { id:4,  name:"Faïence Uni Blanc Nacré 20x50",       cat:"Faience",     price:10.90, spec:"20x50 cm · Satiné",          img:IMG.tiles,       rating:4.5, badge:"",      stock:310, unit:"m²" },
    { id:5,  name:"Faïence Hexagonale Terracotta 15x17", cat:"Faience",     price:16.80, spec:"Hexagonale · 15x17 cm",      img:IMG.tiles,       rating:4.5, badge:"new",   stock:64,  unit:"m²" },
    // ---- Grés
    { id:6,  name:"Grés Cérame Marbre Gris 60x60",       cat:"Gres",        price:28.00, spec:"60x60 cm · Poli",            img:IMG.marble,      rating:5,   badge:"best",  stock:150, unit:"m²" },
    { id:7,  name:"Parquet Grés Bois Naturel 15x90",     cat:"Gres",        price:35.00, spec:"15x90 cm · Effet bois",      img:IMG.marble,      rating:4.5, badge:"",      stock:92,  unit:"m²" },
    { id:8,  name:"Grés Extérieur Antidérapant 40x40",   cat:"Gres",        price:22.00, spec:"40x40 cm · R11",             img:IMG.marble,      rating:4,   badge:"",      stock:0,   unit:"m²" },
    { id:9,  name:"Grés Grand Format Béton 90x90",       cat:"Gres",        price:45.00, spec:"90x90 cm · Effet béton",     img:IMG.marble,      rating:4.5, badge:"new",   stock:48,  unit:"m²" },
    { id:10, name:"Grés Marbre Calacatta 60x120",        cat:"Gres",        price:62.00, spec:"60x120 cm · Brillant",       img:IMG.marble,      rating:5,   badge:"promo", stock:36,  unit:"m²", oldPrice:78.00 },
    // ---- Sanitaire
    { id:11, name:"Lavabo Suspendu Élégance Blanc",      cat:"Sanitaire",   price:89.00, spec:"Céramique · 60 cm",          img:IMG.sanitary,    rating:4.5, badge:"",      stock:22,  unit:"pièce" },
    { id:12, name:"WC Suspendu Comfort Plus",            cat:"Sanitaire",   price:145.00,spec:"Sans bride · Silencieux",    img:IMG.toilet,      rating:4.5, badge:"best",  stock:18,  unit:"pièce" },
    { id:13, name:"Colonne de Douche Chromée",           cat:"Sanitaire",   price:210.00,spec:"Thermostatique · Chromé",    img:IMG.faucet,      rating:4,   badge:"",      stock:9,   unit:"pièce" },
    { id:14, name:"Vasque à Poser Ronde Design",         cat:"Sanitaire",   price:120.00,spec:"40 cm · Céramique",          img:IMG.sanitary,    rating:4.5, badge:"new",   stock:14,  unit:"pièce" },
    { id:15, name:"Pack WC + Lavabo Compact",            cat:"Sanitaire",   price:280.00,spec:"Duo · Gain de place",        img:IMG.toilet,      rating:4,   badge:"promo", stock:7,   unit:"pack",  oldPrice:330.00 },
    // ---- Baignoire
    { id:16, name:"Baignoire Îlot Rectangulaire 170cm",  cat:"Baignoire",   price:590.00,spec:"170x80 cm · Acrylique",      img:IMG.bathtub,     rating:5,   badge:"",      stock:5,   unit:"pièce" },
    { id:17, name:"Baignoire d'Angle Hydromassante",     cat:"Baignoire",   price:890.00,spec:"150x150 cm · 6 jets",        img:IMG.bathtub,     rating:4.5, badge:"new",   stock:3,   unit:"pièce" },
    { id:18, name:"Baignoire Balnéo Rectangulaire",      cat:"Baignoire",   price:750.00,spec:"180x90 cm · Chromothérapie", img:IMG.bathtub,     rating:4.5, badge:"",      stock:0,   unit:"pièce" },
    { id:19, name:"Receveur de Douche Extra-Plat",       cat:"Baignoire",   price:165.00,spec:"90x90 cm · Antidérapant",    img:IMG.bathtub,     rating:4,   badge:"promo", stock:16,  unit:"pièce", oldPrice:195.00 },
    // ---- Robinetterie
    { id:20, name:"Robinet Thermostatique Noir Mat",     cat:"Robinetterie",price:175.00,spec:"Noir mat · Anticalcaire",    img:IMG.faucet,      rating:4.5, badge:"best",  stock:27,  unit:"pièce" },
    { id:21, name:"Mitigeur Évier Professionnel",        cat:"Robinetterie",price:95.00, spec:"Bec orientable · Inox",      img:IMG.faucet,      rating:4,   badge:"",      stock:41,  unit:"pièce" },
    { id:22, name:"Mitigeur Douche Encastré",            cat:"Robinetterie",price:220.00,spec:"Encastré · Chromé",          img:IMG.faucet,      rating:4.5, badge:"new",   stock:12,  unit:"pièce" },
    { id:23, name:"Robinet Cuisine Col de Cygne",        cat:"Robinetterie",price:130.00,spec:"Doré · Col de cygne",        img:IMG.faucet,      rating:4.5, badge:"",      stock:19,  unit:"pièce" },
    { id:24, name:"Colonne de Douche Effet Pluie",       cat:"Robinetterie",price:260.00,spec:"Effet pluie · 25 cm",        img:IMG.faucet,      rating:5,   badge:"promo", stock:8,   unit:"pièce", oldPrice:310.00 },
    // ---- Meubles
    { id:25, name:"Meuble Vasque 2 Tiroirs Chêne",       cat:"Meubles",     price:325.00,spec:"80 cm · Chêne clair",        img:IMG.vanity,      rating:4.5, badge:"",      stock:11,  unit:"pièce" },
    { id:26, name:"Colonne Salle de Bain 3 Portes",      cat:"Meubles",     price:280.00,spec:"3 portes · Blanc laqué",     img:IMG.vanity,      rating:4,   badge:"",      stock:6,   unit:"pièce" },
    { id:27, name:"Meuble Suspendu Noir Mat",            cat:"Meubles",     price:360.00,spec:"100 cm · Suspendu",          img:IMG.vanity,      rating:4.5, badge:"new",   stock:4,   unit:"pièce" },
    { id:28, name:"Miroir LED Salle de Bain",            cat:"Meubles",     price:150.00,spec:"80 cm · Anti-buée",          img:IMG.vanity,      rating:4.5, badge:"",      stock:23,  unit:"pièce" },
    // ---- Accessoires
    { id:29, name:"Sac Ciment Colle 25kg",               cat:"Accessoires", price:8.50,  spec:"25 kg · Int./Ext.",          img:IMG.accessories, rating:4.5, badge:"",      stock:500, unit:"sac" },
    { id:30, name:"Caro-Joint Hydrofuge 5kg",            cat:"Accessoires", price:12.00, spec:"5 kg · Hydrofuge",           img:IMG.accessories, rating:4.5, badge:"",      stock:180, unit:"sac" },
    { id:31, name:"Kit Étanchéité Douche",               cat:"Accessoires", price:22.00, spec:"Kit complet · Douche",       img:IMG.accessories, rating:4,   badge:"",      stock:34,  unit:"kit" },
    { id:32, name:"Profilé Aluminium Finition",          cat:"Accessoires", price:6.50,  spec:"2.5 m · Aluminium",          img:IMG.accessories, rating:4,   badge:"new",   stock:260, unit:"barre" },
    { id:33, name:"Silicone Sanitaire Anti-moisissure",  cat:"Accessoires", price:9.00,  spec:"310 ml · Anti-moisissure",   img:IMG.accessories, rating:4.5, badge:"",      stock:145, unit:"tube" }
  ];

  /* ------------------------------------------------------------- storage -- */
  function read(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn("[CBK] lecture impossible :", key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("[CBK] écriture impossible :", key, err);
      return false;
    }
  }

  /* --------------------------------------------------------- normalising -- */
  function normalise(p, index) {
    var price = Number(p.price);
    var stock = Number(p.stock);
    return {
      id:       Number(p.id) || Date.now() + index,
      name:     String(p.name || "Produit sans nom"),
      cat:      CATEGORIES.some(function (c) { return c.id === p.cat; }) ? p.cat : "Accessoires",
      price:    isFinite(price) && price >= 0 ? price : 0,
      oldPrice: p.oldPrice != null && isFinite(Number(p.oldPrice)) ? Number(p.oldPrice) : undefined,
      spec:     String(p.spec || ""),
      img:      String(p.img || IMG.tiles),
      rating:   isFinite(Number(p.rating)) ? Math.min(5, Math.max(0, Number(p.rating))) : 4.5,
      badge:    ["new", "promo", "best"].indexOf(p.badge) > -1 ? p.badge : "",
      stock:    isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
      unit:     String(p.unit || "unité"),
      custom:   !!p.custom
    };
  }

  /* ------------------------------------------------------- one-off setup -- */
  function seed() {
    var stored = read(KEYS.catalog, null);
    if (Array.isArray(stored) && stored.length) return stored.map(normalise);

    // First run: start from the defaults and fold in anything the previous
    // version of the admin panel had already saved under its old key.
    var catalog = DEFAULT_PRODUCTS.map(normalise);
    var legacy = read(KEYS.legacyProducts, []);
    if (Array.isArray(legacy) && legacy.length) {
      legacy.forEach(function (p, i) {
        var item = normalise(p, i);
        item.custom = true;
        if (!catalog.some(function (c) { return c.id === item.id; })) catalog.unshift(item);
      });
    }
    write(KEYS.catalog, catalog);
    return catalog;
  }

  var catalog = seed();
  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(catalog); } catch (err) { console.error("[CBK] listener:", err); }
    });
  }

  function persist() {
    write(KEYS.catalog, catalog);
    emit();
  }

  /* ------------------------------------------------- cross-tab live sync -- */
  // Change stock in the admin tab, watch the storefront tab update itself.
  global.addEventListener("storage", function (e) {
    if (e.key === KEYS.catalog) {
      catalog = read(KEYS.catalog, catalog).map(normalise);
      emit();
    }
  });

  /* ----------------------------------------------------------- public API -- */
  var CBK = {
    KEYS: KEYS,
    IMG: IMG,
    CATEGORIES: CATEGORIES,

    /** Whole catalogue (defaults + anything added in the back office). */
    products: function () { return catalog.slice(); },

    byId: function (id) {
      id = Number(id);
      return catalog.filter(function (p) { return p.id === id; })[0] || null;
    },

    categoryLabel: function (id) {
      var hit = CATEGORIES.filter(function (c) { return c.id === id; })[0];
      return hit ? hit.label : id;
    },

    /** Insert a new product, or update an existing one when the id matches. */
    upsert: function (product) {
      var item = normalise(product, catalog.length);
      var i = catalog.findIndex(function (p) { return p.id === item.id; });
      if (i > -1) {
        catalog[i] = Object.assign({}, catalog[i], item);
      } else {
        item.custom = true;
        catalog.unshift(item);
      }
      persist();
      return item;
    },

    patch: function (id, changes) {
      var i = catalog.findIndex(function (p) { return p.id === Number(id); });
      if (i < 0) return null;
      catalog[i] = normalise(Object.assign({}, catalog[i], changes), i);
      persist();
      return catalog[i];
    },

    remove: function (id) {
      var before = catalog.length;
      catalog = catalog.filter(function (p) { return p.id !== Number(id); });
      if (catalog.length !== before) persist();
      return before - catalog.length;
    },

    /** Restore the shipped catalogue, discarding back-office changes. */
    reset: function () {
      catalog = DEFAULT_PRODUCTS.map(normalise);
      persist();
      return catalog.slice();
    },

    nextId: function () {
      return catalog.reduce(function (max, p) { return Math.max(max, p.id); }, 0) + 1;
    },

    onChange: function (fn) {
      if (typeof fn === "function") listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },

    /* ------------------------------------------------------------- cart -- */
    cart: {
      get: function () {
        var raw = read(KEYS.cart, {});
        var clean = {};
        Object.keys(raw || {}).forEach(function (id) {
          var qty = Number(raw[id]);
          if (CBK.byId(id) && qty > 0) clean[id] = Math.floor(qty);
        });
        return clean;
      },
      set: function (cart) { write(KEYS.cart, cart || {}); },
      clear: function () { write(KEYS.cart, {}); }
    },

    /* --------------------------------------------------------- feedback -- */
    feedback: {
      all: function () {
        var current = read(KEYS.feedback, null);
        if (Array.isArray(current)) return current;
        var legacy = read(KEYS.legacyFeedback, []);
        return Array.isArray(legacy) ? legacy : [];
      },
      add: function (entry) {
        var all = CBK.feedback.all();
        all.push(Object.assign({ date: new Date().toISOString() }, entry));
        write(KEYS.feedback, all);
        return all;
      },
      remove: function (index) {
        var all = CBK.feedback.all();
        all.splice(index, 1);
        write(KEYS.feedback, all);
        return all;
      }
    },

    /* ---------------------------------------------------------- helpers -- */
    fmt: function (n) { return Number(n || 0).toFixed(2) + " TND"; },

    /** Escape anything that ends up inside innerHTML (product names, specs…). */
    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    },

    stats: function () {
      var list = catalog;
      return {
        total:    list.length,
        inStock:  list.filter(function (p) { return p.stock > 0; }).length,
        outStock: list.filter(function (p) { return p.stock <= 0; }).length,
        lowStock: list.filter(function (p) { return p.stock > 0 && p.stock <= 5; }).length,
        value:    list.reduce(function (sum, p) { return sum + p.price * p.stock; }, 0)
      };
    }
  };

  global.CBK = CBK;
})(window);
