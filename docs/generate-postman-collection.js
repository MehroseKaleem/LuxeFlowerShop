/* eslint-disable no-console */
/**
 * One-off generator for docs/postman_collection.json. Not part of the app —
 * run manually with `node docs/generate-postman-collection.js` if endpoints
 * change and the collection needs regenerating.
 */
const fs = require('fs');
const path = require('path');

const jsonBody = (obj) => ({
  mode: 'raw',
  raw: JSON.stringify(obj, null, 2),
  options: { raw: { language: 'json' } },
});

const req = (name, method, urlPath, { auth, body, formdata, query, description, saveTokenAs } = {}) => {
  const url = {
    raw: `{{baseUrl}}${urlPath}`,
    host: ['{{baseUrl}}'],
    path: urlPath.replace(/^\//, '').split('/').filter(Boolean),
  };
  if (query) {
    url.query = query.map(([key, value]) => ({ key, value }));
    url.raw += `?${query.map(([k, v]) => `${k}=${v}`).join('&')}`;
  }

  const item = {
    name,
    request: {
      method,
      header: [],
      url,
      description,
    },
  };

  if (auth === 'bearer') {
    item.request.header.push({ key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' });
  } else if (auth === 'adminBearer') {
    item.request.header.push({ key: 'Authorization', value: 'Bearer {{adminAccessToken}}', type: 'text' });
  }

  if (body) {
    item.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
    item.request.body = jsonBody(body);
  }

  if (formdata) {
    item.request.body = {
      mode: 'formdata',
      // Postman's schema uses `src` (a file path, or null for "no file chosen
      // yet") for file-type fields, and `value` for text fields — not value
      // for both, or the file picker won't render correctly when imported.
      formdata: formdata.map(([key, value, type]) =>
        type === 'file' ? { key, type: 'file', src: null } : { key, value, type: 'text' },
      ),
    };
  }

  if (saveTokenAs) {
    item.event = [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            'const json = pm.response.json();',
            'if (json && json.data && json.data.accessToken) {',
            `  pm.collectionVariables.set('${saveTokenAs}', json.data.accessToken);`,
            `  console.log('Saved accessToken into {{${saveTokenAs}}}');`,
            '}',
          ],
        },
      },
    ];
  }

  return item;
};

const folder = (name, items) => ({ name, item: items });

const collection = {
  info: {
    name: 'Luxeflower API',
    description: 'Full storefront + admin API for the Luxeflower backend. See docs/API_INTEGRATION_GUIDE.md for narrative documentation.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000/api/v1' },
    { key: 'accessToken', value: '' },
    { key: 'adminAccessToken', value: '' },
    { key: 'cartSession', value: 'guest-session-demo-001' },
  ],
  item: [
    folder('Auth', [
      req('Register', 'POST', '/auth/register', {
        body: { name: 'Jane Doe', email: 'jane@example.com', phone: '+971501234567', password: 'MyPassword1' },
      }),
      req('Login', 'POST', '/auth/login', {
        body: { identifier: 'jane@example.com', password: 'MyPassword1' },
        description: 'Automatically saves data.accessToken into the {{accessToken}} collection variable — every request marked "bearer" auth uses it.',
        saveTokenAs: 'accessToken',
      }),
      req('Refresh token', 'POST', '/auth/refresh'),
      req('Logout', 'POST', '/auth/logout'),
      req('Logout all devices', 'POST', '/auth/logout-all', { auth: 'bearer' }),
      req('Get current user', 'GET', '/auth/me', { auth: 'bearer' }),
      req('Forgot password', 'POST', '/auth/forgot-password', { body: { email: 'jane@example.com' } }),
      req('Reset password', 'POST', '/auth/reset-password/:token', { body: { password: 'NewPassword1' } }),
      req('Verify email', 'GET', '/auth/verify-email/:token'),
      req('Resend verification email', 'POST', '/auth/resend-verification', { auth: 'bearer' }),
      req('Change password', 'POST', '/auth/change-password', {
        auth: 'bearer',
        body: { currentPassword: 'MyPassword1', newPassword: 'MyPassword2' },
      }),
    ]),

    folder('Users (me)', [
      req('Update profile', 'PATCH', '/users/me', { auth: 'bearer', body: { name: 'Jane Updated' } }),
      req('Upload avatar', 'POST', '/users/me/avatar', {
        auth: 'bearer',
        formdata: [['avatar', '', 'file']],
      }),
      req('List my addresses', 'GET', '/users/me/addresses', { auth: 'bearer' }),
      req('Add address', 'POST', '/users/me/addresses', {
        auth: 'bearer',
        body: {
          label: 'Home', fullName: 'Jane Doe', phone: '+971501234567',
          addressLine1: 'Villa 12, Al Wasl Road', city: 'Dubai', emirate: 'Dubai',
        },
      }),
      req('Update address', 'PATCH', '/users/me/addresses/:id', { auth: 'bearer', body: { city: 'Abu Dhabi' } }),
      req('Delete address', 'DELETE', '/users/me/addresses/:id', { auth: 'bearer' }),
      req('Set default address', 'PATCH', '/users/me/addresses/:id/default', { auth: 'bearer' }),
    ]),

    folder('Categories', [
      req('List categories', 'GET', '/categories'),
      req('Get category by slug', 'GET', '/categories/:slug'),
    ]),

    folder('Products', [
      req('List products', 'GET', '/products', {
        query: [['page', '1'], ['limit', '20'], ['category', 'rose-bouquets'], ['sortBy', 'basePrice'], ['sortOrder', 'asc']],
      }),
      req('Featured products', 'GET', '/products/featured', { query: [['limit', '8']] }),
      req('Product detail', 'GET', '/products/:slug'),
      req('Related products', 'GET', '/products/:slug/related', { query: [['limit', '8']] }),
    ]),

    folder('Cart', [
      req('Get cart', 'GET', '/cart'),
      req('Add item to cart', 'POST', '/cart/items', { body: { productId: 1, variantId: null, quantity: 1 } }),
      req('Update item quantity', 'PATCH', '/cart/items/:itemId', { body: { quantity: 2 } }),
      req('Remove item', 'DELETE', '/cart/items/:itemId'),
      req('Clear cart', 'DELETE', '/cart'),
      req('Apply coupon', 'POST', '/cart/coupon', { body: { code: 'WELCOME10', email: 'jane@example.com', phone: '+971501234567' } }),
      req('Remove coupon', 'DELETE', '/cart/coupon'),
      req('Merge guest cart into account', 'POST', '/cart/merge', { auth: 'bearer', body: { sessionId: '{{cartSession}}' } }),
    ]),

    folder('Orders', [
      req('Place order (COD)', 'POST', '/orders', {
        body: {
          paymentMethod: 'COD',
          couponCode: 'WELCOME10',
          shippingAddress: {
            fullName: 'Jane Doe', phone: '+971501234567',
            addressLine1: 'Villa 12, Al Wasl Road', city: 'Dubai', emirate: 'Dubai',
          },
          guestEmail: 'jane@example.com',
          guestPhone: '+971501234567',
        },
      }),
      req('Place order (Stripe)', 'POST', '/orders', {
        body: {
          paymentMethod: 'STRIPE',
          shippingAddressId: 1,
        },
        auth: 'bearer',
      }),
      req('My orders', 'GET', '/orders', { auth: 'bearer' }),
      req('Order by number', 'GET', '/orders/:orderNumber', { auth: 'bearer' }),
    ]),

    folder('Payments', [
      req('Create Stripe payment intent', 'POST', '/payments/create-intent', {
        body: { orderNumber: 'KF-20260101-ABCDEF' },
      }),
    ]),

    folder('Reviews', [
      req('List reviews for a product', 'GET', '/reviews/product/:slug'),
      req('Submit a review', 'POST', '/reviews', {
        auth: 'bearer',
        body: { productId: 1, orderId: 1, rating: 5, title: 'Lovely!', comment: 'Fresh and beautiful.' },
      }),
      req('Update my review', 'PATCH', '/reviews/:id', { auth: 'bearer', body: { rating: 4 } }),
      req('Delete my review', 'DELETE', '/reviews/:id', { auth: 'bearer' }),
    ]),

    folder('Wishlist', [
      req('Get wishlist', 'GET', '/wishlist', { auth: 'bearer' }),
      req('Add to wishlist', 'POST', '/wishlist', { auth: 'bearer', body: { productId: 1 } }),
      req('Remove from wishlist', 'DELETE', '/wishlist/:productId', { auth: 'bearer' }),
    ]),

    folder('Banners', [req('List active banners', 'GET', '/banners', { query: [['position', 'HOME_HERO']] })]),

    folder('Settings', [req('Get public settings', 'GET', '/settings')]),

    folder('Newsletter', [
      req('Subscribe', 'POST', '/newsletter/subscribe', { body: { email: 'jane@example.com' } }),
      req('Unsubscribe', 'POST', '/newsletter/unsubscribe', { body: { email: 'jane@example.com' } }),
    ]),

    folder('Contact', [
      req('Submit contact form', 'POST', '/contact', {
        body: { name: 'Jane Doe', email: 'jane@example.com', subject: 'Question', message: 'Do you deliver to Sharjah?' },
      }),
    ]),

    folder('Admin', [
      req('Admin login', 'POST', '/auth/login', {
        body: { identifier: 'admin@luxefloweruae.com', password: 'ChangeMe@12345' },
        description: 'Uses the same /auth/login endpoint — role comes back on the user object. Automatically saves the token into {{adminAccessToken}}, used by every request below.',
        saveTokenAs: 'adminAccessToken',
      }),
      folder('Users', [
        req('List users', 'GET', '/admin/users', { auth: 'adminBearer' }),
        req('Get user', 'GET', '/admin/users/:id', { auth: 'adminBearer' }),
        req('Set user active status', 'PATCH', '/admin/users/:id/status', { auth: 'adminBearer', body: { isActive: false } }),
        req('Set user role', 'PATCH', '/admin/users/:id/role', { auth: 'adminBearer', body: { role: 'ADMIN' } }),
      ]),
      folder('Categories', [
        req('List categories (admin)', 'GET', '/admin/categories', { auth: 'adminBearer' }),
        req('Get category', 'GET', '/admin/categories/:id', { auth: 'adminBearer' }),
        req('Create category', 'POST', '/admin/categories', {
          auth: 'adminBearer',
          formdata: [['name', 'Seasonal Picks'], ['description', 'Limited-time seasonal arrangements'], ['image', '', 'file']],
        }),
        req('Update category', 'PATCH', '/admin/categories/:id', {
          auth: 'adminBearer',
          formdata: [['name', 'Updated Name'], ['image', '', 'file']],
        }),
        req('Delete category', 'DELETE', '/admin/categories/:id', { auth: 'adminBearer' }),
      ]),
      folder('Products', [
        req('List products (admin)', 'GET', '/admin/products', { auth: 'adminBearer' }),
        req('Get product', 'GET', '/admin/products/:id', { auth: 'adminBearer' }),
        req('Create product', 'POST', '/admin/products', {
          auth: 'adminBearer',
          formdata: [
            ['name', 'Red Rose Bouquet'], ['sku', 'KF-BQ-ROSE-RED'],
            ['categoryIds', '7'], ['categoryIds', '9'], ['categoryIds', '13'],
            ['basePrice', '149'], ['stock', '50'],
            ['shortDescription', 'A classic bouquet of fresh red roses.'],
            ['images', '', 'file'],
          ],
        }),
        req('Update product', 'PATCH', '/admin/products/:id', { auth: 'adminBearer', body: { basePrice: 159, categoryIds: [7, 8] } }),
        req('Delete product', 'DELETE', '/admin/products/:id', { auth: 'adminBearer' }),
        req('Add product images', 'POST', '/admin/products/:id/images', {
          auth: 'adminBearer',
          formdata: [['images', '', 'file']],
        }),
        req('Remove product image', 'DELETE', '/admin/products/:id/images/:imageId', { auth: 'adminBearer' }),
        req('Set primary image', 'PATCH', '/admin/products/:id/images/:imageId/primary', { auth: 'adminBearer' }),
        req('Add variant', 'POST', '/admin/products/:id/variants', {
          auth: 'adminBearer',
          body: { name: 'Large Bouquet', sku: 'KF-BQ-ROSE-RED-L', priceAdjustment: 30, stock: 20 },
        }),
        req('Update variant', 'PATCH', '/admin/products/:id/variants/:variantId', { auth: 'adminBearer', body: { stock: 15 } }),
        req('Delete variant', 'DELETE', '/admin/products/:id/variants/:variantId', { auth: 'adminBearer' }),
        req('Adjust stock', 'PATCH', '/admin/products/:id/stock', { auth: 'adminBearer', body: { mode: 'SET', quantity: 40 } }),
      ]),
      folder('Coupons', [
        req('List coupons', 'GET', '/admin/coupons', { auth: 'adminBearer' }),
        req('Get coupon', 'GET', '/admin/coupons/:id', { auth: 'adminBearer' }),
        req('Create coupon', 'POST', '/admin/coupons', {
          auth: 'adminBearer',
          body: {
            code: 'WELCOME10', description: '10% off first order', discountType: 'PERCENTAGE', discountValue: 10,
            usageLimitPerUser: 1, expiresAt: '2027-01-01T00:00:00Z', isActive: true,
          },
        }),
        req('Update coupon', 'PATCH', '/admin/coupons/:id', { auth: 'adminBearer', body: { discountValue: 15 } }),
        req('Toggle coupon active', 'PATCH', '/admin/coupons/:id/toggle', { auth: 'adminBearer' }),
        req('Delete coupon', 'DELETE', '/admin/coupons/:id', { auth: 'adminBearer' }),
      ]),
      folder('Orders', [
        req('List orders (admin)', 'GET', '/admin/orders', { auth: 'adminBearer' }),
        req('Get order', 'GET', '/admin/orders/:id', { auth: 'adminBearer' }),
        req('Update order status', 'PATCH', '/admin/orders/:id/status', { auth: 'adminBearer', body: { status: 'CONFIRMED', note: 'Payment collected' } }),
        req('Update payment status', 'PATCH', '/admin/orders/:id/payment-status', { auth: 'adminBearer', body: { paymentStatus: 'PAID' } }),
      ]),
      folder('Reviews', [
        req('List reviews (admin)', 'GET', '/admin/reviews', { auth: 'adminBearer', query: [['isApproved', 'false']] }),
        req('Approve review', 'PATCH', '/admin/reviews/:id/approve', { auth: 'adminBearer' }),
        req('Delete review', 'DELETE', '/admin/reviews/:id', { auth: 'adminBearer' }),
      ]),
      folder('Banners', [
        req('List banners (admin)', 'GET', '/admin/banners', { auth: 'adminBearer' }),
        req('Create banner', 'POST', '/admin/banners', {
          auth: 'adminBearer',
          formdata: [['title', "Valentine's Week Sale"], ['position', 'HOME_HERO'], ['image', '', 'file']],
        }),
        req('Update banner', 'PATCH', '/admin/banners/:id', { auth: 'adminBearer', formdata: [['title', 'Updated title'], ['image', '', 'file']] }),
        req('Delete banner', 'DELETE', '/admin/banners/:id', { auth: 'adminBearer' }),
      ]),
      folder('Settings', [
        req('Get settings (admin)', 'GET', '/admin/settings', { auth: 'adminBearer' }),
        req('Update settings', 'PATCH', '/admin/settings', { auth: 'adminBearer', body: { SHIPPING_FEE: '30' } }),
      ]),
      folder('Newsletter', [req('List subscribers', 'GET', '/admin/newsletter', { auth: 'adminBearer' })]),
      folder('Contact', [
        req('List messages', 'GET', '/admin/contact', { auth: 'adminBearer' }),
        req('Mark message read', 'PATCH', '/admin/contact/:id/read', { auth: 'adminBearer' }),
        req('Delete message', 'DELETE', '/admin/contact/:id', { auth: 'adminBearer' }),
      ]),
      folder('Dashboard', [
        req('Overview', 'GET', '/admin/dashboard/overview', { auth: 'adminBearer' }),
        req('Sales over time', 'GET', '/admin/dashboard/sales', { auth: 'adminBearer', query: [['days', '30']] }),
        req('Top products', 'GET', '/admin/dashboard/top-products', { auth: 'adminBearer', query: [['limit', '10']] }),
        req('Low stock', 'GET', '/admin/dashboard/low-stock', { auth: 'adminBearer' }),
        req('Order status breakdown', 'GET', '/admin/dashboard/order-status-breakdown', { auth: 'adminBearer' }),
      ]),
    ]),
  ],
};

const outPath = path.join(__dirname, 'postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
console.log(`Wrote ${outPath}`);
