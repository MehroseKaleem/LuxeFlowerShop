# Luxeflower — Frontend

Customer storefront + admin panel for Luxeflower, a UAE flower delivery shop. Built with Angular 20 (standalone components, signals, SSR-scaffolded but running as pure client-side rendering + hydration).

## Prerequisites

This is the frontend only — it needs the [backend API](../backend/README.md) running first (MariaDB via XAMPP + `npm run dev` in that project, listening on `http://localhost:5000` by default).

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Point the frontend at the backend

`src/environments/environment.ts` (used by `ng serve` / dev builds):

```ts
apiUrl: 'http://localhost:5000/api/v1',
```

This should already be correct for local development against a backend running on the default port. Change it if your backend runs elsewhere. `environment.production.ts` is the equivalent file used by production builds — point it at the real deployed backend URL before building for production.

### 3. Run it

```bash
npm start
```

Open `http://localhost:4200`. The app rebuilds automatically on file changes.

- **Storefront**: `/` — home, shop, product pages, cart, checkout, account area.
- **Admin panel**: `/admin` — login with the backend's seeded Super Admin (`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` from the backend's `.env`), or any account with an `ADMIN`/`SUPER_ADMIN` role. This is where products, categories, orders, banners, coupons, and everything else get managed day-to-day.

### 4. Production build

```bash
npm run build
```

Output goes to `dist/flowerweb/`. Uses `environment.production.ts` — make sure `apiUrl` there points at the real backend before building for a deploy.

## Project structure

```
src/app/
  account/             customer account area (login, register, orders, addresses, wishlist)
  admin/                admin panel pages (products, categories, orders, banners, coupons, ...)
  components/           site-wide components (header, footer, hero)
  core/                 interceptors, error handling, ambient background, floating actions, toasts
  home/                  homepage
  pages/                 storefront pages (shop, product detail, cart, checkout, about, contact, ...)
  services/              one HTTP service per backend module, mirrors the API 1:1
  shared/                reusable components (carousel, product card), directives, pipes, utils
public/                  static assets (logo, favicon, fallback images)
src/environments/        apiUrl + Stripe publishable key per build config
```

## Notes for whoever picks this up next

- Every service in `src/app/services/` calls a real backend endpoint — there is no mock/localStorage data left in the app.
- Product/category/banner images come from wherever the backend is currently configured to store them (local disk by default, or Cloudinary if the backend has `CLOUDINARY_*` env vars set) — the frontend doesn't need to know or care which, `mediaUrl()` in `shared/utils/media.util.ts` handles both transparently.
- Card payment (Stripe) needs a real `stripePublishableKey` in the environment file to activate at checkout — Cash on Delivery works with no configuration.
