# Switching to real MongoDB (or Firestore)

This project currently stores data in `backend/data/db.json` through the functions in `backend/db.js`. Because `server.js` only ever calls `db.getProducts()`, `db.saveProducts()`, `db.getOrders()`, and `db.saveOrders()`, you can swap the database underneath without touching `server.js` at all.

## Option A: MongoDB (using Mongoose)

1. Install dependencies (needs internet access):
   ```
   npm install mongoose
   ```
2. Create a free cluster at https://www.mongodb.com/cloud/atlas and copy your connection string.
3. Replace the contents of `backend/db.js` with:

```js
const mongoose = require("mongoose");

mongoose.connect("YOUR_MONGODB_CONNECTION_STRING");

const productSchema = new mongoose.Schema({
  id: String, name: String, category: String, price: Number, mrp: Number,
  shortDescription: String, description: String, specs: Object,
  image: String, stock: Number, featured: Boolean,
});
const orderSchema = new mongoose.Schema({
  id: String, userId: String, items: Array, customer: Object, total: Number,
  status: String, createdAt: String,
});
const userSchema = new mongoose.Schema({
  id: String, name: String, email: String, salt: String, passwordHash: String,
  token: String, createdAt: String,
});

const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const User = mongoose.model("User", userSchema);

module.exports = {
  async getProducts() { return Product.find({}); },
  async saveProducts(products) {
    await Product.deleteMany({});
    await Product.insertMany(products);
  },
  async getOrders() { return Order.find({}); },
  async saveOrders(orders) {
    await Order.deleteMany({});
    await Order.insertMany(orders);
  },
  async getUsers() { return User.find({}); },
  async saveUsers(users) {
    await User.deleteMany({});
    await User.insertMany(users);
  },
};
```

4. In `server.js`, add `await` before each `db.getProducts()`, `db.saveProducts()`, `db.getOrders()`, `db.saveOrders()` call (they'll now return Promises).

## Option B: Firebase Firestore

1. Install dependencies:
   ```
   npm install firebase-admin
   ```
2. Create a Firestore project at https://console.firebase.google.com and download a service account key JSON.
3. Replace `backend/db.js` with a version that reads/writes the `products` and `orders` collections using `firebase-admin`'s `.collection().get()` / `.doc().set()` methods, following the same four function names.

## Why the JSON-file version is worth keeping for now

- It requires zero setup and no internet connection, so grading/demoing never breaks over an expired free-tier cluster or a missing `.env` file.
- The data shape (`{ id, name, category, price, ... }` documents in a flat array) is intentionally identical to what you'd store as MongoDB/Firestore documents, so migrating later is a copy-paste job, not a redesign.
