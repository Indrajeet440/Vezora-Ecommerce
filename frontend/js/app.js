/**
 * app.js — shared across every storefront page.
 * Handles: API calls to the backend, cart persistence (localStorage),
 * toast notifications, and small formatting helpers.
 */

const API_BASE = "/api";

// ---------------- API helpers ----------------
const api = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    return res.json();
  },
  async getProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) return null;
    return res.json();
  },
  async createOrder(order) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    return res.json();
  },
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    return res.json();
  },
  async getOrdersByUser(userId) {
    const res = await fetch(`${API_BASE}/orders?userId=${encodeURIComponent(userId)}`);
    return res.json();
  },
  async createProduct(product) {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    return res.json();
  },
  async updateProduct(id, product) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    return res.json();
  },
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
    return res.json();
  },
  async updateOrderStatus(id, status) {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
  async signup(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  },
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  async saveSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return res.json();
  },
};

// ---------------- Cart (stored client-side in localStorage) ----------------
const CART_KEY = "vezora_cart_v1";

const cart = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  },
  write(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  },
  add(product, qty = 1) {
    const items = cart.read();
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        qty,
      });
    }
    cart.write(items);
  },
  updateQty(productId, qty) {
    let items = cart.read();
    if (qty <= 0) {
      items = items.filter((i) => i.productId !== productId);
    } else {
      const it = items.find((i) => i.productId === productId);
      if (it) it.qty = qty;
    }
    cart.write(items);
  },
  remove(productId) {
    const items = cart.read().filter((i) => i.productId !== productId);
    cart.write(items);
  },
  clear() {
    cart.write([]);
  },
  count() {
    return cart.read().reduce((sum, i) => sum + i.qty, 0);
  },
  total() {
    return cart.read().reduce((sum, i) => sum + i.qty * i.price, 0);
  },
};

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cart.count();
  });
}

// ---------------- Formatting ----------------
function formatPrice(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// ---------------- Toast ----------------
let toastTimer;
function showToast(message) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---------------- Local order-history tracking (works for guest checkouts) ----------------
const MY_ORDERS_KEY = "vezora_my_orders_v1";

function saveMyOrderId(orderId) {
  const ids = JSON.parse(localStorage.getItem(MY_ORDERS_KEY)) || [];
  ids.unshift(orderId);
  localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(ids));
}

function getMyOrderIds() {
  return JSON.parse(localStorage.getItem(MY_ORDERS_KEY)) || [];
}

// ---------------- Theme (light/dark) ----------------
const THEME_KEY = "vezora_theme";

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  if (next === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem(THEME_KEY, next);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  btn.innerHTML = isDark ? "&#9728;&#65039;" : "&#127769;";
  btn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
}

// ---------------- Wishlist (stored client-side in localStorage) ----------------
const WISHLIST_KEY = "vezora_wishlist_v1";

const wishlist = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    } catch {
      return [];
    }
  },
  has(productId) {
    return wishlist.read().includes(productId);
  },
  toggle(productId) {
    let ids = wishlist.read();
    if (ids.includes(productId)) {
      ids = ids.filter((id) => id !== productId);
    } else {
      ids.push(productId);
    }
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    updateWishlistBadge();
    return ids.includes(productId);
  },
  count() {
    return wishlist.read().length;
  },
};

function updateWishlistBadge() {
  document.querySelectorAll("[data-wishlist-count]").forEach((el) => {
    el.textContent = wishlist.count();
  });
}

document.addEventListener("DOMContentLoaded", updateWishlistBadge);

document.addEventListener("DOMContentLoaded", updateThemeToggleIcon);
document.addEventListener("DOMContentLoaded", updateCartBadge);

// ---------------- Global search (works from any page) ----------------
function runGlobalSearch() {
  const input = document.getElementById("global-search");
  if (!input) return;
  const query = input.value.trim();
  const onIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
  if (onIndexPage && typeof renderGrid === "function") {
    SEARCH_QUERY = query.toLowerCase();
    renderGrid();
    document.getElementById("catalog") && document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = `index.html?q=${encodeURIComponent(query)}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("global-search");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runGlobalSearch();
    });
  }
});

// ---------------- Voice search (real, using the browser's Web Speech API) ----------------
function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById("voice-search-btn");
  const input = document.getElementById("global-search");
  if (!SpeechRecognition) {
    showToast("Voice search isn't supported in this browser — try Chrome or Edge.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  if (btn) {
    btn.classList.add("listening");
    btn.innerHTML = "&#128308;";
  }
  showToast("Listening...");

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (input) input.value = transcript;
    runGlobalSearch();
  };
  recognition.onerror = () => {
    showToast("Couldn't hear that — please try again.");
  };
  recognition.onend = () => {
    if (btn) {
      btn.classList.remove("listening");
      btn.innerHTML = "&#127908;";
    }
  };
}

// ---------------- Visual search (opens camera/gallery; recognition not yet implemented) ----------------
function startVisualSearch() {
  const fileInput = document.getElementById("visual-search-input");
  if (fileInput) fileInput.click();
}

function handleVisualSearchFile(inputEl) {
  if (inputEl.files && inputEl.files.length) {
    showToast("Photo received — visual search is coming soon. Try describing it in words for now!");
  }
  inputEl.value = "";
}

// ---------------- Footer info modal (so footer links actually do something) ----------------
const FOOTER_INFO_CONTENT = {
  "Contact Us": "Reach us anytime at support@vezora.example or call our helpline at 1800-123-4567 (Mon–Sat, 9am–7pm IST). We usually reply within 24 hours.",
  "About Us": "Vezora is a single-vendor online store bringing mobiles, fashion, electronics, home essentials and more under one roof — with real accounts, real carts, and a real checkout flow.",
  "Careers": "We're not actively hiring right now, but check back soon — new roles in engineering, design, and customer support get posted here first.",
  "Vezora Stories": "Behind-the-scenes stories from our sellers, warehouse team, and delivery partners — coming soon.",
  "Press": "For media or press inquiries, please write to press@vezora.example with your publication details.",
  "Corporate Information": "Vezora Retail Pvt. Ltd. — registered office details and corporate filings will be listed here.",
  "Payments": "We accept Cash on Delivery, UPI, and all major credit/debit cards. All transactions are processed securely at checkout.",
  "Shipping": "Standard delivery takes 3–7 business days depending on your location. Orders above ₹2,000 ship free.",
  "Cancellation & Returns": "You can cancel an order before it ships from the Orders page. Returns are accepted within 7 days of delivery for eligible items.",
  "FAQ": "Frequently asked questions about orders, payments, and delivery will be listed here as our help center grows.",
  "Return Policy": "Most items can be returned within 7 days of delivery in original condition and packaging. Refunds are processed within 5–7 business days.",
  "Terms of Use": "By using Vezora, you agree to our terms covering account use, orders, pricing, and content. Full legal terms will be published here.",
  "Security": "Vezora uses salted password hashing for accounts and never stores payment details in plain text.",
  "Privacy": "We only collect the information needed to process your orders and improve your shopping experience. We never sell your data.",
  "Shipping Policy": "Orders are shipped from our partner warehouses and delivered by trusted courier partners. Tracking details are shared after dispatch.",
};

function openFooterInfoModal(label) {
  let overlay = document.getElementById("footer-info-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "qv-overlay";
    overlay.id = "footer-info-overlay";
    overlay.innerHTML = `<div class="footer-info-modal" id="footer-info-modal-content"></div>`;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeFooterInfoModal();
    });
    document.body.appendChild(overlay);
  }
  const content = document.getElementById("footer-info-modal-content");
  content.innerHTML = `
    <button type="button" class="qv-close" onclick="closeFooterInfoModal()">&#10005;</button>
    <h3>${label}</h3>
    <p>${FOOTER_INFO_CONTENT[label] || "More information coming soon."}</p>
  `;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeFooterInfoModal() {
  const overlay = document.getElementById("footer-info-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ---------------- Splash screen (shown once per browser session) ----------------
const SPLASH_KEY = "vezora_splash_shown";

function showSplashScreen() {
  if (sessionStorage.getItem(SPLASH_KEY)) return;
  sessionStorage.setItem(SPLASH_KEY, "true");

  const splash = document.createElement("div");
  splash.className = "splash-screen";
  splash.innerHTML = `<img src="/assets/logo-full.png" alt="Vezora" class="splash-logo" />`;
  document.body.appendChild(splash);
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => {
      splash.remove();
      document.body.style.overflow = "";
    }, 400);
  }, 900);
}

showSplashScreen();

// ---------------- Mobile hamburger menu ----------------
function toggleMobileNav() {
  const nav = document.querySelector(".nav-links");
  if (nav) nav.classList.toggle("mobile-open");
}

document.addEventListener("click", (e) => {
  const nav = document.querySelector(".nav-links");
  const btn = document.getElementById("mobile-menu-btn");
  if (nav && nav.classList.contains("mobile-open") && !nav.contains(e.target) && e.target !== btn) {
    nav.classList.remove("mobile-open");
  }
});

// ---------------- Auth (real signup/login backed by the server) ----------------
const AUTH_KEY = "vezora_auth";

const auth = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch {
      return null;
    }
  },
  isLoggedIn() {
    return !!auth.read();
  },
  save(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    renderAuthSlot();
  },
  logout() {
    localStorage.removeItem(AUTH_KEY);
    renderAuthSlot();
    showToast("Logged out");
  },
};

function renderAuthSlot() {
  const slot = document.getElementById("auth-slot");
  if (!slot) return;
  const user = auth.read();

  if (!user) {
    slot.innerHTML = `<button type="button" class="auth-login-btn" onclick="openAuthModal()">Login</button>`;
    return;
  }

  const firstName = (user.name || "").split(" ")[0];
  slot.innerHTML = `
    <div class="auth-menu-wrap">
      <button type="button" class="auth-user-btn" onclick="toggleAuthMenu()">Hi, ${firstName} &#9662;</button>
      <div class="auth-dropdown" id="auth-dropdown">
        <a href="orders.html">My Orders</a>
        <button type="button" onclick="auth.logout()">Logout</button>
      </div>
    </div>
  `;
}

function toggleAuthMenu() {
  const dd = document.getElementById("auth-dropdown");
  if (dd) dd.classList.toggle("open");
}

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".auth-menu-wrap");
  const dd = document.getElementById("auth-dropdown");
  if (wrap && dd && !wrap.contains(e.target)) dd.classList.remove("open");
});

// ---------------- Auth modal (login / signup) ----------------
function ensureAuthModal() {
  if (document.getElementById("auth-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "qv-overlay";
  overlay.id = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-modal">
      <button type="button" class="qv-close" onclick="closeAuthModal()">&#10005;</button>
      <div class="auth-modal-logo">
        <img src="/assets/logo-full.png" alt="Vezora" />
      </div>
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')">Log In</button>
        <button type="button" class="auth-tab" data-tab="signup" onclick="switchAuthTab('signup')">Sign Up</button>
      </div>

      <form id="login-form" class="auth-form">
        <div class="form-group full">
          <label>Email</label>
          <input type="email" id="login-email" required />
        </div>
        <div class="form-group full">
          <label>Password</label>
          <input type="password" id="login-password" required />
        </div>
        <p class="auth-error" id="login-error"></p>
        <button type="submit" class="btn btn-primary btn-block">Log In</button>
      </form>

      <form id="signup-form" class="auth-form" style="display:none;">
        <div class="form-group full">
          <label>Full name</label>
          <input type="text" id="signup-name" required />
        </div>
        <div class="form-group full">
          <label>Email</label>
          <input type="email" id="signup-email" required />
        </div>
        <div class="form-group full">
          <label>Password</label>
          <input type="password" id="signup-password" minlength="6" required />
          <span style="font-size:12px; color:var(--muted);">At least 6 characters</span>
        </div>
        <p class="auth-error" id="signup-error"></p>
        <button type="submit" class="btn btn-primary btn-block">Create Account</button>
      </form>
    </div>
  `;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAuthModal();
  });
  document.body.appendChild(overlay);

  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
  document.getElementById("signup-form").addEventListener("submit", handleSignupSubmit);
}

function openAuthModal() {
  ensureAuthModal();
  document.getElementById("auth-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  document.getElementById("login-form").style.display = tab === "login" ? "flex" : "none";
  document.getElementById("signup-form").style.display = tab === "signup" ? "flex" : "none";
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const user = await api.login(email, password);
    auth.save(user);
    closeAuthModal();
    showToast(`Welcome back, ${user.name.split(" ")[0]}!`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById("signup-error");
  errorEl.textContent = "";
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  try {
    const user = await api.signup(name, email, password);
    auth.save(user);
    closeAuthModal();
    showToast(`Welcome to Vezora, ${user.name.split(" ")[0]}!`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

document.addEventListener("DOMContentLoaded", renderAuthSlot);

// ---------------- Site settings (banners, trust badges, footer) ----------------
let SITE_SETTINGS = null;

async function loadSiteSettings() {
  try {
    SITE_SETTINGS = await api.getSettings();
  } catch {
    SITE_SETTINGS = {};
  }
  renderFooter(SITE_SETTINGS.footer);
  if (typeof onSiteSettingsLoaded === "function") onSiteSettingsLoaded(SITE_SETTINGS);
  return SITE_SETTINGS;
}

function footerLinksHtml(items) {
  return (items || [])
    .map((item) => `<a href="javascript:void(0)" onclick='openFooterInfoModal(${JSON.stringify(item.label)})'>${item.label}</a>`)
    .join("");
}

const SOCIAL_ICON_PATHS = {
  facebook: "M13 3h4V0h-4c-2.8 0-5 2.2-5 5v3H5v4h3v9h4v-9h3.2l.8-4H12V5c0-.6.4-1 1-1z",
  twitter: "M23 4.9c-.8.4-1.7.6-2.6.8 1-.6 1.7-1.5 2-2.6-.9.5-1.9.9-3 1.1-.9-.9-2.1-1.5-3.5-1.5-2.6 0-4.8 2.2-4.8 4.8 0 .4 0 .7.1 1-4-.2-7.5-2.1-9.9-5-.4.7-.6 1.5-.6 2.4 0 1.6.8 3.1 2.1 3.9-.8 0-1.5-.2-2.1-.6v.1c0 2.3 1.6 4.2 3.8 4.6-.4.1-.8.2-1.2.2-.3 0-.6 0-.9-.1.6 1.9 2.3 3.2 4.4 3.3-1.6 1.3-3.7 2-5.9 2-.4 0-.8 0-1.1-.1C2.1 20.3 4.6 21 7.3 21c8.7 0 13.5-7.2 13.5-13.5v-.6c.9-.7 1.7-1.5 2.2-2z",
  instagram: "M12 2c2.7 0 3 0 4.1.1 1.1 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1.1.4 2.2.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1.1-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.3-2.2.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1.1 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1.1-.4-2.2C2 15 2 14.7 2 12s0-3 .1-4.1c0-1.1.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.3 2.2-.4C8 2 8.3 2 12 2m0 3.4a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2zm0 10.9a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm6.9-11.1a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  youtube: "M23 12s0-3.6-.5-5.3c-.3-1-1-1.8-2-2C18.8 4.2 12 4.2 12 4.2s-6.8 0-8.5.5c-1 .2-1.8 1-2 2C1 8.4 1 12 1 12s0 3.6.5 5.3c.3 1 1 1.7 2 2 1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5c1-.3 1.7-1 2-2 .5-1.7.5-5.3.5-5.3zM9.8 15.5v-7l6 3.5-6 3.5z",
};

function renderFooter(footer) {
  const el = document.getElementById("site-footer");
  if (!el || !footer) return;

  const socialHtml = Object.entries(footer.social || {})
    .map(
      ([platform, url]) => `
      <a href="${url || "#"}" class="footer-social-icon" title="${platform}" aria-label="${platform}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="${SOCIAL_ICON_PATHS[platform] || ""}"/></svg>
      </a>`
    )
    .join("");

  el.innerHTML = `
    <div class="container footer-grid">
      <div class="footer-col footer-brand-col">
        <div class="footer-brand">
          <img src="/assets/logo-full.png" alt="Vezora" class="footer-logo-img" />
        </div>
        <p class="footer-brand-desc">Everything you need, all in one place — mobiles, fashion, electronics, home & more, delivered to your door.</p>
      </div>
      <div class="footer-col">
        <h4>About</h4>
        ${footerLinksHtml(footer.about)}
      </div>
      <div class="footer-col">
        <h4>Help</h4>
        ${footerLinksHtml(footer.help)}
      </div>
      <div class="footer-col">
        <h4>Policy</h4>
        ${footerLinksHtml(footer.policy)}
      </div>
      <div class="footer-col">
        <h4>Social</h4>
        <div class="footer-social-row">${socialHtml}</div>
        <h4 style="margin-top:18px;">Download App</h4>
        <div class="footer-app-buttons">
          <a href="#" class="footer-app-btn">&#128241; Google Play</a>
          <a href="#" class="footer-app-btn">&#128241; App Store</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <div class="footer-trust-row">
          <span>&#128274; Secure Payments</span>
          <span>&#128260; Easy Returns</span>
          <span>&#9989; Genuine Products</span>
        </div>
        <div class="footer-copy-row">
          <a href="javascript:void(0)" onclick="openFooterInfoModal('Terms of Use')">Terms</a> &middot; <a href="javascript:void(0)" onclick="openFooterInfoModal('Privacy')">Privacy</a> &middot; <a href="javascript:void(0)" onclick="openFooterInfoModal('Return Policy')">Returns</a> &middot; &copy; ${footer.copyrightYear || "2026"} Vezora
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadSiteSettings);
