const prisma = require('../../config/prisma');
const stripe = require('../../config/stripe');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

async function getOrderForPaymentAccess(orderNumber, { userId, email }) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = userId ? order.userId === userId : order.customerEmail === (email || '').toLowerCase();
  if (!isOwner) throw ApiError.forbidden('You do not have access to this order');

  return order;
}

async function createPaymentIntent(orderNumber, accessContext) {
  if (!stripe) throw ApiError.internal('Online payments are currently unavailable');

  const order = await getOrderForPaymentAccess(orderNumber, accessContext);

  if (order.paymentMethod !== 'STRIPE') {
    throw ApiError.badRequest('This order is not set up for online payment');
  }
  if (order.paymentStatus === 'PAID') {
    throw ApiError.badRequest('This order has already been paid');
  }

  const amountInFils = Math.round(Number(order.total) * 100);

  const intent = await stripe.paymentIntents.create({
    amount: amountInFils,
    currency: env.stripe.currency,
    metadata: { orderId: String(order.id), orderNumber: order.orderNumber },
    receipt_email: order.customerEmail,
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: intent.id } });

  return { clientSecret: intent.client_secret };
}

async function handleWebhookEvent(rawBody, signature) {
  if (!stripe || !env.stripe.webhookSecret) {
    throw ApiError.internal('Stripe webhook is not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const order = await prisma.order.findFirst({ where: { stripePaymentIntentId: intent.id } });
      if (order && order.paymentStatus !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
            statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed via Stripe' } },
          },
        });
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      const order = await prisma.order.findFirst({ where: { stripePaymentIntentId: intent.id } });
      if (order) {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'FAILED' } });
      }
      break;
    }
    default:
      logger.info(`[stripe] Unhandled webhook event type: ${event.type}`);
  }

  return { received: true };
}

module.exports = { createPaymentIntent, handleWebhookEvent };
