/**
 * server.js
 * ------------------------------------------------------------------
 * Single-Vendor E-Commerce backend.
 * Built with Node's built-in http module only — no "npm install"
 * required. Run with:  node server.js
 * Then open:           http://localhost:3000
 * Admin panel:         http://localhost:3000/admin/admin.html
 * ------------------------------------------------------------------
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./db");

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(FRONTEND_DIR, urlPath);

  // Prevent path traversal outside the frontend directory
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end("<h1>404 - Page not found</h1>");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsedUrl = new URL(req.url, "http://localhost");
  const url = parsedUrl.pathname;
  const query = parsedUrl.searchParams;

  // CORS preflight
  if (method === "OPTIONS") {
    return sendJSON(res, 204, {});
  }

  // ---------- API: AUTH ----------
  if (url === "/api/auth/signup" && method === "POST") {
    try {
      const body = await readBody(req);
      const name = (body.name || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";

      if (!name || !email || !password) {
        return sendJSON(res, 400, { error: "Name, email and password are required" });
      }
      if (password.length < 6) {
        return sendJSON(res, 400, { error: "Password must be at least 6 characters" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJSON(res, 400, { error: "Enter a valid email address" });
      }

      const users = db.getUsers();
      if (users.find((u) => u.email === email)) {
        return sendJSON(res, 409, { error: "An account with this email already exists" });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
      const token = crypto.randomBytes(24).toString("hex");

      const newUser = {
        id: "u" + crypto.randomBytes(4).toString("hex"),
        name,
        email,
        salt,
        passwordHash,
        token,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      db.saveUsers(users);

      return sendJSON(res, 201, { id: newUser.id, name: newUser.name, email: newUser.email, token: newUser.token });
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request" });
    }
  }

  if (url === "/api/auth/login" && method === "POST") {
    try {
      const body = await readBody(req);
      const email = (body.email || "").trim().toLowerCase();
      const password = body.password || "";

      const users = db.getUsers();
      const user = users.find((u) => u.email === email);
      if (!user) {
        return sendJSON(res, 401, { error: "Incorrect email or password" });
      }

      const attemptHash = crypto.scryptSync(password, user.salt, 64).toString("hex");
      const storedHash = Buffer.from(user.passwordHash, "hex");
      const attemptBuf = Buffer.from(attemptHash, "hex");
      const isMatch = storedHash.length === attemptBuf.length && crypto.timingSafeEqual(storedHash, attemptBuf);

      if (!isMatch) {
        return sendJSON(res, 401, { error: "Incorrect email or password" });
      }

      // Rotate the session token on each login
      user.token = crypto.randomBytes(24).toString("hex");
      db.saveUsers(users);

      return sendJSON(res, 200, { id: user.id, name: user.name, email: user.email, token: user.token });
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request" });
    }
  }

  // ---------- API: SETTINGS (banners, trust badges, footer) ----------
  if (url === "/api/settings" && method === "GET") {
    return sendJSON(res, 200, db.getSettings());
  }

  if (url === "/api/settings" && method === "PUT") {
    try {
      const body = await readBody(req);
      db.saveSettings(body);
      return sendJSON(res, 200, body);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid request" });
    }
  }

  // ---------- API: PRODUCTS ----------
  if (url === "/api/products" && method === "GET") {
    return sendJSON(res, 200, db.getProducts());
  }

  if (url.match(/^\/api\/products\/[\w-]+$/) && method === "GET") {
    const id = url.split("/").pop();
    const product = db.getProducts().find((p) => p.id === id);
    if (!product) return sendJSON(res, 404, { error: "Product not found" });
    return sendJSON(res, 200, product);
  }

  if (url === "/api/products" && method === "POST") {
    try {
      const body = await readBody(req);
      if (!body.name || body.price == null) {
        return sendJSON(res, 400, { error: "name and price are required" });
      }
      const products = db.getProducts();
      const newProduct = {
        id: "p" + crypto.randomBytes(4).toString("hex"),
        name: body.name,
        category: body.category || "Uncategorised",
        price: Number(body.price),
        mrp: Number(body.mrp || body.price),
        discount: body.mrp && body.mrp > body.price ? Math.round(((body.mrp - body.price) / body.mrp) * 100) : 0,
        rating: Number(body.rating) || 4.0,
        reviews: Number(body.reviews) || 0,
        shortDescription: body.shortDescription || "",
        description: body.description || "",
        specs: body.specs || {},
        image: body.image || "https://placehold.co/600x600?text=Product",
        images: body.images && body.images.length ? body.images : [body.image || "https://placehold.co/600x600?text=Product"],
        imageLabels: body.imageLabels && body.imageLabels.length ? body.imageLabels : ["Front View", "Side View", "Top View", "Back View"],
        stock: Number(body.stock || 0),
        featured: !!body.featured,
      };
      products.push(newProduct);
      db.saveProducts(products);
      return sendJSON(res, 201, newProduct);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid JSON body" });
    }
  }

  if (url.match(/^\/api\/products\/[\w-]+$/) && method === "PUT") {
    try {
      const id = url.split("/").pop();
      const body = await readBody(req);
      const products = db.getProducts();
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return sendJSON(res, 404, { error: "Product not found" });
      products[idx] = { ...products[idx], ...body, id };
      db.saveProducts(products);
      return sendJSON(res, 200, products[idx]);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid JSON body" });
    }
  }

  if (url.match(/^\/api\/products\/[\w-]+$/) && method === "DELETE") {
    const id = url.split("/").pop();
    const products = db.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) {
      return sendJSON(res, 404, { error: "Product not found" });
    }
    db.saveProducts(filtered);
    return sendJSON(res, 200, { success: true });
  }

  // ---------- API: ORDERS ----------
  if (url === "/api/orders" && method === "GET") {
    const userId = query.get("userId");
    const all = db.getOrders();
    const filtered = userId ? all.filter((o) => o.userId === userId) : all;
    return sendJSON(res, 200, filtered);
  }

  if (url === "/api/orders" && method === "POST") {
    try {
      const body = await readBody(req);
      if (!body.items || !body.items.length || !body.customer) {
        return sendJSON(res, 400, { error: "items and customer are required" });
      }
      const orders = db.getOrders();
      const newOrder = {
        id: "ORD" + Date.now().toString().slice(-8),
        userId: body.userId || null,
        items: body.items,
        customer: body.customer,
        total: body.items.reduce((sum, it) => sum + it.price * it.qty, 0),
        status: "Placed",
        createdAt: new Date().toISOString(),
      };
      orders.push(newOrder);
      db.saveOrders(orders);

      // Decrease stock for ordered items
      const products = db.getProducts();
      newOrder.items.forEach((it) => {
        const p = products.find((pr) => pr.id === it.productId);
        if (p) p.stock = Math.max(0, p.stock - it.qty);
      });
      db.saveProducts(products);

      return sendJSON(res, 201, newOrder);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid JSON body" });
    }
  }

  if (url.match(/^\/api\/orders\/[\w-]+$/) && method === "PUT") {
    try {
      const id = url.split("/").pop();
      const body = await readBody(req);
      const orders = db.getOrders();
      const idx = orders.findIndex((o) => o.id === id);
      if (idx === -1) return sendJSON(res, 404, { error: "Order not found" });
      orders[idx] = { ...orders[idx], ...body, id };
      db.saveOrders(orders);
      return sendJSON(res, 200, orders[idx]);
    } catch (e) {
      return sendJSON(res, 400, { error: "Invalid JSON body" });
    }
  }

  // ---------- STATIC FRONTEND ----------
  if (url.startsWith("/api/")) {
    return sendJSON(res, 404, { error: "Unknown API route" });
  }
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\nVezora E-Commerce server running:`);
  console.log(`  Store:  http://localhost:${PORT}`);
  console.log(`  Admin:  http://localhost:${PORT}/admin/admin.html\n`);
});
