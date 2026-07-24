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
      throw err;
    });

  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
  const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({}, { strict: false }));
  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Setting = mongoose.models.Setting || mongoose.model("Setting", new mongoose.Schema({}, { strict: false }));

  mongoReady = connected.then(() => ({ Product, Order, User, Setting }));
  return mongoReady;
}

// Seed MongoDB from the bundled db.json the FIRST time it's empty
// (so the live site starts with the same 164 products, banners, etc.
// instead of an empty database).
async function seedIfEmpty(models) {
  const count = await models.Product.countDocuments();
  if (count > 0) return;
  const seed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  if (seed.products?.length) await models.Product.insertMany(seed.products);
  if (seed.orders?.length) await models.Order.insertMany(seed.orders);
  if (seed.users?.length) await models.User.insertMany(seed.users);
  if (seed.settings) await models.Setting.create({ key: "site", value: seed.settings });
  console.log("Seeded MongoDB with initial products/orders/users/settings from db.json.");
}

const mongoDb = {
  async getProducts() {
    const m = await initMongo();
    await seedIfEmpty(m);
    return m.Product.find({}, { _id: 0, __v: 0 }).lean();
  },
  async saveProducts(products) {
    const m = await initMongo();
    await m.Product.deleteMany({});
    if (products.length) await m.Product.insertMany(products);
  },
  async getOrders() {
    const m = await initMongo();
    return m.Order.find({}, { _id: 0, __v: 0 }).lean();
  },
  async saveOrders(orders) {
    const m = await initMongo();
    await m.Order.deleteMany({});
    if (orders.length) await m.Order.insertMany(orders);
  },
  async getUsers() {
    const m = await initMongo();
    return m.User.find({}, { _id: 0, __v: 0 }).lean();
  },
  async saveUsers(users) {
    const m = await initMongo();
    await m.User.deleteMany({});
    if (users.length) await m.User.insertMany(users);
  },
  async getSettings() {
    const m = await initMongo();
    await seedIfEmpty(m);
    const doc = await m.Setting.findOne({ key: "site" }).lean();
    return doc?.value || {};
  },
  async saveSettings(settings) {
    const m = await initMongo();
    await m.Setting.findOneAndUpdate({ key: "site" }, { key: "site", value: settings }, { upsert: true });
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
