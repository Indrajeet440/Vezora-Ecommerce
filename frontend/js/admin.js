const ADMIN_PASSWORD = "Omega@143P"; // Change this before real deployment; better yet, move auth to the backend.
const ADMIN_SESSION_KEY = "vezora_admin_session";

let ADMIN_PRODUCTS = [];
let ADMIN_ORDERS = [];

function attemptLogin() {
  const input = document.getElementById("admin-password").value;
  if (input === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    showAdminApp();
  } else {
    document.getElementById("login-error").style.display = "block";
  }
}

function showAdminApp() {
  document.getElementById("login-box").style.display = "none";
  document.getElementById("admin-app").style.display = "block";
  loadProducts();
  loadOrders();
  loadSiteContent();
}

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  document.getElementById("tab-products").style.display = tab === "products" ? "block" : "none";
  document.getElementById("tab-orders").style.display = tab === "orders" ? "block" : "none";
  document.getElementById("tab-content").style.display = tab === "content" ? "block" : "none";
}

// ---------------- Products ----------------
async function loadProducts() {
  ADMIN_PRODUCTS = await api.getProducts();
  renderAdminProducts();
}

function renderAdminProducts() {
  const body = document.getElementById("admin-products-body");
  body.innerHTML = ADMIN_PRODUCTS.map(
    (p) => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}" /></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.featured ? "Yes" : "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline" onclick='openProductForm(${JSON.stringify(p.id)})'>Edit</button>
          <button class="btn btn-danger" onclick='deleteProduct(${JSON.stringify(p.id)})'>Delete</button>
        </div>
      </td>
    </tr>`
  ).join("");
}

function openProductForm(id) {
  const modal = document.getElementById("product-modal");
  const form = document.getElementById("product-form");
  form.reset();
  document.getElementById("pf-id").value = "";
  document.getElementById("modal-title").textContent = id ? "Edit product" : "Add product";

  if (id) {
    const p = ADMIN_PRODUCTS.find((pr) => pr.id === id);
    if (p) {
      document.getElementById("pf-id").value = p.id;
      document.getElementById("pf-name").value = p.name;
      document.getElementById("pf-category").value = p.category;
      document.getElementById("pf-price").value = p.price;
      document.getElementById("pf-mrp").value = p.mrp;
      document.getElementById("pf-stock").value = p.stock;
      const imgs = p.images && p.images.length ? p.images : [p.image, "", "", ""];
      document.getElementById("pf-image-front").value = imgs[0] || "";
      document.getElementById("pf-image-side").value = imgs[1] || "";
      document.getElementById("pf-image-top").value = imgs[2] || "";
      document.getElementById("pf-image-back").value = imgs[3] || "";
      document.getElementById("pf-short").value = p.shortDescription;
      document.getElementById("pf-desc").value = p.description;
      document.getElementById("pf-featured").checked = !!p.featured;
    }
  }
  modal.style.display = "flex";
}

function closeProductForm() {
  document.getElementById("product-modal").style.display = "none";
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("pf-id").value;
  const placeholder = "https://placehold.co/600x600?text=Product";
  const front = document.getElementById("pf-image-front").value.trim() || placeholder;
  const side = document.getElementById("pf-image-side").value.trim() || front;
  const top = document.getElementById("pf-image-top").value.trim() || front;
  const back = document.getElementById("pf-image-back").value.trim() || front;
  const images = [front, side, top, back];

  const payload = {
    name: document.getElementById("pf-name").value.trim(),
    category: document.getElementById("pf-category").value.trim(),
    price: Number(document.getElementById("pf-price").value),
    mrp: Number(document.getElementById("pf-mrp").value || document.getElementById("pf-price").value),
    stock: Number(document.getElementById("pf-stock").value),
    image: images[0],
    images: images,
    imageLabels: ["Front View", "Side View", "Top View", "Back View"],
    shortDescription: document.getElementById("pf-short").value.trim(),
    description: document.getElementById("pf-desc").value.trim(),
    featured: document.getElementById("pf-featured").checked,
  };

  if (id) {
    await api.updateProduct(id, payload);
    showToast("Product updated");
  } else {
    await api.createProduct(payload);
    showToast("Product added");
  }
  closeProductForm();
  loadProducts();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  await api.deleteProduct(id);
  showToast("Product deleted");
  loadProducts();
}

// ---------------- Orders ----------------
async function loadOrders() {
  ADMIN_ORDERS = await api.getOrders();
  renderAdminOrders();
}

const STATUS_OPTIONS = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

function renderAdminOrders() {
  const body = document.getElementById("admin-orders-body");
  if (!ADMIN_ORDERS.length) {
    body.innerHTML = `<tr><td colspan="6" style="color:var(--muted);">No orders placed yet.</td></tr>`;
    return;
  }
  body.innerHTML = [...ADMIN_ORDERS]
    .reverse()
    .map((o) => {
      const itemsSummary = o.items.map((it) => `${it.name} ×${it.qty}`).join(", ");
      const options = STATUS_OPTIONS.map(
        (s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`
      ).join("");
      return `
      <tr>
        <td>${o.id}</td>
        <td>${o.customer.name}<br/><span style="color:var(--muted); font-size:12px;">${o.customer.phone}</span></td>
        <td style="max-width:260px;">${itemsSummary}</td>
        <td>${formatPrice(o.total)}</td>
        <td><select class="status-select" onchange='changeOrderStatus(${JSON.stringify(o.id)}, this.value)'>${options}</select></td>
        <td>${new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
      </tr>`;
    })
    .join("");
}

async function changeOrderStatus(id, status) {
  await api.updateOrderStatus(id, status);
  showToast(`Order ${id} marked ${status}`);
  loadOrders();
}

// ---------------- Site Content (banners, trust badges, footer) ----------------
let ADMIN_SETTINGS = { banners: [], trustBadges: [], footer: {} };

async function loadSiteContent() {
  ADMIN_SETTINGS = await api.getSettings();
  if (!ADMIN_SETTINGS.banners) ADMIN_SETTINGS.banners = [];
  if (!ADMIN_SETTINGS.trustBadges) ADMIN_SETTINGS.trustBadges = [];
  if (!ADMIN_SETTINGS.footer) ADMIN_SETTINGS.footer = { about: [], help: [], policy: [], social: {}, copyrightYear: "2026" };
  renderAdminBanners();
  renderTrustBadgeEditor();
  populateFooterEditor();
}

function renderAdminBanners() {
  const body = document.getElementById("admin-banners-body");
  if (!ADMIN_SETTINGS.banners.length) {
    body.innerHTML = `<tr><td colspan="5" style="color:var(--muted);">No banners yet.</td></tr>`;
    return;
  }
  body.innerHTML = ADMIN_SETTINGS.banners
    .map(
      (b) => `
    <tr>
      <td><img src="${b.image}" alt="${b.eyebrow}" /></td>
      <td>${b.eyebrow}</td>
      <td>${b.title.replace("|", " ")}</td>
      <td>${b.buttonText}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline" onclick='openBannerForm(${JSON.stringify(b.id)})'>Edit</button>
          <button class="btn btn-danger" onclick='deleteBanner(${JSON.stringify(b.id)})'>Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function openBannerForm(id) {
  const modal = document.getElementById("banner-modal");
  const form = document.getElementById("banner-form");
  form.reset();
  document.getElementById("bf-id").value = "";
  document.getElementById("banner-modal-title").textContent = id ? "Edit banner" : "Add banner";

  if (id) {
    const b = ADMIN_SETTINGS.banners.find((x) => x.id === id);
    if (b) {
      const [line1, line2] = b.title.split("|");
      document.getElementById("bf-id").value = b.id;
      document.getElementById("bf-eyebrow").value = b.eyebrow;
      document.getElementById("bf-title1").value = line1 || "";
      document.getElementById("bf-title2").value = line2 || "";
      document.getElementById("bf-subtitle").value = b.subtitle;
      document.getElementById("bf-highlight").value = b.highlight;
      document.getElementById("bf-btn-text").value = b.buttonText;
      document.getElementById("bf-btn-link").value = b.buttonLink;
      document.getElementById("bf-image").value = b.image;
      document.getElementById("bf-bg-from").value = b.bgFrom;
      document.getElementById("bf-bg-to").value = b.bgTo;
    }
  } else {
    document.getElementById("bf-bg-from").value = "#0f6e57";
    document.getElementById("bf-bg-to").value = "#0a3d2e";
  }
  modal.style.display = "flex";
}

function closeBannerForm() {
  document.getElementById("banner-modal").style.display = "none";
}

async function handleBannerFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("bf-id").value;
  const line1 = document.getElementById("bf-title1").value.trim();
  const line2 = document.getElementById("bf-title2").value.trim();

  const bannerData = {
    id: id || "b" + Date.now().toString(36),
    eyebrow: document.getElementById("bf-eyebrow").value.trim(),
    title: line2 ? `${line1}|${line2}` : line1,
    subtitle: document.getElementById("bf-subtitle").value.trim(),
    highlight: document.getElementById("bf-highlight").value.trim(),
    buttonText: document.getElementById("bf-btn-text").value.trim(),
    buttonLink: document.getElementById("bf-btn-link").value.trim() || "#catalog",
    image: document.getElementById("bf-image").value.trim() || "https://placehold.co/600x600?text=Banner",
    bgFrom: document.getElementById("bf-bg-from").value.trim() || "#0f6e57",
    bgTo: document.getElementById("bf-bg-to").value.trim() || "#0a3d2e",
  };

  if (id) {
    const idx = ADMIN_SETTINGS.banners.findIndex((b) => b.id === id);
    if (idx !== -1) ADMIN_SETTINGS.banners[idx] = bannerData;
  } else {
    ADMIN_SETTINGS.banners.push(bannerData);
  }

  await api.saveSettings(ADMIN_SETTINGS);
  showToast(id ? "Banner updated" : "Banner added");
  closeBannerForm();
  renderAdminBanners();
}

async function deleteBanner(id) {
  if (!confirm("Delete this banner?")) return;
  ADMIN_SETTINGS.banners = ADMIN_SETTINGS.banners.filter((b) => b.id !== id);
  await api.saveSettings(ADMIN_SETTINGS);
  showToast("Banner deleted");
  renderAdminBanners();
}

function renderTrustBadgeEditor() {
  const el = document.getElementById("trust-badge-editor");
  el.innerHTML = ADMIN_SETTINGS.trustBadges
    .map(
      (b, i) => `
    <div class="form-group full" style="border:1px solid var(--border); border-radius:var(--radius); padding:12px;">
      <label>Badge ${i + 1} — icon (shield / truck / refresh / headset)</label>
      <input type="text" value="${b.icon}" onchange="updateTrustBadge(${i}, 'icon', this.value)" style="margin-bottom:8px;" />
      <label>Title</label>
      <input type="text" value="${b.title}" onchange="updateTrustBadge(${i}, 'title', this.value)" style="margin-bottom:8px;" />
      <label>Subtitle</label>
      <input type="text" value="${b.subtitle}" onchange="updateTrustBadge(${i}, 'subtitle', this.value)" />
    </div>`
    )
    .join("");
}

function updateTrustBadge(index, field, value) {
  ADMIN_SETTINGS.trustBadges[index][field] = value;
}

async function saveTrustBadges() {
  await api.saveSettings(ADMIN_SETTINGS);
  showToast("Trust badges saved");
}

function linksToText(links) {
  return (links || []).map((l) => `${l.label} | ${l.url}`).join("\n");
}

function textToLinks(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      return { label: label || line, url: url || "#" };
    });
}

function populateFooterEditor() {
  const f = ADMIN_SETTINGS.footer;
  document.getElementById("footer-about").value = linksToText(f.about);
  document.getElementById("footer-help").value = linksToText(f.help);
  document.getElementById("footer-policy").value = linksToText(f.policy);
  document.getElementById("footer-facebook").value = (f.social && f.social.facebook) || "";
  document.getElementById("footer-twitter").value = (f.social && f.social.twitter) || "";
  document.getElementById("footer-instagram").value = (f.social && f.social.instagram) || "";
  document.getElementById("footer-youtube").value = (f.social && f.social.youtube) || "";
  document.getElementById("footer-year").value = f.copyrightYear || "2026";
}

async function saveFooterSettings() {
  ADMIN_SETTINGS.footer = {
    about: textToLinks(document.getElementById("footer-about").value),
    help: textToLinks(document.getElementById("footer-help").value),
    policy: textToLinks(document.getElementById("footer-policy").value),
    social: {
      facebook: document.getElementById("footer-facebook").value.trim() || "#",
      twitter: document.getElementById("footer-twitter").value.trim() || "#",
      instagram: document.getElementById("footer-instagram").value.trim() || "#",
      youtube: document.getElementById("footer-youtube").value.trim() || "#",
    },
    copyrightYear: document.getElementById("footer-year").value.trim() || "2026",
  };
  await api.saveSettings(ADMIN_SETTINGS);
  showToast("Footer saved");
}

// ---------------- Init ----------------
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    showAdminApp();
  }
  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);
  document.getElementById("banner-form").addEventListener("submit", handleBannerFormSubmit);
  document.getElementById("admin-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") attemptLogin();
  });
});
