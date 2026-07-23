async function initOrdersPage() {
  const root = document.getElementById("orders-root");
  const myIds = getMyOrderIds();
  const params = new URLSearchParams(window.location.search);
  const justPlaced = params.get("justPlaced");
  const loggedInUser = auth.read();

  if (!myIds.length && !loggedInUser) {
    root.innerHTML = `
      <div class="empty-state">
        <p>You haven't placed any orders yet on this device.</p>
        <p style="font-size:13px; margin-top:8px;">Tip: <a href="javascript:void(0)" onclick="openAuthModal()" style="color:var(--primary); font-weight:600;">log in</a> so your orders follow your account, not just this browser.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:14px;">Start shopping</a>
      </div>`;
    return;
  }

  const allOrders = await api.getOrders();
  const userOrders = loggedInUser ? await api.getOrdersByUser(loggedInUser.id) : [];

  const localOrders = myIds.map((id) => allOrders.find((o) => o.id === id)).filter(Boolean);
  const combinedMap = new Map();
  [...userOrders, ...localOrders].forEach((o) => combinedMap.set(o.id, o));
  const myOrders = [...combinedMap.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!myOrders.length) {
    root.innerHTML = `<div class="empty-state">No orders found.</div>`;
    return;
  }

  root.innerHTML = myOrders
    .map((order) => {
      const itemsHtml = order.items
        .map(
          (it) => `<div class="order-item-row"><span>${it.name} × ${it.qty}</span><span>${formatPrice(it.price * it.qty)}</span></div>`
        )
        .join("");
      const isNew = order.id === justPlaced;
      return `
      <div class="order-card" style="${isNew ? "border-color: var(--accent);" : ""}">
        <div class="order-head">
          <div>
            ${isNew ? `<div style="color:var(--accent); font-weight:600; font-size:13px; margin-bottom:4px;">✓ Order placed successfully</div>` : ""}
            <div class="order-id">Order ${order.id}</div>
            <div style="color:var(--muted); font-size:13px;">${new Date(order.createdAt).toLocaleString("en-IN")}</div>
          </div>
          <span class="status-pill status-${order.status}">${order.status}</span>
        </div>
        ${itemsHtml}
        <div class="summary-row total"><span>Total</span><span>${formatPrice(order.total)}</span></div>
        <div style="color:var(--muted); font-size:13px; margin-top:10px;">
          Shipping to: ${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}
        </div>
        <a href="invoice.html?id=${order.id}" class="btn btn-outline" style="margin-top:14px; display:inline-flex;">&#128196; Download Invoice</a>
      </div>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", initOrdersPage);
