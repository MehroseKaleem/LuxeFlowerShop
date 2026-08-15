/* eslint-disable no-console */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const env = require('../src/config/env');
const slugify = require('../src/utils/slugify');
const generateOrderNumber = require('../src/utils/orderNumber');
const { DEFAULTS } = require('../src/modules/settings/settings.service');
const { writePlaceholderImage } = require('./placeholderImage');

const prisma = new PrismaClient();

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// An earlier version of this seed used placeholder category/product names
// before the client's real category list was supplied. This removes that
// stale demo data (by slug, so it's a no-op once already cleaned up) so a
// reseed converges on exactly the client's taxonomy instead of leaving
// orphaned leftovers behind.
async function cleanupLegacyPlaceholderData() {
  const legacyProductSlugs = ['white-lily-sympathy-wreath', 'potted-peace-lily', 'anniversary-elegance'];
  const legacyCategorySlugs = ['bouquets', 'roses', 'birthday-flowers', 'anniversary', 'sympathy-funeral', 'plants'];

  const { count: deletedProducts } = await prisma.product.deleteMany({
    where: { slug: { in: legacyProductSlugs } },
  });
  const { count: deletedCategories } = await prisma.category.deleteMany({
    where: { slug: { in: legacyCategorySlugs } },
  });

  if (deletedProducts || deletedCategories) {
    console.log(
      `Cleaned up legacy placeholder data: ${deletedProducts} product(s), ${deletedCategories} category(ies).`,
    );
  }
}

async function seedSuperAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: env.seed.superAdminEmail } });
  if (existing) {
    console.log(`Super admin already exists: ${existing.email}`);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(env.seed.superAdminPassword, env.bcryptSaltRounds);
  const admin = await prisma.user.create({
    data: {
      name: env.seed.superAdminName,
      email: env.seed.superAdminEmail,
      phone: env.seed.superAdminPhone,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });

  console.log(`Created super admin: ${admin.email} (password from SEED_SUPER_ADMIN_PASSWORD)`);
  return admin;
}

async function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log('Default settings ensured.');
}

// Exact category list requested by the client for karazflowers.ae. Order
// here also drives display sortOrder. "Our Collection" and "Flowers" are
// broad umbrella categories that most products also belong to, alongside
// their more specific category/categories (a product can sit in many).
const CLIENT_CATEGORIES = [
  { name: 'Our Collection', description: 'Every arrangement we offer, all in one place.' },
  { name: 'Flowers', description: 'Fresh-cut flowers and bouquets for every occasion.' },
  { name: 'Rose Bouquets', description: 'Classic hand-tied rose bouquets in every shade.' },
  { name: 'Roses In A Box', description: 'Premium roses beautifully boxed and ready to gift.' },
  { name: 'Julieta Mix', description: 'Our signature Julieta-style mixed arrangements.' },
  { name: 'Mixed Flowers', description: 'Vibrant seasonal blooms mixed into one arrangement.' },
  { name: "Valentine's Day Collection", description: "Romantic arrangements for Valentine's Day." },
  { name: 'Anniversary Special', description: 'Timeless arrangements to celebrate every anniversary.' },
  { name: 'Birthday Special', description: 'Bright, cheerful bouquets to make birthdays special.' },
];

async function seedCategories() {
  const categories = [];

  for (const [index, def] of CLIENT_CATEGORIES.entries()) {
    const slug = slugify(def.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: def.name, sortOrder: index, description: def.description },
      create: { name: def.name, slug, isActive: true, sortOrder: index, description: def.description },
    });

    if (!category.image) {
      const image = writePlaceholderImage('categories', { label: def.name, paletteIndex: index, width: 700, height: 500 });
      await prisma.category.update({ where: { id: category.id }, data: { image } });
      category.image = image;
    }

    categories.push(category);
  }

  console.log(`Ensured ${categories.length} categories (with placeholder images).`);
  return categories;
}

// 20 products spread across the real category list, with realistic AED
// pricing, a mix of stock levels (including one out-of-stock and one
// low-stock item to exercise those UI states), a few with sale prices,
// a few with size variants, and a couple of occasion tags.
const PRODUCT_DEFS = [
  {
    name: 'Red Rose Bouquet', sku: 'KF-BQ-ROSE-RED', basePrice: 149, stock: 40, isFeatured: true,
    categoryNames: ['Our Collection', 'Flowers', 'Rose Bouquets', "Valentine's Day Collection"],
    tags: ['Romantic', 'Best Seller'],
    variants: [
      { name: 'Small (6 roses)', skuSuffix: 'S', priceAdjustment: -30, stock: 15 },
      { name: 'Medium (12 roses)', skuSuffix: 'M', priceAdjustment: 0, stock: 20, isDefault: true },
      { name: 'Large (24 roses)', skuSuffix: 'L', priceAdjustment: 60, stock: 10 },
    ],
  },
  {
    name: 'Pink Rose Bouquet', sku: 'KF-BQ-ROSE-PINK', basePrice: 139, stock: 45,
    categoryNames: ['Our Collection', 'Flowers', 'Rose Bouquets'],
  },
  {
    name: 'White Rose Elegance', sku: 'KF-BQ-ROSE-WHITE', basePrice: 159, stock: 30,
    categoryNames: ['Our Collection', 'Flowers', 'Rose Bouquets', 'Anniversary Special'],
  },
  {
    name: 'Rainbow Rose Bouquet', sku: 'KF-BQ-ROSE-RAINBOW', basePrice: 189, discountPrice: 159, stock: 25,
    categoryNames: ['Our Collection', 'Flowers', 'Rose Bouquets'],
    tags: ['Trending'],
  },
  {
    name: 'Roses In A Box - Classic Red', sku: 'KF-BOX-ROSE-CLS', basePrice: 219, stock: 50, isFeatured: true,
    categoryNames: ['Our Collection', 'Flowers', 'Roses In A Box', 'Anniversary Special'],
    variants: [
      { name: '12 Roses', skuSuffix: '12', priceAdjustment: -40, stock: 18 },
      { name: '24 Roses', skuSuffix: '24', priceAdjustment: 0, stock: 20, isDefault: true },
      { name: '36 Roses', skuSuffix: '36', priceAdjustment: 90, stock: 12 },
    ],
  },
  {
    name: 'Roses In A Box - Pink Elegance', sku: 'KF-BOX-ROSE-PINK', basePrice: 209, stock: 20,
    categoryNames: ['Our Collection', 'Flowers', 'Roses In A Box', 'Birthday Special'],
  },
  {
    name: 'Roses In A Box - White & Gold', sku: 'KF-BOX-ROSE-WHTGLD', basePrice: 259, discountPrice: 229, stock: 15,
    categoryNames: ['Our Collection', 'Flowers', 'Roses In A Box', 'Anniversary Special'],
  },
  {
    name: 'Julieta Mix Bouquet', sku: 'KF-BQ-JULIETA', basePrice: 179, stock: 5, lowStockThreshold: 5,
    categoryNames: ['Our Collection', 'Flowers', 'Julieta Mix'],
  },
  {
    name: 'Julieta Mix Deluxe', sku: 'KF-BQ-JULIETA-DLX', basePrice: 229, stock: 18,
    categoryNames: ['Our Collection', 'Flowers', 'Julieta Mix'],
    variants: [
      { name: 'Regular', skuSuffix: 'REG', priceAdjustment: 0, stock: 10, isDefault: true },
      { name: 'Deluxe', skuSuffix: 'DLX', priceAdjustment: 50, stock: 8 },
    ],
  },
  {
    name: 'Mixed Seasonal Bouquet', sku: 'KF-BQ-MIXED-SSN', basePrice: 129, stock: 50,
    categoryNames: ['Our Collection', 'Flowers', 'Mixed Flowers'],
  },
  {
    name: 'Garden Fresh Mixed Bouquet', sku: 'KF-BQ-GARDEN-FRESH', basePrice: 119, stock: 40,
    categoryNames: ['Our Collection', 'Flowers', 'Mixed Flowers'],
  },
  {
    name: 'Tropical Bloom Arrangement', sku: 'KF-BQ-TROPICAL', basePrice: 169, stock: 22,
    categoryNames: ['Our Collection', 'Flowers', 'Mixed Flowers', 'Birthday Special'],
  },
  {
    name: 'Birthday Surprise Bouquet', sku: 'KF-BQ-BDAY-SURP', basePrice: 199, stock: 49, isFeatured: true,
    categoryNames: ['Our Collection', 'Flowers', 'Mixed Flowers', 'Birthday Special'],
  },
  {
    name: 'Sunshine Birthday Bouquet', sku: 'KF-BQ-BDAY-SUN', basePrice: 149, stock: 35,
    categoryNames: ['Our Collection', 'Flowers', 'Birthday Special'],
    tags: ['Cheerful'],
  },
  {
    name: 'Balloon & Bloom Birthday Combo', sku: 'KF-CMB-BDAY-BALLOON', basePrice: 219, stock: 12,
    categoryNames: ['Our Collection', 'Flowers', 'Birthday Special'],
  },
  {
    name: 'Anniversary Roses In A Box', sku: 'KF-BOX-ROSE-ANNIV', basePrice: 249, stock: 50, isFeatured: true,
    categoryNames: ['Our Collection', 'Flowers', 'Roses In A Box', 'Anniversary Special'],
  },
  {
    name: 'Golden Anniversary Arrangement', sku: 'KF-BQ-ANNIV-GOLD', basePrice: 279, discountPrice: 249, stock: 10,
    categoryNames: ['Our Collection', 'Flowers', 'Anniversary Special'],
  },
  {
    name: 'Eternal Love Bouquet', sku: 'KF-BQ-ETERNAL-LOVE', basePrice: 199, stock: 28,
    categoryNames: ['Our Collection', 'Flowers', 'Anniversary Special', "Valentine's Day Collection"],
  },
  {
    name: "Valentine's Heart Bouquet", sku: 'KF-BQ-VAL-HEART', basePrice: 189, stock: 0,
    categoryNames: ['Our Collection', 'Flowers', "Valentine's Day Collection"],
    tags: ['Romantic'],
  },
  {
    name: 'Sweetheart Rose Box', sku: 'KF-BOX-ROSE-SWEETHEART', basePrice: 229, discountPrice: 199, stock: 18, isFeatured: true,
    categoryNames: ['Our Collection', 'Flowers', "Valentine's Day Collection", 'Roses In A Box'],
  },
];

async function resolveTagIds(tagNames = []) {
  const ids = [];
  for (const name of tagNames) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({ where: { slug }, update: {}, create: { name, slug } });
    ids.push(tag.id);
  }
  return ids;
}

async function seedProducts(categories) {
  const byName = (name) => categories.find((c) => c.name === name);
  const createdProducts = [];

  for (const [index, item] of PRODUCT_DEFS.entries()) {
    const slug = slugify(item.name);
    const categoryIds = item.categoryNames.map((name) => byName(name).id).filter(Boolean);

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: item.name,
        slug,
        sku: item.sku,
        description: `${item.name} — freshly arranged and hand-delivered across the UAE. Every stem is hand-selected and the arrangement is made to order.`,
        shortDescription: `Beautifully arranged ${item.name.toLowerCase()}.`,
        basePrice: item.basePrice,
        discountPrice: item.discountPrice ?? null,
        stock: item.stock,
        lowStockThreshold: item.lowStockThreshold ?? 5,
        isActive: true,
        isFeatured: item.isFeatured ?? false,
      },
    });

    // Keep category assignments in sync with the definitions above on every
    // reseed, so the demo data stays representative of multi-category use.
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    await prisma.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId: product.id, categoryId })),
    });

    if (item.tags && item.tags.length) {
      const tagIds = await resolveTagIds(item.tags);
      await prisma.productTag.deleteMany({ where: { productId: product.id } });
      await prisma.productTag.createMany({ data: tagIds.map((tagId) => ({ productId: product.id, tagId })) });
    }

    if (item.variants && item.variants.length) {
      const existingVariants = await prisma.productVariant.count({ where: { productId: product.id } });
      if (existingVariants === 0) {
        await prisma.productVariant.createMany({
          data: item.variants.map((v) => ({
            productId: product.id,
            name: v.name,
            sku: `${item.sku}-${v.skuSuffix}`,
            priceAdjustment: v.priceAdjustment,
            stock: v.stock,
            isDefault: !!v.isDefault,
          })),
        });
      }
    }

    const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      const primary = writePlaceholderImage('products', { label: item.name, paletteIndex: index, width: 900, height: 900 });
      const secondary = writePlaceholderImage('products', { label: `${item.name} — Detail`, paletteIndex: index + 1, width: 900, height: 900 });
      await prisma.productImage.createMany({
        data: [
          { productId: product.id, url: primary, sortOrder: 0, isPrimary: true },
          { productId: product.id, url: secondary, sortOrder: 1, isPrimary: false },
        ],
      });
    }

    createdProducts.push(product);
  }

  console.log(`Ensured ${createdProducts.length} sample products (images, variants, tags, multi-category).`);
  return createdProducts;
}

const DEMO_CUSTOMERS = [
  {
    name: 'Sara Ahmed', email: 'sara.customer@example.com', phone: '+971502345678',
    address: { fullName: 'Sara Ahmed', phone: '+971502345678', addressLine1: 'Apartment 402, Marina Heights', city: 'Dubai', emirate: 'Dubai' },
  },
  {
    name: 'Omar Khalid', email: 'omar.customer@example.com', phone: '+971503456789',
    address: { fullName: 'Omar Khalid', phone: '+971503456789', addressLine1: 'Villa 7, Al Bateen', city: 'Abu Dhabi', emirate: 'Abu Dhabi' },
  },
];

const DEMO_CUSTOMER_PASSWORD = 'Customer@123';

async function seedDemoCustomers() {
  const customers = [];

  for (const def of DEMO_CUSTOMERS) {
    let user = await prisma.user.findUnique({ where: { email: def.email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(DEMO_CUSTOMER_PASSWORD, env.bcryptSaltRounds);
      user = await prisma.user.create({
        data: { name: def.name, email: def.email, phone: def.phone, password: hashedPassword, role: 'CUSTOMER', isEmailVerified: true },
      });
    }

    const existingAddress = await prisma.address.findFirst({ where: { userId: user.id } });
    if (!existingAddress) {
      await prisma.address.create({ data: { ...def.address, userId: user.id, isDefault: true } });
    }

    customers.push(user);
  }

  console.log(`Ensured ${customers.length} demo customer accounts (password: ${DEMO_CUSTOMER_PASSWORD}).`);
  return customers;
}

function computeOrderTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 200 ? 0 : 25;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;
  return { subtotal, shippingFee, tax, total };
}

async function createDemoOrder({ customer, products, statusPath, paymentMethod, daysAgoPlaced, note }) {
  const address = await prisma.address.findFirst({ where: { userId: customer.id } });
  const items = products.map((p) => ({
    productId: p.id, variantId: null, productName: p.name, sku: p.sku,
    price: Number(p.discountPrice ?? p.basePrice), quantity: 1,
  }));
  const { subtotal, shippingFee, tax, total } = computeOrderTotals(items);
  const finalStatus = statusPath[statusPath.length - 1];
  const paymentStatus = finalStatus === 'CANCELLED' ? 'FAILED' : paymentMethod === 'STRIPE' || finalStatus === 'DELIVERED' ? 'PAID' : 'PENDING';
  const placedAt = daysAgo(daysAgoPlaced);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: customer.id,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      status: finalStatus,
      paymentStatus,
      paymentMethod,
      subtotal,
      discountAmount: 0,
      shippingFee,
      tax,
      total,
      shippingAddress: {
        label: address.label, fullName: address.fullName, phone: address.phone,
        addressLine1: address.addressLine1, addressLine2: address.addressLine2,
        city: address.city, emirate: address.emirate, country: address.country, postalCode: address.postalCode,
      },
      notes: note || null,
      createdAt: placedAt,
      updatedAt: placedAt,
      items: { create: items.map(({ productId, variantId, productName, sku, price, quantity }) => ({ productId, variantId, productName, sku, price, quantity, subtotal: price * quantity })) },
      statusHistory: {
        create: statusPath.map((status, i) => ({
          status,
          note: i === 0 ? 'Order placed' : null,
          createdAt: new Date(placedAt.getTime() + i * 60 * 60 * 1000),
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

async function seedDemoOrders(customers, products) {
  const [sara, omar] = customers;
  const bySlug = (slug) => products.find((p) => p.slug === slug);

  const existingSaraOrders = await prisma.order.count({ where: { userId: sara.id } });
  const existingOmarOrders = await prisma.order.count({ where: { userId: omar.id } });

  const created = [];

  if (existingSaraOrders === 0) {
    created.push(
      await createDemoOrder({
        customer: sara,
        products: [bySlug('red-rose-bouquet'), bySlug('mixed-seasonal-bouquet')],
        statusPath: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
        paymentMethod: 'COD',
        daysAgoPlaced: 20,
      }),
      await createDemoOrder({
        customer: sara,
        products: [bySlug('roses-in-a-box-classic-red')],
        statusPath: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        paymentMethod: 'STRIPE',
        daysAgoPlaced: 5,
      }),
      await createDemoOrder({
        customer: sara,
        products: [bySlug('sunshine-birthday-bouquet')],
        statusPath: ['PENDING'],
        paymentMethod: 'COD',
        daysAgoPlaced: 0,
        note: 'Please deliver after 4pm',
      }),
      await createDemoOrder({
        customer: sara,
        products: [bySlug('julieta-mix-bouquet')],
        statusPath: ['PENDING', 'CONFIRMED', 'CANCELLED'],
        paymentMethod: 'COD',
        daysAgoPlaced: 10,
      }),
    );
  }

  if (existingOmarOrders === 0) {
    created.push(
      await createDemoOrder({
        customer: omar,
        products: [bySlug('birthday-surprise-bouquet'), bySlug('garden-fresh-mixed-bouquet'), bySlug('pink-rose-bouquet')],
        statusPath: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
        paymentMethod: 'COD',
        daysAgoPlaced: 15,
      }),
      await createDemoOrder({
        customer: omar,
        products: [bySlug('anniversary-roses-in-a-box')],
        statusPath: ['PENDING', 'CONFIRMED'],
        paymentMethod: 'STRIPE',
        daysAgoPlaced: 2,
      }),
    );
  }

  if (created.length) console.log(`Ensured ${created.length} demo orders across ${customers.length} customers.`);
  return created;
}

async function recomputeProductRating(productId) {
  const agg = await prisma.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: { rating: true } });
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0, reviewCount: agg._count.rating },
  });
}

const DEMO_REVIEWS = [
  { customerIndex: 0, productSlug: 'red-rose-bouquet', rating: 5, title: 'Absolutely stunning', comment: 'The roses were fresh and the arrangement looked exactly like the photos. Delivered right on time.' },
  { customerIndex: 0, productSlug: 'mixed-seasonal-bouquet', rating: 4, title: 'Lovely bouquet', comment: 'Beautiful mix of colors, lasted over a week. Would order again.' },
  { customerIndex: 1, productSlug: 'birthday-surprise-bouquet', rating: 5, title: 'Made her day', comment: 'My sister loved it! Great value for the price and the packaging was so nice.' },
  { customerIndex: 1, productSlug: 'garden-fresh-mixed-bouquet', rating: 4, title: 'Fresh and fragrant', comment: 'Smelled amazing the moment it arrived. A couple of stems were slightly wilted but overall great.' },
];

async function seedReviews(customers, products) {
  const bySlug = (slug) => products.find((p) => p.slug === slug);
  let createdCount = 0;

  for (const def of DEMO_REVIEWS) {
    const customer = customers[def.customerIndex];
    const product = bySlug(def.productSlug);
    if (!product) continue;

    const deliveredOrderItem = await prisma.orderItem.findFirst({
      where: { productId: product.id, order: { userId: customer.id, status: 'DELIVERED' } },
      include: { order: true },
    });
    if (!deliveredOrderItem) continue;

    const existing = await prisma.review.findFirst({
      where: { userId: customer.id, productId: product.id, orderId: deliveredOrderItem.orderId },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        productId: product.id, userId: customer.id, orderId: deliveredOrderItem.orderId,
        rating: def.rating, title: def.title, comment: def.comment, isApproved: true,
      },
    });
    await recomputeProductRating(product.id);
    createdCount++;
  }

  if (createdCount) console.log(`Ensured ${createdCount} approved sample reviews.`);
}

async function seedWishlist(customers, products) {
  const bySlug = (slug) => products.find((p) => p.slug === slug);
  const wishlistDefs = [
    { customerIndex: 0, productSlugs: ['rainbow-rose-bouquet', 'golden-anniversary-arrangement'] },
    { customerIndex: 1, productSlugs: ['sweetheart-rose-box'] },
  ];

  let createdCount = 0;
  for (const def of wishlistDefs) {
    const customer = customers[def.customerIndex];
    for (const slug of def.productSlugs) {
      const product = bySlug(slug);
      if (!product) continue;
      const existing = await prisma.wishlist.findUnique({ where: { userId_productId: { userId: customer.id, productId: product.id } } });
      if (existing) continue;
      await prisma.wishlist.create({ data: { userId: customer.id, productId: product.id } });
      createdCount++;
    }
  }

  if (createdCount) console.log(`Ensured ${createdCount} sample wishlist entries.`);
}

async function seedBanners() {
  const existingCount = await prisma.banner.count();
  if (existingCount > 0) {
    console.log(`Banners already present (${existingCount}) — skipping banner seed.`);
    return;
  }

  const defs = [
    { title: 'Fresh Blooms, Delivered Today', position: 'HOME_HERO', sortOrder: 0, link: '/products', paletteIndex: 0 },
    { title: "Valentine's Day Collection", position: 'HOME_HERO', sortOrder: 1, link: '/categories/valentines-day-collection', paletteIndex: 5 },
    { title: 'Free Delivery Over AED 200', position: 'PROMO_STRIP', sortOrder: 0, link: '/', paletteIndex: 2 },
  ];

  for (const def of defs) {
    const imageUrl = writePlaceholderImage('banners', { label: def.title, paletteIndex: def.paletteIndex, width: 1600, height: 500 });
    await prisma.banner.create({
      data: { title: def.title, imageUrl, link: def.link, position: def.position, sortOrder: def.sortOrder, isActive: true },
    });
  }

  console.log(`Created ${defs.length} sample banners.`);
}

const COUPON_DEFS = [
  {
    code: 'WELCOME10', description: '10% off your first order', discountType: 'PERCENTAGE', discountValue: 10,
    usageLimitPerUser: 1, expiresAt: daysFromNow(90),
  },
  {
    code: 'SAVE20', description: 'AED 20 off orders over AED 150', discountType: 'FIXED', discountValue: 20,
    minOrderAmount: 150, usageLimitPerUser: 1, expiresAt: daysFromNow(60),
  },
  {
    code: 'FLASH25', description: 'Flash sale — 25% off, up to AED 75', discountType: 'PERCENTAGE', discountValue: 25,
    maxDiscountAmount: 75, usageLimit: 100, usageLimitPerUser: 1, expiresAt: daysFromNow(14),
  },
  {
    code: 'BIGORDER50', description: 'AED 50 off orders over AED 500', discountType: 'FIXED', discountValue: 50,
    minOrderAmount: 500, usageLimitPerUser: 2, expiresAt: daysFromNow(90),
  },
  {
    code: 'EXPIRED5', description: '(Demo) An already-expired coupon, for testing the expired-coupon UI state', discountType: 'FIXED', discountValue: 5,
    usageLimitPerUser: 1, expiresAt: daysAgo(1), isActive: true,
  },
];

async function seedCoupons() {
  let createdCount = 0;
  for (const def of COUPON_DEFS) {
    const existing = await prisma.coupon.findUnique({ where: { code: def.code } });
    if (existing) continue;
    await prisma.coupon.create({
      data: {
        code: def.code, description: def.description, discountType: def.discountType, discountValue: def.discountValue,
        minOrderAmount: def.minOrderAmount ?? null, maxDiscountAmount: def.maxDiscountAmount ?? null,
        usageLimit: def.usageLimit ?? null, usageLimitPerUser: def.usageLimitPerUser ?? 1,
        expiresAt: def.expiresAt, isActive: def.isActive ?? true,
      },
    });
    createdCount++;
  }
  if (createdCount) console.log(`Created ${createdCount} sample coupons (${COUPON_DEFS.map((c) => c.code).join(', ')}).`);
}

async function main() {
  console.log('Seeding database...');
  await seedSuperAdmin();
  await seedSettings();
  await cleanupLegacyPlaceholderData();
  const categories = await seedCategories();
  const products = await seedProducts(categories);
  const customers = await seedDemoCustomers();
  await seedDemoOrders(customers, products);
  await seedReviews(customers, products);
  await seedWishlist(customers, products);
  await seedBanners();
  await seedCoupons();
  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
