const prisma = require('../../config/prisma');
const stripe = require('../../config/stripe');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');
const generateOrderNumber = require('../../utils/orderNumber');
const { validateCoupon, recordCouponUsage } = require('../../utils/couponEngine');
const { getRawCart, effectiveUnitPrice } = require('../cart/cart.service');
const settingsService = require('../settings/settings.service');
const { sendMail, templates } = require('../../config/mailer');

const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: 'asc' } },
};

function resolveShippingAddress(body) {
  const required = ['fullName', 'phone', 'addressLine1', 'city', 'emirate'];
  for (const field of required) {
    if (!body.shippingAddress || !body.shippingAddress[field]) {
      throw ApiError.badRequest(`shippingAddress.${field} is required`);
    }
  }
  return {
    label: body.shippingAddress.label || 'Home',
    fullName: body.shippingAddress.fullName,
    phone: body.shippingAddress.phone,
    addressLine1: body.shippingAddress.addressLine1,
    addressLine2: body.shippingAddress.addressLine2 || null,
    city: body.shippingAddress.city,
    emirate: body.shippingAddress.emirate,
    country: body.shippingAddress.country || 'AE',
    postalCode: body.shippingAddress.postalCode || null,
  };
}

async function resolveShippingAddressFromSaved(userId, addressId) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound('Shipping address not found');
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, isDefault: _isDefault, ...snapshot } = address;
  return snapshot;
}

async function createOrder(context, body) {
  const { cart, items } = await getRawCart(context);
  if (!items.length) throw ApiError.badRequest('Your cart is empty');

  const customerEmail = context.userId ? undefined : body.guestEmail;
  const customerPhone = context.userId ? undefined : body.guestPhone;

  let user = null;
  if (context.userId) {
    user = await prisma.user.findUnique({ where: { id: context.userId } });
    if (!user) throw ApiError.unauthorized('User not found');
  } else if (!customerEmail || !customerPhone) {
    throw ApiError.badRequest('guestEmail and guestPhone are required for guest checkout');
  }

  const finalEmail = user ? user.email : customerEmail.toLowerCase();
  const finalPhone = user ? user.phone : customerPhone;

  // Compute subtotal from live prices (never trust client-sent prices).
  let subtotal = 0;
  const orderItemsData = [];
  for (const item of items) {
    if (!item.product.isActive) {
      throw ApiError.badRequest(`"${item.product.name}" is no longer available`);
    }

    const unitPrice = effectiveUnitPrice(item.product, item.variant);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    subtotal += lineTotal;

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantName: item.variant ? item.variant.name : null,
      sku: item.variant ? item.variant.sku : item.product.sku,
      price: unitPrice,
      quantity: item.quantity,
      subtotal: lineTotal,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;

  const shippingAddress = body.shippingAddressId
    ? await resolveShippingAddressFromSaved(context.userId, Number(body.shippingAddressId))
    : resolveShippingAddress(body);

  const billingAddress = body.billingAddress || null;

  const [shippingFee, tax] = await Promise.all([
    settingsService.computeShippingFee(subtotal),
    settingsService.computeTax(subtotal),
  ]);

  const couponCode = body.couponCode || null;
  let couponResult = null;
  if (couponCode) {
    couponResult = await validateCoupon(prisma, {
      code: couponCode,
      subtotal,
      userId: context.userId || null,
      email: finalEmail,
      phone: finalPhone,
    });
  }
  const discountAmount = couponResult ? couponResult.discountAmount : 0;
  const total = Math.max(Math.round((subtotal - discountAmount + shippingFee + tax) * 100) / 100, 0);

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: context.userId || null,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
        paymentMethod: body.paymentMethod,
        subtotal,
        discountAmount,
        shippingFee,
        tax,
        total,
        couponId: couponResult ? couponResult.coupon.id : null,
        couponCode: couponResult ? couponResult.coupon.code : null,
        shippingAddress,
        billingAddress,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        deliveryTimeSlot: body.deliveryTimeSlot || null,
        notes: body.notes || null,
        items: { create: orderItemsData },
        statusHistory: { create: { status: 'PENDING', note: 'Order placed' } },
      },
      include: ORDER_INCLUDE,
    });

    if (couponResult) {
      await recordCouponUsage(tx, {
        couponId: couponResult.coupon.id,
        subtotal,
        orderId: createdOrder.id,
        userId: context.userId || null,
        email: finalEmail,
        phone: finalPhone,
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (context.userId) {
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    } else {
      await tx.cart.delete({ where: { id: cart.id } });
    }

    return createdOrder;
  });

  // For card payments, no money has actually moved yet at this point - the
  // order only exists so Stripe has something to attach a PaymentIntent to.
  // Sending "Order Confirmed" now would be misleading (and wrong if the
  // card is declined). That email fires from the Stripe webhook instead,
  // once payment_intent.succeeded actually confirms the charge went
  // through. Cash on Delivery has no payment step to wait for, so it's
  // confirmed immediately as before.
  if (order.paymentMethod !== 'STRIPE') {
    sendMail({
      to: finalEmail,
      subject: `Order Confirmed — #${order.orderNumber}`,
      html: templates.orderConfirmation(shippingAddress.fullName, order),
    });
  }

  return order;
}

async function getMyOrders(userId, query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'total', 'status'] });
  return paginate(prisma.order, {
    where: { userId },
    pagination,
    include: { items: true },
  });
}

async function getMyOrderByNumber(userId, orderNumber) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: ORDER_INCLUDE });
  if (!order || order.userId !== userId) throw ApiError.notFound('Order not found');
  return order;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

async function adminList(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'total', 'status'] });
  const where = {};
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search } },
      { customerEmail: { contains: query.search } },
      { customerPhone: { contains: query.search } },
    ];
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  return paginate(prisma.order, {
    where,
    pagination,
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });
}

async function adminGet(id) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...ORDER_INCLUDE, user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

async function adminUpdateStatus(id, { status, note }, adminId) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot transition order from ${order.status} to ${status}`);
  }

  // For a Stripe-paid order, "Refunded" needs to actually move money back to
  // the customer's card, not just relabel the order - call Stripe's refund
  // API first and only touch our own records if that succeeds, so we never
  // show "Refunded" without a real refund behind it. COD has no charge to
  // reverse through Stripe, so it stays a plain status change there.
  if (status === 'REFUNDED' && order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID') {
    if (!stripe || !order.stripePaymentIntentId) {
      throw ApiError.badRequest('This order has no associated Stripe payment to refund.');
    }
    try {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    } catch (err) {
      throw ApiError.badRequest(`Stripe refund failed: ${err.message}`);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const paymentStatusUpdate =
      status === 'DELIVERED' && order.paymentMethod === 'COD' ? { paymentStatus: 'PAID' } : {};
    const cancelPaymentUpdate = status === 'CANCELLED' && order.paymentStatus === 'PENDING' ? { paymentStatus: 'FAILED' } : {};
    const refundPaymentUpdate = status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {};

    const result = await tx.order.update({
      where: { id },
      data: {
        status,
        ...paymentStatusUpdate,
        ...cancelPaymentUpdate,
        ...refundPaymentUpdate,
        statusHistory: { create: { status, note: note || null, changedById: adminId } },
      },
      include: ORDER_INCLUDE,
    });

    return result;
  });

  sendMail({
    to: updated.customerEmail,
    subject: `Order #${updated.orderNumber} Update`,
    html: templates.orderStatusUpdate(updated.shippingAddress.fullName, updated),
  });

  return updated;
}

async function adminUpdatePaymentStatus(id, paymentStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw ApiError.notFound('Order not found');
  return prisma.order.update({ where: { id }, data: { paymentStatus } });
}

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderByNumber,
  adminList,
  adminGet,
  adminUpdateStatus,
  adminUpdatePaymentStatus,
};
