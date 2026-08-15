const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const cartService = require('./cart.service');

const resolveContext = (req) => ({
  userId: req.user ? req.user.id : undefined,
  sessionId: req.user ? undefined : req.headers['x-cart-session'],
});

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(resolveContext(req));
  new ApiResponse(200, { cart }).send(res);
});

const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(resolveContext(req), {
    productId: Number(req.body.productId),
    variantId: req.body.variantId ? Number(req.body.variantId) : null,
    quantity: Number(req.body.quantity) || 1,
  });
  new ApiResponse(200, { cart }, 'Item added to cart').send(res);
});

const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(
    resolveContext(req),
    Number(req.params.itemId),
    Number(req.body.quantity),
  );
  new ApiResponse(200, { cart }, 'Cart updated').send(res);
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(resolveContext(req), Number(req.params.itemId));
  new ApiResponse(200, { cart }, 'Item removed').send(res);
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(resolveContext(req));
  new ApiResponse(200, { cart }, 'Cart cleared').send(res);
});

const applyCoupon = asyncHandler(async (req, res) => {
  const context = resolveContext(req);
  const email = req.user ? req.user.email : req.body.email;
  const phone = req.user ? req.user.phone : req.body.phone;

  if (!req.user && (!email || !phone)) {
    throw ApiError.badRequest('Email and phone are required to apply a coupon as a guest');
  }

  const cart = await cartService.applyCoupon(context, req.body.code, { email, phone });
  new ApiResponse(200, { cart }, 'Coupon applied').send(res);
});

const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCoupon(resolveContext(req));
  new ApiResponse(200, { cart }, 'Coupon removed').send(res);
});

const mergeGuestCart = asyncHandler(async (req, res) => {
  const cart = await cartService.mergeGuestCart(req.user.id, req.body.sessionId);
  new ApiResponse(200, { cart }, 'Guest cart merged').send(res);
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeGuestCart,
};
