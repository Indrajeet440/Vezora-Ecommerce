# Vezora — Everything You Need, All in One Place

A full single-vendor e-commerce website: multi-category catalog, search, filters & sorting, product galleries, cart, checkout, order history, real user accounts, and a complete admin panel — with a working frontend, backend, and database.

## Why it runs with zero setup

This project ships with a **JSON-file database** that behaves exactly like a document database (the same shape as a MongoDB collection) so that:

- Nobody needs to install MongoDB, create an Atlas account, or set up Firebase to run this project.
- Every product/order/user record is a JSON document, identical in structure to what you'd store in MongoDB or Firestore.
- Swapping in real MongoDB later is a small, contained change (see `MONGODB_SETUP.md`) — nothing else in the project needs to change.

The backend also uses **only Node's built-in `http` module** (no Express, no `npm install` required), so it runs immediately even on a machine with no internet access.

## What's in the catalog

**164 products across 8 categories**: Mobiles, Electronics, Fashion, Home & Kitchen, Beauty & Personal Care, Books, Toys & Baby, and Sports & Fitness — built from ~70 base products expanded with real variants (colors, formats, sizes). Every product has its own set of 4 gallery images (Front / Side / Top / Back view).

## Features

| Feature | Where it lives |
|---|---|
| Product listing with image, price, category, description | `index.html` + `js/products.js` (search, category filters, sort by price/rating) |
| Product detail page with a Front/Side/Top/Back image gallery (click thumbnails or use the left/right arrows), specs, availability | `product.html` + `js/product-detail.js` |
| Add to cart with quantity selection | product page + `cart.add()` in `js/app.js` |
| Cart management (increase/decrease qty, remove) | `cart.html` + `js/cart-page.js` |
| Checkout (delivery details + order summary) | `checkout.html` + `js/checkout.js` |
| Order history, tied to your account when logged in | `orders.html` + `js/orders.js` |
| Printable invoice per order (logo, itemized table, totals) | `invoice.html` + `js/invoice.js`, linked from the Orders page |
| **Real user accounts** — signup/login/logout | header "Login" button on every page, backed by `/api/auth/signup` and `/api/auth/login` |
| Admin: add/edit/delete products (including the 4-image gallery), view & update orders | `admin/admin.html` + `js/admin.js` |
| **Admin: homepage banner carousel** — add/edit/delete banners, left/right arrows + dots on the homepage | `admin/admin.html` ("Site Content" tab) + `js/products.js` (`renderBanners`, `moveBanner`) |
| **Admin: editable footer** — About/Help/Policy links, social URLs, copyright year | `admin/admin.html` ("Site Content" tab) + `js/app.js` (`renderFooter`) |
| Database (products, users, orders, site settings) | `backend/db.js` + `backend/data/db.json` |
| Responsive design (mobile/tablet/desktop) | `css/style.css` |
| Light green theme (default) + dark mode toggle | moon/sun button in the header — remembered per browser |
| Wishlist icon with hover tooltip | heart icon on every product card and on the product detail page |
| Quick view popup | eye icon on every product card opens an in-page modal (image, price, rating, key specs, add to cart) without leaving the grid |

## Accounts

**Admin panel:** `http://localhost:3000/admin/admin.html` — password: `Omega@143P`

The admin panel has three tabs:
- **Products** — add/edit/delete products, including all 4 gallery images (Front/Side/Top/Back view) per product.
- **Orders** — view every order placed and update its status.
- **Site Content** — add/edit/delete homepage banners (the carousel at the top of the store, with left/right arrows and dots), edit the 4 trust badges shown just below it, and edit the footer (About/Help/Policy links, social media URLs, copyright year).

**Customer accounts:** click **Login** in the header of the store to sign up or log in. This is real authentication — passwords are hashed and salted (`crypto.scryptSync`) and stored in the database, never in plain text. Once logged in:
- Checkout auto-fills your name and email.
- "My Orders" pulls your order history from your account instead of just this browser.
- The header shows "Hi, `<name>`" with a dropdown for My Orders / Logout.

Guest checkout still works without an account — those orders are tracked locally in the browser that placed them.

- **Category strip** now shows real category photos (not emoji) as small circular thumbnails, and sits right below the header/logo, above the hero banner.
- **Wishlist** has its own page (`wishlist.html`), linked from the header next to Cart, with a live count badge.
- **Search bar** has three real, working icons: type-to-search, a microphone for voice search (Web Speech API — works in Chrome/Edge), and a camera icon that opens your camera/gallery (image recognition itself isn't wired up yet, so it prompts you to describe the item in words for now).
- **Footer links** open an info popup with real content for each item (About, Payments, Returns, etc.) instead of doing nothing.

## Design notes

- Visual identity: light **green** theme by default, with a full **dark mode** toggle. Both are premium-styled — deep emerald header, gold call-to-action buttons.
- **Brand logo** is integrated everywhere: navbar (all pages + admin), browser favicon, a one-per-session splash screen animation, the login/signup modal, the footer (left-side brand block), and every invoice.
- Every product card shows a distinct image, a green rating badge, and a discount tag. Hovering a card reveals a wishlist (heart) and quick view (eye) icon, each with its own hover tooltip label.
- Every product has its own 4-image gallery (Front / Side / Top / Back view) with clickable thumbnails **and left/right arrows** on the detail page.
- Homepage hero is a 4-slide banner carousel (left/right arrows + dots + autoplay), including a custom illustrated banner (phone, smartwatch, shopping bag with the Vezora mark, and headphones) built as an SVG.
- **Invoices**: every order gets a printable invoice (logo, itemized table, totals) — open it from "Download Invoice" on the Orders page, then use the in-page "Print / Save as PDF" button (browser print-to-PDF).
- Cart and wishlist persist in the browser's `localStorage`; orders and accounts are written to the backend/database.

## Logo assets

All logo files live in `frontend/assets/`:
- `logo-icon.png` — the "V" mark only, used in the navbar and as the favicon source.
- `logo-full.png` — the full lockup ("VEZORA — All in One Place"), used in the footer, splash screen, login modal, and invoices.
- `favicon-16.png` / `favicon-32.png` / `favicon-64.png` — pre-sized favicons.
- `hero-banner-art.svg` — the custom illustrated banner graphic for the homepage hero.

To swap the logo later, replace these files (keep the same names) — every page picks them up automatically, nothing else needs to change.

## Folder structure

```
ecommerce-project/
├── backend/
│   ├── server.js          # HTTP server + REST API (auth, products, orders)
│   ├── db.js               # Data-access layer (swap this for real MongoDB)
│   ├── package.json
│   └── data/
│       └── db.json         # The database — products, orders, and users collections
├── frontend/
│   ├── index.html          # Homepage: hero banner, category strip, filters, sort, full grid
│   ├── product.html         # Product detail page (image gallery, rating, specs, qty selector)
│   ├── cart.html            # Cart management
│   ├── checkout.html        # Checkout (delivery details + order summary)
│   ├── orders.html          # Order history
│   ├── admin/
│   │   └── admin.html       # Admin panel (products + orders)
│   ├── css/style.css
│   └── js/
│       ├── app.js           # Shared: API calls, cart, wishlist, theme, auth + login/signup modal
│       ├── products.js      # Homepage: category strip, filters, sort, search, grid, quick view
│       ├── product-detail.js
│       ├── cart-page.js
│       ├── checkout.js
│       ├── orders.js
│       └── admin.js
├── MONGODB_SETUP.md         # How to switch to real MongoDB/Firestore
└── README.md
```

## How to run it

1. Install [Node.js](https://nodejs.org) (v16+) if you don't have it.
2. Open a terminal **inside the `backend/` folder** (this is the most common mistake — the command below only works from inside `backend/`, not from the project root).
   ```
   cd ecommerce-project/backend
   ```
3. Run:
   ```
   node server.js
   ```
   You should see:
   ```
   Vezora E-Commerce server running:
     Store:  http://localhost:3000
     Admin:  http://localhost:3000/admin/admin.html
   ```
4. Open your browser at **http://localhost:3000**

No `npm install` step is needed. If you'd rather use `npm start`, that works too (see `backend/package.json`).

## API reference

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create an account `{name, email, password}` |
| `/api/auth/login` | POST | Log in `{email, password}` |
| `/api/products` | GET | List all products |
| `/api/products/:id` | GET | Get one product |
| `/api/products` | POST | Create a product (admin) |
| `/api/products/:id` | PUT / DELETE | Update / delete a product (admin) |
| `/api/orders` | GET | List orders (add `?userId=` to filter to one account) |
| `/api/orders` | POST | Place an order |
| `/api/orders/:id` | PUT | Update order status (admin) |

## Next steps if you want to extend this further

- Move session handling to signed, expiring tokens with a proper `Authorization` header check on protected routes (current tokens are issued at login but not yet required on every request).
- Add image upload (currently products use hosted image URLs) via multer or a cloud storage bucket.
- Add a real payment gateway integration (Razorpay/Stripe) at checkout.
- Move the admin password check to the backend instead of the current client-side gate.
- Swap the JSON file for real MongoDB/Firestore — see `MONGODB_SETUP.md`.
