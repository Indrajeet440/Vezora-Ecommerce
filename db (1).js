/**
 * db.js
 * ------------------------------------------------------------------
 * Hybrid data layer:
 *  - If a MONGODB_URI environment variable is set, all data is stored
 *    in real MongoDB (persists across restarts/redeploys — use this
 *    in production, e.g. on Render).
 *  - If MONGODB_URI is NOT set, data falls back to the local db.json
 *    file (zero setup, works with no internet — use this for local
 *    development/grading on a laptop).
 *
 * Every function returns a Promise either way, so callers always
 * use `await db.xxx()`.
 *
 * MongoDB storage design: each collection (products, orders, users,
 * settings) is stored as ONE document {key, value} in a single
 * "Store" collection, where `value` holds the entire array/object.
 * This is deliberately simple (one fast read/write per call, no
 * bulk per-item operations) so it stays reliable on a free-tier
 * MongoDB cluster.
 * ------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");
const MONGODB_URI = process.env.MONGODB_URI;

// ==================================================================
// MODE 1: MongoDB (used automatically when MONGODB_URI is set)
// ==================================================================
let mongoReady = null;

function initMongo() {
  if (mongoReady) return mongoReady;
  const mongoose = require("mongoose");

  const connected = mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB — data will persist across restarts."))
    .catch((err) => {
      console.error("MongoDB connection failed, check MONGODB_URI:", err.message);
      mongoReady = null; // allow a retry on the next call instead of staying broken forever
      throw err;
    });

  const Store =
    mongoose.models.Store ||
    mongoose.model("Store", new mongoose.Schema({ key: String, value: mongoose.Schema.Types.Mixed }, { strict: false }));

  mongoReady = connected.then(() => ({ Store }));
  return mongoReady;
}

async function getValue(key, fallback) {
  const { Store } = await initMongo();
  const doc = await Store.findOne({ key }).lean();
  return doc ? doc.value : fallback;
}

async function setValue(key, value) {
  const { Store } = await initMongo();
  await Store.findOneAndUpdate({ key }, { key, value }, { upsert: true });
}

// Seed MongoDB from the bundled db.json the FIRST time it's empty
// (so the live site starts with the same 164 products, banners, etc.
// instead of an empty database).
let seedChecked = false;

async function seedIfEmpty() {
  if (seedChecked) return;
  seedChecked = true;
  const { Store } = await initMongo();
  const existing = await Store.findOne({ key: "products" }).lean();
  if (existing) return;

  const seed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  await Store.findOneAndUpdate({ key: "products" }, { key: "products", value: seed.products || [] }, { upsert: true });
  await Store.findOneAndUpdate({ key: "orders" }, { key: "orders", value: seed.orders || [] }, { upsert: true });
  await Store.findOneAndUpdate({ key: "users" }, { key: "users", value: seed.users || [] }, { upsert: true });
  await Store.findOneAndUpdate({ key: "settings" }, { key: "settings", value: seed.settings || {} }, { upsert: true });
  console.log("Seeded MongoDB with initial products/orders/users/settings from db.json.");
}

const mongoDb = {
  async getProducts() {
    await seedIfEmpty();
    return (await getValue("products", [])) || [];
  },
  async saveProducts(products) {
    await setValue("products", products);
  },
  async getOrders() {
    await seedIfEmpty();
    return (await getValue("orders", [])) || [];
  },
  async saveOrders(orders) {
    await setValue("orders", orders);
  },
  async getUsers() {
    await seedIfEmpty();
    return (await getValue("users", [])) || [];
  },
  async saveUsers(users) {
    await setValue("users", users);
  },
  async getSettings() {
    await seedIfEmpty();
    return (await getValue("settings", {})) || {};
  },
  async saveSettings(settings) {
    await setValue("settings", settings);
  },
};

// ==================================================================
// MODE 2: Local JSON file (used when MONGODB_URI is not set)
// ==================================================================
function readDb() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

const fileDb = {
  async getProducts() {
    return readDb().products;
  },
  async saveProducts(products) {
    const data = readDb();
    data.products = products;
    writeDb(data);
  },
  async getOrders() {
    return readDb().orders;
  },
  async saveOrders(orders) {
    const data = readDb();
    data.orders = orders;
    writeDb(data);
  },
  async getUsers() {
    const data = readDb();
    return data.users || [];
  },
  async saveUsers(users) {
    const data = readDb();
    data.users = users;
    writeDb(data);
  },
  async getSettings() {
    const data = readDb();
    return data.settings || {};
  },
  async saveSettings(settings) {
    const data = readDb();
    data.settings = settings;
    writeDb(data);
  },
};

module.exports = MONGODB_URI ? mongoDb : fileDb;
