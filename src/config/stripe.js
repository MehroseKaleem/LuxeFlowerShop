const Stripe = require('stripe');
const env = require('./env');
const logger = require('./logger');

let stripeClient = null;

if (env.stripe.secretKey) {
  stripeClient = new Stripe(env.stripe.secretKey, {
    apiVersion: '2024-06-20',
  });
} else {
  logger.warn('[stripe] STRIPE_SECRET_KEY not set — Stripe payments are disabled.');
}

module.exports = stripeClient;
