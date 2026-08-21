# Karaz Flowers — E-commerce Backend

Production backend for a UAE flower e-commerce store, built with Node.js, Express, and MariaDB (via Prisma). Sample/reference project (domain `luxefloraluae`, modeled after karazflowers.ae).

## Tech Stack

- Node.js 18+, Express 4
- Prisma ORM → MariaDB
- JWT auth (access token + rotating refresh token)
- Stripe (card payments) + Cash on Delivery
- Image uploads via multer — local disk by default, or Cloudinary (optimized + CDN-served) when `CLOUDINARY_*` env vars are set
- nodemailer (SMTP) for transactional email
- Winston logging, PM2 for process management

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in real values (database credentials, JWT secrets, Stripe keys, SMTP credentials).

```bash
cp .env.example .env
```

Generate strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, e.g.:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Set up the database

Needs a running MariaDB/MySQL server. For local development, XAMPP's bundled MariaDB works fine — start the **MySQL** module from the XAMPP Control Panel (Apache is not required, this API has its own server), then create the database and a user matching `DATABASE_URL`, e.g. via phpMyAdmin or the MySQL CLI:

```sql
CREATE DATABASE karaz_flowers;
CREATE USER 'karaz_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON karaz_flowers.* TO 'karaz_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run:

```bash
npm run prisma:generate
npm run prisma:migrate   # creates and applies migrations (development)
npm run seed              # creates the first Super Admin, default settings, sample catalog
```

The seeded Super Admin credentials come from `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` in `.env` — change the password immediately after first login in production.

### 4. Run the server

```bash
npm run dev     # development, with nodemon
npm start       # production
```

The API is served under `API_PREFIX` (default `/api/v1`). Health check: `GET /health`.

## Project Structure

```
prisma/               Prisma schema + seed script
src/
  config/              env, Prisma client, logger, multer, Stripe, mailer
  modules/             one folder per domain (auth, products, orders, coupons, ...)
    <module>.routes.js         storefront routes  → /api/v1/<module>
    <module>.admin.routes.js   admin routes        → /api/v1/admin/<module>
    <module>.controller.js / .service.js / .validation.js
  middlewares/         auth, error handling, rate limiting, validation, uploads
  utils/               ApiError, ApiResponse, pagination, coupon engine, tokens, ...
  routes/              v1.routes.js + admin.routes.js aggregators
  app.js / server.js   Express app wiring + HTTP bootstrap
uploads/               product/category/banner/avatar images (gitignored, keep folders)
logs/                  Winston log output (gitignored)
```

Every module keeps storefront and admin concerns in separate route/controller files while sharing the same service layer — admin APIs live under `/api/v1/admin/*`, gated by `protect` + `restrictTo('ADMIN', 'SUPER_ADMIN')` and a stricter rate limiter.

## Coupon System

Admins create coupons (`POST /api/v1/admin/coupons`) with a code, discount type/value, optional min order amount, optional global usage limit, and a **required expiry date**. Business rules (enforced in `src/utils/couponEngine.js`, shared by the cart-apply endpoint and order placement so both can never drift apart):

- An expired or deactivated coupon is rejected automatically the moment it's checked — no cron job needed.
- Each coupon can be used at most `usageLimitPerUser` times (default 1) by the same **person**, matched by account id, email, **or** phone number — so a guest checkout or a second account with the same contact details can't reuse it.
- Usage is only recorded when an order is actually placed, inside the same database transaction as stock decrement and order creation, with a re-validation step that closes the race window on concurrent double-submits.

## Guest Checkout

Carts support both logged-in users and guests (identified by a client-generated `x-cart-session` header). Orders can be placed without an account by supplying `guestEmail`/`guestPhone`; every order stores a denormalized `customerEmail`/`customerPhone` regardless of account status, which is what coupon usage matching relies on.

## Frontend Integration

Handing this API to a frontend developer? Send them [`docs/API_INTEGRATION_GUIDE.md`](./docs/API_INTEGRATION_GUIDE.md) — auth flow, every endpoint with request/response examples, the guest-cart session header, checkout sequence, and Stripe wiring — plus [`docs/postman_collection.json`](./docs/postman_collection.json), a ready-to-import Postman collection covering all ~99 requests with auto-saving login tokens.

## Client Catalog Handoff

[`data-import/`](./data-import/) has the spreadsheet template and instructions guide for collecting the client's product catalog (names, prices, descriptions, categories, photos) in one structured batch instead of manual admin entry.

## Contributing / Branch Workflow

`main` is a protected branch: no direct pushes, and merging requires a pull request with at least one approving review (the repo owner can still push directly in an emergency, but shouldn't by default). Standard flow for any change, including frontend-driven backend changes:

```bash
git checkout main && git pull
git checkout -b feature/short-description
# ...make changes, commit...
git push -u origin feature/short-description
```

Then open a pull request into `main` on GitHub and request a review. Squash-merge once approved.

## Deployment

### Option A — PM2 on a VPS

```bash
npm ci --omit=dev
npx prisma migrate deploy
npx prisma generate
pm2 start ecosystem.config.js
```

Put Nginx (or similar) in front to terminate TLS, proxy to `PORT`, and serve/cache `/uploads` if desired.

### Option B — Docker

```bash
docker compose up -d --build
```

This starts the API plus a MariaDB container. For a managed database, drop the `db` service and point `DATABASE_URL` at it instead.

### Stripe Webhook

Configure a webhook endpoint at `POST https://<your-domain>/webhooks/stripe` for `payment_intent.succeeded` and `payment_intent.payment_failed`, and set `STRIPE_WEBHOOK_SECRET` accordingly. This route is registered before the JSON body parser (it needs the raw body for signature verification) — see `src/app.js`.

## Smoke Test Checklist

1. `GET /health` → 200 OK
2. `POST /api/v1/auth/register` → returns access token + sets refresh cookie
3. `GET /api/v1/products` → paginated catalog
4. `POST /api/v1/cart/items` → add a product to cart
5. `POST /api/v1/cart/coupon` with `WELCOME10` → discount applied
6. Re-apply the same coupon as the same user/email → rejected ("already used")
7. Wait past a coupon's `expiresAt` (or create one already expired) → apply attempt rejected
8. `POST /api/v1/orders` with `paymentMethod: "COD"` → order created, stock decremented, cart cleared
9. Log in as the seeded Super Admin, `PATCH /api/v1/admin/orders/:id/status` → status transitions + email fired
10. `POST /api/v1/admin/coupons` with a past `expiresAt` → validation rejects it (expiry must be in the future on creation)

## Linting

```bash
npm run lint
npm run format
```
