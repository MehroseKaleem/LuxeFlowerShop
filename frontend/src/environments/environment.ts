export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1',
  // Set this to your Stripe publishable key (pk_test_... in dev, pk_live_... in
  // production) to enable card payments at checkout. Left blank, checkout
  // still works fully via Cash on Delivery.
  stripePublishableKey: '',
};
