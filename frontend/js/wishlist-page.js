async function initWishlistPage() {
  const root = document.getElementById("wishlist-root");
  const ids = wishlist.read();

  if (!ids.length) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="wave"><span></span><span></span><span></span><span></span><span></span></div>
        <p>Your wishlist is empty.</p>
        <a href="index.html" class="btn btn-primary">Continue shopping</a>
      </div>`;
    return;
  }

  const allProducts = await api.getProducts();
  const items = ids.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean);

  if (!items.length) {
    root.innerHTML = `<div class="empty-state">No wishlisted products found.</div>`;
    return;
  }

  root.innerHTML = `<div class="product-grid" id="wishlist-grid"></div>`;
  const grid = document.getElementById("wishlist-grid");

  grid.innerHTML = items
    .map((p) => {
      const outOfStock = p.stock <= 0;
      const discountPct = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
      const rating = p.rating || 4.0;
      return `
      <div class="card">
        <a href="product.html?id=${p.id}">
          <div class="card-img">
            ${outOfStock ? `<span class="badge out">Out of stock</span>` : ""}
            <img src="${p.image}" alt="${p.name}" loading="lazy" />
            <div class="card-icon-stack">
              <div class="tooltip-wrap">
                <button type="button" class="icon-btn wishlisted" onclick='event.preventDefault(); event.stopPropagation(); removeFromWishlistPage(${JSON.stringify(p.id)})'>&#9829;</button>
                <span class="tooltip-bubble">Remove from wishlist</span>
              </div>
            </div>
          </div>
        </a>
        <div class="card-body">
          <div class="card-cat">${p.category}</div>
          <a href="product.html?id=${p.id}"><div class="card-title">${p.name}</div></a>
          <div class="rating-row">
            <span class="rating-badge">${rating.toFixed(1)} &#9733;</span>
          </div>
          <div class="price-row">
            <span class="price">${formatPrice(p.price)}</span>
            ${p.mrp > p.price ? `<span class="mrp">${formatPrice(p.mrp)}</span>` : ""}
            ${discountPct > 0 ? `<span class="discount-pct">${discountPct}% off</span>` : ""}
          </div>
          <div class="card-actions">
            <button class="btn btn-primary btn-block" ${outOfStock ? "disabled" : ""} onclick='addWishlistItemToCart(${JSON.stringify(p.id)})'>
              ${outOfStock ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

let WISHLIST_PRODUCTS_CACHE = null;

async function addWishlistItemToCart(productId) {
  if (!WISHLIST_PRODUCTS_CACHE) WISHLIST_PRODUCTS_CACHE = await api.getProducts();
  const product = WISHLIST_PRODUCTS_CACHE.find((p) => p.id === productId);
  if (!product) return;
  cart.add(product, 1);
  showToast(`${product.name} added to cart`);
}

function removeFromWishlistPage(productId) {
  wishlist.toggle(productId);
  showToast("Removed from wishlist");
  initWishlistPage();
}

document.addEventListener("DOMContentLoaded", initWishlistPage);
