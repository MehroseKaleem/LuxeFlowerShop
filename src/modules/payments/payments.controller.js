const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const paymentsService = require('./payments.service');

const createIntent = asyncHandler(async (req, res) => {
  const accessContext = { userId: req.user ? req.user.id : undefined, email: req.body.email };
  const result = await paymentsService.createPaymentIntent(req.body.orderNumber, accessContext);
  new ApiResponse(200, result).send(res);
});

const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await paymentsService.handleWebhookEvent(req.body, signature);
  res.status(200).json(result);
});

module.exports = { createIntent, webhook };
