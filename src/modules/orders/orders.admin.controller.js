const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ordersService = require('./orders.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await ordersService.adminList(req.query);
  new ApiResponse(200, { orders: items }, 'Success', meta).send(res);
});

const get = asyncHandler(async (req, res) => {
  const order = await ordersService.adminGet(Number(req.params.id));
  new ApiResponse(200, { order }).send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await ordersService.adminUpdateStatus(Number(req.params.id), req.body, req.user.id);
  await logAdminActivity(req, {
    action: 'ORDER_STATUS_UPDATE',
    entityType: 'Order',
    entityId: order.id,
    details: { status: req.body.status },
  });
  new ApiResponse(200, { order }, 'Order status updated').send(res);
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  const order = await ordersService.adminUpdatePaymentStatus(Number(req.params.id), req.body.paymentStatus);
  await logAdminActivity(req, {
    action: 'ORDER_PAYMENT_STATUS_UPDATE',
    entityType: 'Order',
    entityId: order.id,
    details: { paymentStatus: req.body.paymentStatus },
  });
  new ApiResponse(200, { order }, 'Payment status updated').send(res);
});

const createManualOrder = asyncHandler(async (req, res) => {
  const { order, paymentLinkUrl } = await ordersService.adminCreateManualOrder(req.body);
  await logAdminActivity(req, {
    action: 'ORDER_MANUAL_PAYMENT_LINK_CREATED',
    entityType: 'Order',
    entityId: order.id,
    details: { orderNumber: order.orderNumber, total: order.total },
  });
  new ApiResponse(201, { order, paymentLinkUrl }, 'Order created and payment link generated').send(res);
});

module.exports = { list, get, updateStatus, updatePaymentStatus, createManualOrder };
