const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const cartService = require('./cart.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await cartService.adminListCarts(req.query);
  new ApiResponse(200, { carts: items }, 'Success', meta).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await cartService.adminDeleteCart(Number(req.params.id));
  await logAdminActivity(req, { action: 'CART_DELETE', entityType: 'Cart', entityId: req.params.id });
  new ApiResponse(200, null, 'Cart deleted').send(res);
});

module.exports = { list, remove };
