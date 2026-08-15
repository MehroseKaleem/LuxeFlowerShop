const ApiError = require('./ApiError');

/**
 * Shared coupon validation/application logic used by both the cart
 * "preview" endpoint (validation only) and order placement (validation +
 * commit inside a DB transaction). Keeping this in one place guarantees
 * the two call sites can never drift out of sync on the business rules.
 */

async function findCouponByCode(db, code) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon) throw ApiError.notFound('Invalid coupon code');
  return coupon;
}

function assertCouponIsUsable(coupon) {
  const now = new Date();
  if (!coupon.isActive) {
    throw ApiError.badRequest('This coupon is no longer active');
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    throw ApiError.badRequest('This coupon is not active yet');
  }
  if (now > coupon.expiresAt) {
    throw ApiError.badRequest('This coupon has expired');
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
}

/**
 * A coupon can be used at most `usageLimitPerUser` times (default 1) by the
 * same *person* — matched by account id, email, OR phone number, so a guest
 * checkout or a second account with the same contact details can't reuse it.
 */
async function assertPerPersonLimit(db, coupon, { userId, email, phone }) {
  const orConditions = [];
  if (userId) orConditions.push({ userId });
  if (email) orConditions.push({ email: email.toLowerCase() });
  if (phone) orConditions.push({ phone });
  if (!orConditions.length) return;

  const usageCount = await db.couponUsage.count({
    where: { couponId: coupon.id, OR: orConditions },
  });

  if (usageCount >= coupon.usageLimitPerUser) {
    throw ApiError.badRequest('You have already used this coupon');
  }
}

function assertMinOrderAmount(coupon, subtotal) {
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    throw ApiError.badRequest(`Minimum order amount for this coupon is AED ${coupon.minOrderAmount}`);
  }
}

function computeDiscount(coupon, subtotal) {
  let discount;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (Number(coupon.discountValue) / 100) * subtotal;
  } else {
    discount = Number(coupon.discountValue);
  }
  if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
    discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  }
  discount = Math.min(discount, subtotal);
  return Math.round(discount * 100) / 100;
}

/**
 * Validates a coupon code for a given cart/person, without recording usage.
 * Safe to call repeatedly (cart preview, re-checking at checkout page load).
 */
async function validateCoupon(db, { code, subtotal, userId, email, phone }) {
  if (!code) throw ApiError.badRequest('Coupon code is required');
  if (!email && !phone && !userId) {
    throw ApiError.badRequest('Email or phone is required to validate a coupon');
  }

  const coupon = await findCouponByCode(db, code);
  assertCouponIsUsable(coupon);
  assertMinOrderAmount(coupon, subtotal);
  await assertPerPersonLimit(db, coupon, { userId, email, phone });

  const discountAmount = computeDiscount(coupon, subtotal);
  return { coupon, discountAmount };
}

/**
 * Re-validates and commits coupon usage. MUST be called with a Prisma
 * transaction client (`tx`) in the same transaction as order creation, so
 * the re-check + usage insert + counter increment are atomic and close the
 * race window on concurrent double-submits.
 */
async function recordCouponUsage(tx, { couponId, subtotal, orderId, userId, email, phone }) {
  const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw ApiError.notFound('Invalid coupon code');

  assertCouponIsUsable(coupon);
  assertMinOrderAmount(coupon, subtotal);
  await assertPerPersonLimit(tx, coupon, { userId, email, phone });

  await tx.couponUsage.create({
    data: {
      couponId: coupon.id,
      userId: userId || null,
      email: email.toLowerCase(),
      phone,
      orderId,
    },
  });

  await tx.coupon.update({
    where: { id: coupon.id },
    data: { usedCount: { increment: 1 } },
  });

  return computeDiscount(coupon, subtotal);
}

/**
 * Lightweight re-check for simply *displaying* a previously-applied coupon
 * on a cart, where no identity (email/phone) is available yet — e.g. a
 * guest cart being re-fetched after a page refresh. Confirms the coupon is
 * still active, within its date window, and under its global usage cap.
 * The per-person limit is enforced at apply-time (identity is known then)
 * and re-enforced authoritatively inside `recordCouponUsage` at checkout.
 */
async function reconfirmCouponForDisplay(db, couponId, subtotal) {
  const coupon = await db.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  assertCouponIsUsable(coupon);
  assertMinOrderAmount(coupon, subtotal);
  return { coupon, discountAmount: computeDiscount(coupon, subtotal) };
}

module.exports = {
  validateCoupon,
  recordCouponUsage,
  reconfirmCouponForDisplay,
  computeDiscount,
  assertCouponIsUsable,
};
