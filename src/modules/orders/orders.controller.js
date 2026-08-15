const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ordersService = require('./orders.service');

const resolveContext = (req) => ({
  userId: req.user ? req.user.id : undefined,
  sessionId: req.user ? undefined : req.headers['x-cart-session'],
});

const createOrder = asyncHandler(async (req, res) => {
  const order = await ordersService.createOrder(resolveContext(req), req.body);
  new ApiResponse(201, { order }, 'Order placed successfully').send(res);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { items, meta } = await ordersService.getMyOrders(req.user.id, req.query);
  new ApiResponse(200, { orders: items }, 'Success', meta).send(res);
});

const getMyOrderByNumber = asyncHandler(async (req, res) => {
  const order = await ordersService.getMyOrderByNumber(req.user.id, req.params.orderNumber);
  new ApiResponse(200, { order }).send(res);
});

module.exports = { createOrder, getMyOrders, getMyOrderByNumber };
