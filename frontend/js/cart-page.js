function renderCartPage() {
  const items = cart.read();
  const root = document.getElementById("cart-root");

  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="wave"><span></span><span></span><span></span><span></span><span></span></div>
        <p>Your cart is empty.</p>
        <a href="index.html" class="btn btn-primary">Continue shopping</a>
      </div>`;
    return;
  }

  const rows = items
    .map(
      (it) => `
      <div class="cart-item">
        <img class="cart-item-img" src="${it.image}" alt="${it.name}" />
        <div class="cart-item-info">
          <div class="cart-item-name">${it.name}</div>
          <div class="cart-item-cat">${it.category}</div>
          <a class="remove-link" href="javascript:void(0)" onclick="removeItem('${it.productId}')">Remove</a>
        </div>
        <div class="qty-control">
          <button type="button" onclick="updateItemQty('${it.productId}', ${it.qty - 1})">−</button>
          <input type="number" value="${it.qty}" min="1" onchange="updateItemQty('${it.productId}', this.value)" />
          <button type="button" onclick="updateItemQty('${it.productId}', ${it.qty + 1})">+</button>
        </div>
        <div class="cart-item-price">${formatPrice(it.price * it.qty)}</div>
      </div>`
    )
    .join("");

  const subtotal = cart.total();
  const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  root.innerHTML = `
    <div class="cart-layout">
      <div>${rows}</div>
      <div class="summary-card">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:16px;">Proceed to checkout</a>
        <a href="index.html" class="btn btn-outline btn-block" style="margin-top:10px;">Continue shopping</a>
      </div>
    </div>
  `;
}

function updateItemQty(productId, qty) {
  cart.updateQty(productId, parseInt(qty, 10));
  renderCartPage();
}

function removeItem(productId) {
  cart.remove(productId);
  renderCartPage();
}

document.addEventListener("DOMContentLoaded", renderCartPage);
