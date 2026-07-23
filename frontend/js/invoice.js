async function initInvoicePage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");
  const root = document.getElementById("invoice-root");

  if (!orderId) {
    root.innerHTML = `<p style="text-align:center; color:#888;">No order specified.</p>`;
    return;
  }

  let order;
  try {
    const orders = await api.getOrders();
    order = orders.find((o) => o.id === orderId);
  } catch {
    order = null;
  }

  if (!order) {
    root.innerHTML = `<p style="text-align:center; color:#888;">Order not found.</p>`;
    return;
  }

  document.title = `Invoice ${order.id} — Vezora`;

  const itemRows = order.items
    .map(
      (it) => `
      <tr>
        <td>${it.name}</td>
        <td class="num">${it.qty}</td>
        <td class="num">${formatPrice(it.price)}</td>
        <td class="num">${formatPrice(it.price * it.qty)}</td>
      </tr>`
    )
    .join("");

  const subtotal = order.items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shipping = order.total - subtotal;

  root.innerHTML = `
    <div class="invoice-head">
      <div>
        <img src="assets/logo-full.png" alt="Vezora" />
      </div>
      <div class="invoice-meta">
        <div class="invoice-title" style="text-align:right;">INVOICE</div>
        <strong>${order.id}</strong><br/>
        Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}<br/>
        Status: ${order.status}
      </div>
    </div>

    <div class="invoice-cols">
      <div>
        <h4>Billed To</h4>
        <p>
          <strong>${order.customer.name}</strong><br/>
          ${order.customer.email}<br/>
          ${order.customer.phone}
        </p>
      </div>
      <div>
        <h4>Ship To</h4>
        <p>
          ${order.customer.address}<br/>
          ${order.customer.city} - ${order.customer.pincode}
        </p>
      </div>
    </div>

    <table class="invoice-table">
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="invoice-totals">
      <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
      <div class="row grand"><span>Total Paid</span><span>${formatPrice(order.total)}</span></div>
    </div>

    <div class="invoice-footer-note">
      Thank you for shopping with Vezora. This is a computer-generated invoice.<br/>
      Payment method: ${order.customer.payment || "Cash on Delivery"}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", initInvoicePage);
