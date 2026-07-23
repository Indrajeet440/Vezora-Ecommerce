let ALL_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let ACTIVE_SORT = "default";
let SEARCH_QUERY = "";
let CURRENT_BANNER = 0;
let BANNER_COUNT = 0;
let bannerAutoTimer = null;

function onSiteSettingsLoaded(settings) {
  if (settings.banners) renderBanners(settings.banners);
  if (settings.trustBadges) renderTrustBadges(settings.trustBadges);
}

const TRUST_ICON_SVG = {
  shield: '<path d="M12 2l8 3v6c0 5-3.4 8.6-8 11-4.6-2.4-8-6-8-11V5l8-3z"/>',
  truck: '<path d="M2 7h11v8H2zM13 10h4l3 3v2h-7zM5.5 19a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zM17 19a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z"/>',
  refresh: '<path d="M20 12a8 8 0 10-2.6 5.9M20 12v5h-5M4 12a8 8 0 012.6-5.9M4 12V7h5"/>',
  headset: '<path d="M4 13v3a2 2 0 002 2h1v-7H5a1 1 0 00-1 1zm16 0a1 1 0 00-1-1h-2v7h1a2 2 0 002-2v-3zM12 3a8 8 0 00-8 8v1h3v-1a5 5 0 0110 0v1h3v-1a8 8 0 00-8-8z"/>',
};

function renderBanners(banners) {
  const track = document.getElementById("hero-track");
  const dots = document.getElementById("hero-dots");
  if (!track || !banners || !banners.length) return;
  BANNER_COUNT = banners.length;

  track.innerHTML = banners
    .map(
      (b) => `
    <div class="hero-slide" style="background: linear-gradient(120deg, ${b.bgFrom} 0%, ${b.bgTo} 100%);">
      <div class="hero-inner">
        <div>
          <div class="hero-eyebrow">${b.eyebrow}</div>
          <h1>${b.title.split("|").map((line) => `<span class="hero-line">${line}</span>`).join("")}</h1>
          <p class="lead">${b.subtitle} <strong style="color: var(--accent);">${b.highlight}</strong></p>
          <a href="${b.buttonLink}" class="btn btn-buynow">${b.buttonText} &#8594;</a>
        </div>
        <div class="hero-visual">
          <img src="${b.image}" alt="${b.eyebrow}" />
        </div>
      </div>
    </div>`
    )
    .join("");

  dots.innerHTML = banners.map((_, i) => `<button type="button" class="hero-dot ${i === 0 ? "active" : ""}" onclick="goToBanner(${i})"></button>`).join("");

  updateBannerPosition();
  startBannerAutoplay();
}

function updateBannerPosition() {
  const track = document.getElementById("hero-track");
  if (!track) return;
  track.style.transform = `translateX(-${CURRENT_BANNER * 100}%)`;
  document.querySelectorAll(".hero-dot").forEach((el, i) => el.classList.toggle("active", i === CURRENT_BANNER));
}

function moveBanner(delta) {
  if (!BANNER_COUNT) return;
  CURRENT_BANNER = (CURRENT_BANNER + delta + BANNER_COUNT) % BANNER_COUNT;
  updateBannerPosition();
  startBannerAutoplay();
}

function goToBanner(index) {
  CURRENT_BANNER = index;
  updateBannerPosition();
  startBannerAutoplay();
}

function startBannerAutoplay() {
  clearInterval(bannerAutoTimer);
  bannerAutoTimer = setInterval(() => moveBanner(1), 6000);
}

function renderTrustBadges(badges) {
  const el = document.getElementById("trust-badges");
  if (!el || !badges) return;
  el.innerHTML = badges
    .map(
      (b) => `
    <div class="trust-badge">
      <span class="trust-badge-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">${TRUST_ICON_SVG[b.icon] || ""}</svg></span>
      <div>
        <div class="trust-badge-title">${b.title}</div>
        <div class="trust-badge-subtitle">${b.subtitle}</div>
      </div>
    </div>`
    )
    .join("");
}

async function initProductsPage() {
  ALL_PRODUCTS = await api.getProducts();
  renderCategoryStrip();
  renderFilters();
  bindSortOptions();
  renderGrid();
}

const CATEGORY_ICONS = {
  All: "🛍️",
  Mobiles: "📱",
  Electronics: "💻",
  Fashion: "👗",
  "Home & Kitchen": "🏠",
  "Beauty & Personal Care": "💄",
  Books: "📚",
  "Toys & Baby": "🧸",
  "Sports & Fitness": "🏋️",
};

const CATEGORY_IMAGES = {
  Mobiles: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80",
  Electronics: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=100&q=80",
  Fashion: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=100&q=80",
  "Home & Kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=100&q=80",
  "Beauty & Personal Care": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&q=80",
  Books: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&q=80",
  "Toys & Baby": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=100&q=80",
  "Sports & Fitness": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&q=80",
};

function renderCategoryStrip() {
  const categories = ["All", ...new Set(ALL_PRODUCTS.map((p) => p.category))];
  const stripEl = document.getElementById("category-strip-inner");
  if (!stripEl) return;
  stripEl.innerHTML = categories
    .map((c) => {
      const img = CATEGORY_IMAGES[c];
      const iconHtml = img
        ? `<img src="${img}" alt="${c}" class="cat-pill-img" />`
        : `<span class="cat-pill-icon">${CATEGORY_ICONS[c] || "🏷️"}</span>`;
      return `
      <button class="cat-pill ${c === ACTIVE_CATEGORY ? "active" : ""}" data-category="${c}">
        ${iconHtml}
        <span class="cat-pill-label">${c}</span>
      </button>`;
    })
    .join("");
  stripEl.querySelectorAll(".cat-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      ACTIVE_CATEGORY = btn.dataset.category;
      renderCategoryStrip();
      renderFilters();
      renderGrid();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function renderFilters() {
  const categories = ["All", ...new Set(ALL_PRODUCTS.map((p) => p.category))];
  const filtersEl = document.getElementById("filters");
  filtersEl.innerHTML = categories
    .map((c) => {
      const count = c === "All" ? ALL_PRODUCTS.length : ALL_PRODUCTS.filter((p) => p.category === c).length;
      return `<button class="chip ${c === ACTIVE_CATEGORY ? "active" : ""}" data-category="${c}">${c} (${count})</button>`;
    })
    .join("");

  filtersEl.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      ACTIVE_CATEGORY = btn.dataset.category;
      renderFilters();
      renderCategoryStrip();
      renderGrid();
    });
  });
}

function bindSortOptions() {
  const sortEl = document.getElementById("sort-options");
  if (!sortEl) return;
  sortEl.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      ACTIVE_SORT = btn.dataset.sort;
      sortEl.querySelectorAll(".chip").forEach((b) => b.classList.toggle("active", b === btn));
      renderGrid();
    });
  });
}

function getFilteredSortedList() {
  let list =
    ACTIVE_CATEGORY === "All" ? [...ALL_PRODUCTS] : ALL_PRODUCTS.filter((p) => p.category === ACTIVE_CATEGORY);

  if (SEARCH_QUERY) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(SEARCH_QUERY) ||
        p.category.toLowerCase().includes(SEARCH_QUERY) ||
        (p.shortDescription || "").toLowerCase().includes(SEARCH_QUERY)
    );
  }

  if (ACTIVE_SORT === "priceLow") list.sort((a, b) => a.price - b.price);
  else if (ACTIVE_SORT === "priceHigh") list.sort((a, b) => b.price - a.price);
  else if (ACTIVE_SORT === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return list;
}

function renderGrid() {
  const grid = document.getElementById("product-grid");
  const list = getFilteredSortedList();

  document.getElementById("result-count").textContent = `${list.length} product${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No products match your filters. <a href="index.html" style="color:var(--header-blue); font-weight:600;">Clear filters</a></div>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const outOfStock = p.stock <= 0;
      const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
      const badge = outOfStock
        ? `<span class="badge out">Out of stock</span>`
        : discountPct > 0
        ? `<span class="badge">${discountPct}% off</span>`
        : "";
      const rating = p.rating || 4.0;
      const ratingsCount = p.ratingsCount || p.reviews || 0;
      const isWishlisted = wishlist.has(p.id);
      return `
      <div class="card">
        <a href="product.html?id=${p.id}">
          <div class="card-img">
            ${badge}
            <img src="${p.image}" alt="${p.name}" loading="lazy" />
            <div class="card-icon-stack">
              <div class="tooltip-wrap">
                <button type="button" class="icon-btn ${isWishlisted ? "wishlisted" : ""}" onclick='event.preventDefault(); event.stopPropagation(); toggleWishlistIcon(this, ${JSON.stringify(p.id)})'>${isWishlisted ? "&#9829;" : "&#9825;"}</button>
                <span class="tooltip-bubble">${isWishlisted ? "Remove from wishlist" : "Add to wishlist"}</span>
              </div>
              <div class="tooltip-wrap">
                <button type="button" class="icon-btn" onclick='event.preventDefault(); event.stopPropagation(); openQuickView(${JSON.stringify(p.id)})'>&#128065;</button>
                <span class="tooltip-bubble">Quick view</span>
              </div>
            </div>
          </div>
        </a>
        <div class="card-body">
          <div class="card-cat">${p.category}</div>
          <a href="product.html?id=${p.id}"><div class="card-title">${p.name}</div></a>
          <div class="rating-row">
            <span class="rating-badge">${rating.toFixed(1)} &#9733;</span>
            <span class="rating-count">(${ratingsCount.toLocaleString("en-IN")})</span>
          </div>
          <div class="price-row">
            <span class="price">${formatPrice(p.price)}</span>
            ${p.mrp > p.price ? `<span class="mrp">${formatPrice(p.mrp)}</span>` : ""}
            ${discountPct > 0 ? `<span class="discount-pct">${discountPct}% off</span>` : ""}
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-block" ${outOfStock ? "disabled" : ""} onclick='quickAdd(${JSON.stringify(p.id)})'>
              ${outOfStock ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function quickAdd(productId) {
  const product = ALL_PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  cart.add(product, 1);
  showToast(`${product.name} added to cart`);
}

function toggleWishlistIcon(btnEl, productId) {
  const isNowWishlisted = wishlist.toggle(productId);
  btnEl.innerHTML = isNowWishlisted ? "&#9829;" : "&#9825;";
  btnEl.classList.toggle("wishlisted", isNowWishlisted);
  const bubble = btnEl.parentElement.querySelector(".tooltip-bubble");
  if (bubble) bubble.textContent = isNowWishlisted ? "Remove from wishlist" : "Add to wishlist";
  showToast(isNowWishlisted ? "Added to wishlist" : "Removed from wishlist");
}

// ---------------- Quick view modal ----------------
function ensureQuickViewModal() {
  if (document.getElementById("qv-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "qv-overlay";
  overlay.id = "qv-overlay";
  overlay.innerHTML = `<div class="qv-modal" id="qv-modal-content"></div>`;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeQuickView();
  });
  document.body.appendChild(overlay);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickView();
  });
}

function openQuickView(productId) {
  const product = ALL_PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  ensureQuickViewModal();

  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const rating = product.rating || 4.0;
  const reviews = product.reviews || 0;
  const outOfStock = product.stock <= 0;
  const specsRows = Object.entries(product.specs || {})
    .slice(0, 4)
    .map(([k, v]) => `<tr><td style="color:var(--muted); padding:5px 0; font-size:13px;">${k}</td><td style="padding:5px 0; font-size:13px;">${v}</td></tr>`)
    .join("");

  const content = document.getElementById("qv-modal-content");
  content.innerHTML = `
    <button type="button" class="qv-close" onclick="closeQuickView()">&#10005;</button>
    <div class="qv-image"><img src="${product.image}" alt="${product.name}" style="max-width:100%; border-radius: var(--radius);" /></div>
    <div class="qv-body">
      <div class="qv-cat">${product.category}</div>
      <div class="qv-title">${product.name}</div>
      <div class="rating-row">
        <span class="rating-badge">${rating.toFixed(1)} &#9733;</span>
        <span class="rating-count">(${reviews.toLocaleString("en-IN")} reviews)</span>
      </div>
      <div class="price-row" style="margin-top:10px;">
        <span class="price">${formatPrice(product.price)}</span>
        ${product.mrp > product.price ? `<span class="mrp">${formatPrice(product.mrp)}</span>` : ""}
        ${discountPct > 0 ? `<span class="discount-pct">${discountPct}% off</span>` : ""}
      </div>
      <p class="qv-desc">${product.shortDescription}</p>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">${specsRows}</table>
      <div style="display:flex; gap:10px; margin-top:auto;">
        <button class="btn btn-primary btn-block" ${outOfStock ? "disabled" : ""} onclick='quickAdd(${JSON.stringify(product.id)}); closeQuickView();'>
          ${outOfStock ? "Out of stock" : "Add to cart"}
        </button>
        <a href="product.html?id=${product.id}" class="btn btn-outline btn-block">View full details</a>
      </div>
    </div>
  `;
  document.getElementById("qv-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeQuickView() {
  const overlay = document.getElementById("qv-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  const category = params.get("category");
  if (q) {
    SEARCH_QUERY = q.trim().toLowerCase();
    const input = document.getElementById("global-search");
    if (input) input.value = q;
  }
  if (category) {
    ACTIVE_CATEGORY = category;
  }
  initProductsPage();
});
