let CURRENT_PRODUCT = null;

async function initProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.getElementById("product-detail");

  if (!id) {
    root.innerHTML = `<div class="empty-state">No product selected. <a href="index.html">Back to shop</a></div>`;
    return;
  }

  const product = await api.getProduct(id);
  if (!product) {
    root.innerHTML = `<div class="empty-state">Product not found. <a href="index.html">Back to shop</a></div>`;
    return;
  }
  CURRENT_PRODUCT = product;
  CURRENT_IMAGE_INDEX = 0;
  document.title = `${product.name} — Vezora`;

  const stockClass = product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : "in";
  const stockText =
    product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock";

  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const rating = product.rating || 4.0;
  const reviews = product.reviews || 0;

  const specsRows = Object.entries(product.specs || {})
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");

  const images = product.images && product.images.length ? product.images : [product.image];
  const labels = product.imageLabels && product.imageLabels.length ? product.imageLabels : ["Front View", "Side View", "Top View", "Back View"];

  const thumbsHtml = images
    .map(
      (img, i) => `
      <button type="button" class="pd-thumb ${i === 0 ? "active" : ""}" data-index="${i}" onclick="setMainImage(${i})">
        <img src="${img}" alt="${labels[i] || "View " + (i + 1)}" />
        <span class="pd-thumb-label">${labels[i] || "View " + (i + 1)}</span>
      </button>`
    )
    .join("");

  root.innerHTML = `
    <div class="pd-gallery">
      <div class="pd-image">
        <button type="button" class="pd-nav-arrow pd-nav-prev" onclick="navigateImage(-1)" aria-label="Previous view">&#10094;</button>
        <img id="pd-main-image" src="${images[0]}" alt="${product.name}" />
        <button type="button" class="pd-nav-arrow pd-nav-next" onclick="navigateImage(1)" aria-label="Next view">&#10095;</button>
        <span class="pd-current-label" id="pd-current-label">${labels[0] || "View 1"}</span>
      </div>
      <div class="pd-thumbs">${thumbsHtml}</div>
    </div>
    <div>
      <div class="pd-cat">${product.category}</div>
      <h1 class="pd-title">${product.name}</h1>
      <div class="pd-rating">
        <span class="stars">${rating.toFixed(1)} &#9733;</span>
        <span class="reviews">${reviews.toLocaleString("en-IN")} ratings & reviews</span>
      </div>
      <div class="pd-price">
        ${formatPrice(product.price)}
        ${product.mrp > product.price ? `<span class="mrp" style="margin-left:10px;">${formatPrice(product.mrp)}</span>` : ""}
        ${discountPct > 0 ? `<span class="discount-pct" style="margin-left:10px;">${discountPct}% off</span>` : ""}
      </div>
      <p class="pd-desc">${product.description}</p>
      <div class="pd-stock ${stockClass}">${stockText}</div>

      <div class="qty-row">
        <div class="qty-control">
          <button type="button" onclick="changeQty(-1)">−</button>
          <input type="number" id="qty-input" value="1" min="1" max="${product.stock}" />
          <button type="button" onclick="changeQty(1)">+</button>
        </div>
        <button class="btn btn-primary" id="add-to-cart-btn" ${product.stock <= 0 ? "disabled" : ""} onclick="addCurrentToCart()">
          ${product.stock <= 0 ? "Out of stock" : "Add to cart"}
        </button>
        <div class="tooltip-wrap">
          <button type="button" class="icon-btn ${wishlist.has(product.id) ? "wishlisted" : ""}" style="opacity:1; position:static; transform:none;" id="pd-wishlist-btn" onclick="togglePdWishlist('${product.id}')">${wishlist.has(product.id) ? "&#9829;" : "&#9825;"}</button>
          <span class="tooltip-bubble">${wishlist.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}</span>
        </div>
      </div>

      <table class="specs-table">
        <tbody>${specsRows}</tbody>
      </table>
    </div>
  `;
}

let CURRENT_IMAGE_INDEX = 0;

function setMainImage(index) {
  const images = CURRENT_PRODUCT.images && CURRENT_PRODUCT.images.length ? CURRENT_PRODUCT.images : [CURRENT_PRODUCT.image];
  const labels = CURRENT_PRODUCT.imageLabels && CURRENT_PRODUCT.imageLabels.length ? CURRENT_PRODUCT.imageLabels : ["Front View", "Side View", "Top View", "Back View"];
  CURRENT_IMAGE_INDEX = index;
  document.getElementById("pd-main-image").src = images[index];
  const labelEl = document.getElementById("pd-current-label");
  if (labelEl) labelEl.textContent = labels[index] || `View ${index + 1}`;
  document.querySelectorAll(".pd-thumb").forEach((el, i) => el.classList.toggle("active", i === index));
}

function navigateImage(delta) {
  const images = CURRENT_PRODUCT.images && CURRENT_PRODUCT.images.length ? CURRENT_PRODUCT.images : [CURRENT_PRODUCT.image];
  const next = (CURRENT_IMAGE_INDEX + delta + images.length) % images.length;
  setMainImage(next);
}

function changeQty(delta) {
  const input = document.getElementById("qty-input");
  let val = parseInt(input.value || "1", 10) + delta;
  val = Math.max(1, Math.min(val, CURRENT_PRODUCT.stock || 1));
  input.value = val;
}

function addCurrentToCart() {
  const qty = parseInt(document.getElementById("qty-input").value || "1", 10);
  cart.add(CURRENT_PRODUCT, qty);
  showToast(`${CURRENT_PRODUCT.name} added to cart`);
}

function togglePdWishlist(productId) {
  const isNowWishlisted = wishlist.toggle(productId);
  const btn = document.getElementById("pd-wishlist-btn");
  btn.innerHTML = isNowWishlisted ? "&#9829;" : "&#9825;";
  btn.classList.toggle("wishlisted", isNowWishlisted);
  const bubble = btn.parentElement.querySelector(".tooltip-bubble");
  if (bubble) bubble.textContent = isNowWishlisted ? "Remove from wishlist" : "Add to wishlist";
  showToast(isNowWishlisted ? "Added to wishlist" : "Removed from wishlist");
}

document.addEventListener("DOMContentLoaded", initProductDetail);
