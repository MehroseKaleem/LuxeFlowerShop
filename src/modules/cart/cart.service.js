const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { validateCoupon, reconfirmCouponForDisplay } = require('../../utils/couponEngine');

const ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      basePrice: true,
      discountPrice: true,
      stock: true,
      isActive: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  },
  variant: true,
};

function effectiveUnitPrice(product, variant) {
  const base = product.discountPrice !== null && product.discountPrice !== undefined
    ? Number(product.discountPrice)
    : Number(product.basePrice);
  const adjustment = variant ? Number(variant.priceAdjustment) : 0;
  return Math.round((base + adjustment) * 100) / 100;
}

async function getOrCreateCart({ userId, sessionId }) {
  if (userId) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });
    return cart;
  }

  if (!sessionId) throw ApiError.badRequest('A cart session id is required for guest carts');

  let cart = await prisma.cart.findUnique({ where: { sessionId } });
  if (!cart) cart = await prisma.cart.create({ data: { sessionId } });
  return cart;
}

async function buildCartResponse(cart) {
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, include: ITEM_INCLUDE });

  let subtotal = 0;
  const lineItems = items.map((item) => {
    const unitPrice = effectiveUnitPrice(item.product, item.variant);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      product: item.product,
      variant: item.variant,
      inStock: item.product.isActive && item.product.stock >= item.quantity,
    };
  });
  subtotal = Math.round(subtotal * 100) / 100;

  let coupon = null;
  let discountAmount = 0;

  if (cart.couponId) {
    try {
      const result = await reconfirmCouponForDisplay(prisma, cart.couponId, subtotal);
      coupon = {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      };
      discountAmount = result.discountAmount;
    } catch (err) {
      // Coupon became invalid (expired/deactivated/limit reached) since it was applied — silently drop it.
      await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    }
  }

  return {
    id: cart.id,
    items: lineItems,
    subtotal,
    coupon,
    discountAmount,
    total: Math.max(Math.round((subtotal - discountAmount) * 100) / 100, 0),
  };
}

async function getCart(context) {
  const cart = await getOrCreateCart(context);
  return buildCartResponse(cart);
}

/**
 * Raw cart + line items (with product/variant rows attached) for internal
 * use by the orders module when placing an order — the storefront-facing
 * `getCart` return shape is display-oriented and intentionally lossy.
 */
async function getRawCart(context) {
  const cart = await getOrCreateCart(context);
  const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, include: ITEM_INCLUDE });
  return { cart, items };
}

async function addItem(context, { productId, variantId, quantity }) {
  const cart = await getOrCreateCart(context);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  let variant = null;
  if (variantId) {
    variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId || !variant.isActive) {
      throw ApiError.badRequest('Invalid product variant');
    }
  }

  const stockAvailable = variant ? variant.stock : product.stock;
  // findUnique on a compound key rejects `null` for a nullable member (even
  // though the underlying @@unique allows it), so a plain product (no
  // variant) has to be looked up with findFirst instead.
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId || null },
  });

  const newQuantity = (existing ? existing.quantity : 0) + quantity;
  if (newQuantity > stockAvailable) {
    throw ApiError.badRequest(`Only ${stockAvailable} unit(s) available in stock`);
  }

  const unitPrice = effectiveUnitPrice(product, variant);

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity, priceSnapshot: unitPrice },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
        priceSnapshot: unitPrice,
      },
    });
  }

  return buildCartResponse(cart);
}

async function updateItemQuantity(context, itemId, quantity) {
  const cart = await getOrCreateCart(context);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true, variant: true } });
  if (!item || item.cartId !== cart.id) throw ApiError.notFound('Cart item not found');

  const stockAvailable = item.variant ? item.variant.stock : item.product.stock;
  if (quantity > stockAvailable) {
    throw ApiError.badRequest(`Only ${stockAvailable} unit(s) available in stock`);
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  return buildCartResponse(cart);
}

async function removeItem(context, itemId) {
  const cart = await getOrCreateCart(context);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cart.id) throw ApiError.notFound('Cart item not found');

  await prisma.cartItem.delete({ where: { id: itemId } });
  return buildCartResponse(cart);
}

async function clearCart(context) {
  const cart = await getOrCreateCart(context);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return buildCartResponse(cart);
}

async function applyCoupon(context, code, { email, phone }) {
  const cart = await getOrCreateCart(context);
  const response = await buildCartResponse(cart);

  if (!response.items.length) throw ApiError.badRequest('Your cart is empty');

  const { coupon, discountAmount } = await validateCoupon(prisma, {
    code,
    subtotal: response.subtotal,
    userId: context.userId || null,
    email,
    phone,
  });

  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });

  const result = await buildCartResponse({ ...cart, couponId: coupon.id });
  result.discountAmount = discountAmount;
  result.total = Math.max(Math.round((result.subtotal - discountAmount) * 100) / 100, 0);
  return result;
}

async function removeCoupon(context) {
  const cart = await getOrCreateCart(context);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return buildCartResponse(cart);
}

async function mergeGuestCart(userId, sessionId) {
  if (!sessionId) return;

  const guestCart = await prisma.cart.findUnique({ where: { sessionId }, include: { items: true } });
  if (!guestCart) return;

  const userCart = await getOrCreateCart({ userId });

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  return buildCartResponse(userCart);
}

module.exports = {
  getOrCreateCart,
  getCart,
  getRawCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeGuestCart,
  effectiveUnitPrice,
};
