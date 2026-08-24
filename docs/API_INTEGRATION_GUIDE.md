# Luxeflower — Frontend Integration Guide

Everything a frontend developer needs to integrate against this backend: base URLs, auth flow, every endpoint, request/response shapes, file uploads, the checkout flow, and Stripe wiring.

A ready-to-import Postman collection covering every endpoint below is at [`postman_collection.json`](./postman_collection.json) in this same folder.

The database is pre-populated with sample data (run via `npm run seed`) so the frontend can be built against realistic content immediately — 20 products across all 9 categories with placeholder images, variants, tags, and sale pricing; 3 homepage banners; 5 coupons (including one already-expired, for testing that UI state); and two demo customer accounts with real order history:

| Account | Email | Password | Has |
|---|---|---|---|
| Admin | `admin@luxeflower.ae` | `ChangeMe@12345` | Full admin panel access |
| Demo customer | `sara.customer@example.com` | `Customer@123` | 4 orders (pending, shipped, cancelled, delivered), 2 wishlist items, 1 review written |
| Demo customer | `omar.customer@example.com` | `Customer@123` | 2 orders (confirmed, delivered), 1 wishlist item, 1 review written |

Log in as either demo customer to build/test the account, order-history, and order-tracking pages without needing to manually create data first.

---

## 1. Base URL & environment

| Environment | Base URL |
|---|---|
| Local dev | `http://localhost:5000/api/v1` |
| Production | `https://<domain>/api/v1` (backend team will confirm the live domain) |

The frontend needs these of its own env vars:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_UPLOADS_BASE_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx   # from the backend team once Stripe is live
```

(`NEXT_PUBLIC_` prefix is a Next.js convention — rename appropriately for whatever framework is used, the values are what matter.)

**CORS**: the backend only allows origins listed in its `CORS_ORIGINS` env var. Give the backend developer every domain the frontend will run on (e.g. `http://localhost:3000`, staging URL, production domain) so they can be whitelisted. All requests that rely on the refresh-token cookie **must** be sent with credentials included (`fetch(url, { credentials: 'include' })` or `axios.defaults.withCredentials = true`).

---

## 2. Response envelope

Every response, success or failure, has this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { "...": "..." },
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

- `meta` is only present on paginated list endpoints.
- On errors, `success` is `false`, `data` is omitted, and `message` is a human-readable string safe to show the user directly:

```json
{ "success": false, "statusCode": 400, "message": "Only 40 unit(s) available in stock" }
```

Validation errors additionally include a `details` array:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "A valid email is required" }]
}
```

Build one central error handler around this shape — every endpoint in the API follows it, no exceptions.

---

## 3. Authentication

JWT access token (short-lived, ~15 min) + rotating refresh token (long-lived, stored as an **httpOnly cookie** the frontend never reads directly — the browser sends it automatically).

### Register
`POST /auth/register`
```json
{ "name": "Jane Doe", "email": "jane@example.com", "phone": "+971501234567", "password": "MyPassword1" }
```
→ `201`, returns `{ user, accessToken }` and sets the refresh cookie. Treat register as an auto-login — no separate login call needed after.

### Login
`POST /auth/login`
```json
{ "identifier": "jane@example.com", "password": "MyPassword1" }
```
`identifier` accepts either email or phone. → `200`, `{ user, accessToken }`.

### Using the access token
Every authenticated request needs:
```
Authorization: Bearer <accessToken>
```
Keep the access token **in memory** (React state / a store), not localStorage, if you can help it — it's short-lived by design.

### Refreshing
`POST /auth/refresh` — no body needed, the refresh cookie does the work (must be called with `credentials: 'include'`). Returns a new `{ user, accessToken }` and rotates the cookie. **Recommended pattern**: on any `401` from an API call, call `/auth/refresh` once, retry the original request with the new token; if refresh also fails, redirect to login.

### Logout
`POST /auth/logout` (clears the current session) or `POST /auth/logout-all` (protected, revokes every session for that user — "log out of all devices").

### Current user
`GET /auth/me` (protected) → `{ user }`.

### Password reset
1. `POST /auth/forgot-password` `{ "email": "..." }` — always returns success regardless of whether the email exists (no account enumeration). This triggers an email with a reset link `{CLIENT_URL}/reset-password/{token}`.
2. Frontend reads `:token` from that URL, calls `POST /auth/reset-password/:token` `{ "password": "NewPassword1" }`.

### Email verification
Registration sends a link `{CLIENT_URL}/verify-email/{token}`. Frontend reads the token and calls `GET /auth/verify-email/:token`. `POST /auth/resend-verification` (protected) re-sends it.

### Change password (logged in)
`POST /auth/change-password` (protected) `{ "currentPassword": "...", "newPassword": "..." }`.

---

## 4. Guest cart / session handling

Users can shop and check out **without an account**. For guests, the frontend must generate a random session id once (e.g. `crypto.randomUUID()`), persist it in `localStorage`, and send it on every cart/order request as a header:

```
x-cart-session: 7e6f5c2a-...
```

Once a guest registers or logs in, call `POST /cart/merge` `{ "sessionId": "<the guest session id>" }` (protected route) to fold the guest cart into their account cart. Do this right after login/register if a guest cart id exists in storage.

Logged-in users don't need the header at all — the cart is resolved from their JWT instead. If both a valid token *and* the header are sent, the token wins.

---

## 5. Storefront endpoints

### Categories
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/categories` | none | All active categories, flat list with product counts. Use for nav/menu. |
| GET | `/categories/:slug` | none | One category + its subcategories (if any). |

```json
// GET /categories → data.categories[0]
{ "id": 7, "name": "Our Collection", "slug": "our-collection", "image": null, "parentId": null, "_count": { "products": 6 } }
```

### Products
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products` | none | Paginated catalog. See query params below. |
| GET | `/products/featured?limit=8` | none | Homepage featured products. |
| GET | `/products/:slug` | none | Full product detail (all images, variants, tags, categories). |
| GET | `/products/:slug/related?limit=8` | none | Products sharing a category. |

**List query params** (`GET /products`): `page`, `limit` (max 100), `sortBy` (`createdAt`\|`basePrice`\|`avgRating`\|`name`\|`viewCount`), `sortOrder` (`asc`\|`desc`), `category` (category **slug**), `tag` (tag slug), `isFeatured` (`true`\|`false`), `minPrice`, `maxPrice`, `search`.

```
GET /products?category=rose-bouquets&sortBy=basePrice&sortOrder=asc&page=1&limit=12
```

List items are intentionally lean (for fast grid rendering): `id, name, slug, shortDescription, basePrice, discountPrice, stock, isFeatured, avgRating, reviewCount, images[] (primary only), categories[]`. The detail endpoint (`/products/:slug`) returns everything, including `variants[]` and `tags[]`.

**Price**: always use `discountPrice` if it's not `null`, otherwise `basePrice`. Prices are AED, returned as strings (decimal precision) — parse with `parseFloat` for display/math.

**Images**: `image.url` is a relative path like `/uploads/products/172...-abc.png`. Full URL = `NEXT_PUBLIC_UPLOADS_BASE_URL + image.url`.

### Reviews
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/reviews/product/:slug` | none | Approved reviews only, paginated. |
| POST | `/reviews` | protected | `{ productId, orderId, rating (1-5), title?, comment? }`. `orderId` must be a **delivered** order containing that product, or it's rejected. |
| PATCH | `/reviews/:id` | protected (own) | Re-submits for approval. |
| DELETE | `/reviews/:id` | protected (own) | |

### Wishlist (protected — all routes require login)
`GET /wishlist`, `POST /wishlist` `{ "productId": 1 }`, `DELETE /wishlist/:productId`.

### Banners
`GET /banners?position=HOME_HERO` (none) — active banners within their date window, for homepage/promo slots.

### Settings
`GET /settings` (none) → store-wide config the frontend needs for checkout math:
```json
{ "SHIPPING_FEE": "25", "FREE_SHIPPING_THRESHOLD": "200", "TAX_RATE_PERCENT": "5", "CURRENCY": "AED", "STORE_PHONE": "+971500000000", "STORE_EMAIL": "support@luxeflower.ae" }
```
Fetch this once and cache it (e.g. at app load) — don't recompute shipping/tax client-side beyond display purposes, the backend recalculates authoritatively at checkout regardless.

### Newsletter
`POST /newsletter/subscribe` `{ "email": "..." }`, `POST /newsletter/unsubscribe` `{ "email": "..." }`.

### Contact form
`POST /contact` `{ "name", "email", "phone"?, "subject"?, "message" }`.

---

## 6. Cart

All cart routes work for both guests (`x-cart-session` header) and logged-in users (JWT).

| Method | Path | Body |
|---|---|---|
| GET | `/cart` | — |
| POST | `/cart/items` | `{ "productId": 1, "variantId": null, "quantity": 2 }` |
| PATCH | `/cart/items/:itemId` | `{ "quantity": 3 }` (quantity `0` removes the item) |
| DELETE | `/cart/items/:itemId` | — |
| DELETE | `/cart` | clears the whole cart |
| POST | `/cart/coupon` | `{ "code": "WELCOME10", "email"?, "phone"? }` — `email`/`phone` **required for guests**, ignored for logged-in users (their account email/phone is used) |
| DELETE | `/cart/coupon` | removes an applied coupon |
| POST | `/cart/merge` | `{ "sessionId": "<guest session id>" }` (protected) |

Cart response shape:
```json
{
  "id": 4,
  "items": [
    {
      "id": 5, "productId": 1, "variantId": 1, "quantity": 1,
      "unitPrice": 179, "lineTotal": 179,
      "product": { "id": 1, "name": "Red Rose Bouquet", "slug": "red-rose-bouquet", "basePrice": "149", "discountPrice": null, "stock": 40, "isActive": true, "images": [] },
      "variant": { "id": 1, "name": "Large Bouquet", "priceAdjustment": "30", "stock": 20 },
      "inStock": true
    }
  ],
  "subtotal": 179,
  "coupon": { "code": "WELCOME10", "discountType": "PERCENTAGE", "discountValue": "10" },
  "discountAmount": 17.9,
  "total": 161.1
}
```
Note `total` here does **not** include shipping/tax — those are only computed at order placement (see below), since they can depend on the final subtotal after any last-second cart changes.

**Coupon errors to surface clearly to the user** (all `400`): `"This coupon has expired"`, `"You have already used this coupon"`, `"This coupon has reached its usage limit"`, `"Minimum order amount for this coupon is AED X"`, or `404` `"Invalid coupon code"`.

---

## 7. Checkout — full flow

1. Build the cart (section 6).
2. Optionally apply a coupon.
3. Collect shipping address. Logged-in users can pick a saved address (`GET /users/me/addresses`) and pass `shippingAddressId`, or supply a fresh `shippingAddress` object either way — guests must always supply the full object.
4. Call `POST /orders`:

```json
{
  "paymentMethod": "COD",
  "couponCode": "WELCOME10",
  "shippingAddressId": 1,
  "shippingAddress": {
    "fullName": "Jane Doe", "phone": "+971501234567",
    "addressLine1": "Villa 12, Al Wasl Road", "addressLine2": "",
    "city": "Dubai", "emirate": "Dubai", "postalCode": ""
  },
  "guestEmail": "jane@example.com",
  "guestPhone": "+971501234567",
  "deliveryDate": "2026-08-20",
  "deliveryTimeSlot": "2pm - 5pm",
  "notes": "Ring the bell twice"
}
```
- `paymentMethod`: `"COD"` or `"STRIPE"`.
- `shippingAddressId` **or** `shippingAddress` — send one. `shippingAddressId` only works for logged-in users.
- `guestEmail`/`guestPhone` are **required if not logged in**, ignored otherwise.
- This call re-validates stock and re-computes subtotal/discount/shipping/tax/total from live data server-side — never trust or send client-computed totals.

Response is the created order (see shape in section 8). The cart is cleared automatically on success.

5. **If `paymentMethod` was `"COD"`** — done. Order is `status: "PENDING"`, `paymentStatus: "PENDING"`, confirmation email sent.

6. **If `paymentMethod` was `"STRIPE"`** — see section 9, immediately continue to create a payment intent and confirm payment before considering the order placed from the user's perspective.

---

## 8. Orders (customer-facing, protected)

| Method | Path | Notes |
|---|---|---|
| GET | `/orders` | Paginated list of the logged-in user's own orders. |
| GET | `/orders/:orderNumber` | One order by its human-readable number (e.g. `KF-20260814-8EE1D2`). |

Order shape:
```json
{
  "id": 2, "orderNumber": "KF-20260814-8EE1D2", "status": "DELIVERED",
  "paymentStatus": "PAID", "paymentMethod": "COD",
  "subtotal": "233", "discountAmount": "0", "shippingFee": "0", "tax": "11.65", "total": "244.65",
  "couponCode": null,
  "shippingAddress": { "fullName": "...", "phone": "...", "addressLine1": "...", "city": "Dubai", "emirate": "Dubai", "country": "AE" },
  "deliveryDate": null, "deliveryTimeSlot": null, "notes": null,
  "items": [{ "productId": 2, "productName": "Birthday Surprise Bouquet", "sku": "KF-BQ-BDAY-SURP", "price": "199", "quantity": 1, "subtotal": "199" }],
  "statusHistory": [{ "status": "PENDING", "note": "Order placed", "createdAt": "..." }, { "status": "CONFIRMED", "note": null, "createdAt": "..." }],
  "createdAt": "..."
}
```

`status` progresses: `PENDING → CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`, or `CANCELLED`/`REFUNDED` at various points. Show `statusHistory` as a timeline on the order-tracking page.

---

## 9. Stripe payment flow

The backend never touches card details — Stripe.js on the frontend does. Sequence:

1. Place the order with `paymentMethod: "STRIPE"` (section 7) → get back `order.orderNumber`, `order.total`, `paymentStatus: "PENDING"`.
2. `POST /payments/create-intent` `{ "orderNumber": "KF-...", "email"? }` (`email` required only if the order was placed as a guest, must match) → `{ "clientSecret": "pi_..._secret_..." }`.
3. Use Stripe.js on the frontend:
   ```js
   const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
   const { error } = await stripe.confirmCardPayment(clientSecret, {
     payment_method: { card: cardElement },
   });
   ```
4. On success, Stripe's webhook (server-to-server, backend already handles this) marks the order `paymentStatus: "PAID"` and `status: "CONFIRMED"` automatically — the frontend does **not** need to call any "confirm" endpoint itself. After `confirmCardPayment` resolves without error, just redirect to an order-confirmation/thank-you page and poll or re-fetch `GET /orders/:orderNumber` if you want to reflect the updated payment status immediately (the webhook is usually near-instant, but polling once or twice a second for a few seconds is a safe pattern rather than assuming instant consistency).

Use Stripe's [test cards](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`, any future expiry, any CVC) against test-mode keys during integration — the backend team will supply real `pk_live_...` only once the client's Stripe account is verified.

---

## 10. Admin panel endpoints

Everything under `/admin/*` requires `Authorization: Bearer <token>` where the logged-in user has role `ADMIN` or `SUPER_ADMIN` (login is the same `/auth/login` endpoint — role is returned on the `user` object and encoded in the token). A non-admin token gets a `403`.

All admin list endpoints share the same pagination pattern as storefront ones (`page`, `limit`, `sortBy`, `sortOrder`, plus resource-specific filters).

| Resource | Base path | Key routes |
|---|---|---|
| Users | `/admin/users` | `GET /`, `GET /:id`, `PATCH /:id/status` `{isActive}`, `PATCH /:id/role` `{role}` (SUPER_ADMIN only) |
| Categories | `/admin/categories` | `GET /`, `GET /:id`, `POST /` (multipart, see below), `PATCH /:id`, `DELETE /:id` |
| Products | `/admin/products` | `GET /`, `GET /:id`, `POST /` (multipart), `PATCH /:id`, `DELETE /:id`, plus images/variants/stock sub-routes below |
| Coupons | `/admin/coupons` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `PATCH /:id/toggle`, `DELETE /:id` |
| Orders | `/admin/orders` | `GET /`, `GET /:id`, `PATCH /:id/status` `{status, note?}`, `PATCH /:id/payment-status` `{paymentStatus}` |
| Reviews | `/admin/reviews` | `GET /`, `PATCH /:id/approve`, `DELETE /:id` |
| Banners | `/admin/banners` | `GET /`, `POST /` (multipart), `PATCH /:id`, `DELETE /:id` |
| Settings | `/admin/settings` | `GET /`, `PATCH /` (partial object of any setting keys) |
| Newsletter | `/admin/newsletter` | `GET /` (subscriber list) |
| Contact | `/admin/contact` | `GET /`, `PATCH /:id/read`, `DELETE /:id` |
| Dashboard | `/admin/dashboard` | `GET /overview`, `GET /sales?days=30`, `GET /top-products?limit=10`, `GET /low-stock`, `GET /order-status-breakdown` |

### Creating/editing a product (admin)
`POST /admin/products` — **multipart/form-data**, not JSON, because it accepts image files:

| Field | Type | Notes |
|---|---|---|
| `name` | text | required |
| `sku` | text | required, unique |
| `categoryIds` | text, **repeated** | required, at least one. Send the field once per checked category checkbox: `categoryIds=7&categoryIds=9&categoryIds=13` (a single checkbox may send it as one scalar value — both forms work). |
| `basePrice` | text (number) | required |
| `discountPrice`, `costPrice`, `stock`, `lowStockThreshold`, `weightGrams` | text (number) | optional |
| `shortDescription`, `description`, `metaTitle`, `metaDescription` | text | optional |
| `isActive`, `isFeatured` | text (`"true"`/`"false"`) | optional |
| `images` | file, **repeated**, up to 10 | optional at create time; first uploaded image becomes primary |

`PATCH /admin/products/:id` accepts the same fields (all optional) as JSON — it does **not** take images (see below).

**Category checkboxes**: this is the mechanism the earlier question about "checkboxes for multi-category" maps to — render one checkbox per category from `GET /categories`, and submit every checked one under the repeated `categoryIds` field.

### Product images (separate endpoints, after the product exists)
- `POST /admin/products/:id/images` — multipart, field `images` (repeated, up to 10 files) — adds more images.
- `DELETE /admin/products/:id/images/:imageId`
- `PATCH /admin/products/:id/images/:imageId/primary` — makes it the main listing image.

### Product variants
- `POST /admin/products/:id/variants` `{ "name": "Large", "sku": "KF-...-L", "priceAdjustment": 30, "stock": 20 }`
- `PATCH /admin/products/:id/variants/:variantId`
- `DELETE /admin/products/:id/variants/:variantId`

### Stock adjustment
`PATCH /admin/products/:id/stock` `{ "mode": "SET" | "INCREMENT" | "DECREMENT", "quantity": 10 }`.

### Coupons (admin)
```json
// POST /admin/coupons
{
  "code": "WELCOME10", "description": "10% off first order",
  "discountType": "PERCENTAGE", "discountValue": 10,
  "minOrderAmount": null, "maxDiscountAmount": null,
  "usageLimit": null, "usageLimitPerUser": 1,
  "startsAt": null, "expiresAt": "2027-01-01T00:00:00Z", "isActive": true
}
```
`expiresAt` must be a future date on create. `discountType` is `PERCENTAGE` or `FIXED`.

### Order status transitions (admin)
`PATCH /admin/orders/:id/status` `{ "status": "CONFIRMED", "note": "optional note" }`. Valid transitions only: `PENDING→CONFIRMED→PROCESSING→SHIPPED→OUT_FOR_DELIVERY→DELIVERED`, or `→CANCELLED` from any non-terminal state. Cancelling automatically restocks the order's items. Marking a COD order `DELIVERED` automatically flips `paymentStatus` to `PAID`.

---

## 11. Reference: enums

| Enum | Values |
|---|---|
| Order status | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| Payment status | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| Payment method | `COD`, `STRIPE` |
| Discount type | `PERCENTAGE`, `FIXED` |
| User role | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` |

---

## 12. HTTP status codes used

`200` OK · `201` Created · `400` Bad request / validation failed · `401` Not authenticated / bad or expired token · `403` Authenticated but not permitted (wrong role, or not the resource owner) · `404` Not found · `409` Conflict (duplicate email/sku/coupon code, etc.) · `429` Rate limited · `500` Unexpected server error (should be rare — report these to the backend team as bugs).
