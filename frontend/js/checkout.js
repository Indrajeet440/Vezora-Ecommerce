function renderCheckoutSummary() {
  const items = cart.read();
  const summaryEl = document.getElementById("checkout-summary");
  const formEl = document.getElementById("checkout-form");

  if (!items.length) {
    document.getElementById("checkout-root").innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <p>Your cart is empty — add something before checking out.</p>
        <a href="index.html" class="btn btn-primary">Browse products</a>
      </div>`;
    return;
  }

  const subtotal = cart.total();
  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal + shipping;

  const rows = items
    .map(
      (it) => `<div class="summary-row"><span>${it.name} × ${it.qty}</span><span>${formatPrice(it.price * it.qty)}</span></div>`
    )
    .join("");

  summaryEl.innerHTML = `
    <h3 style="margin-top:0;font-family:var(--font-display);">Order summary</h3>
    ${rows}
    <div class="summary-row" style="border-top:1px solid var(--border); padding-top:12px; margin-top:12px;"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const items = cart.read();
  if (!items.length) return;

  const btn = document.getElementById("place-order-btn");
  btn.disabled = true;
  btn.textContent = "Placing order...";

  const customer = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    pincode: document.getElementById("pincode").value.trim(),
    payment: document.getElementById("payment").value,
  };

  const orderPayload = {
    items: items.map((it) => ({
      productId: it.productId,
      name: it.name,
      price: it.price,
      qty: it.qty,
    })),
    customer,
    userId: auth.isLoggedIn() ? auth.read().id : null,
  };

  try {
    const order = await api.createOrder(orderPayload);
    cart.clear();
    saveMyOrderId(order.id);
    window.location.href = `orders.html?justPlaced=${order.id}`;
  } catch (err) {
    showToast("Something went wrong placing your order. Please try again.");
    btn.disabled = false;
    btn.textContent = "Place order";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutSummary();
  const form = document.getElementById("checkout-form");
  if (form) form.addEventListener("submit", handleCheckoutSubmit);

  if (auth.isLoggedIn()) {
    const user = auth.read();
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    if (nameInput && !nameInput.value) nameInput.value = user.name;
    if (emailInput && !emailInput.value) emailInput.value = user.email;
  }
});
