const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const couponsService = require('./coupons.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await couponsService.list(req.query);
  new ApiResponse(200, { coupons: items }, 'Success', meta).send(res);
});

const get = asyncHandler(async (req, res) => {
  const coupon = await couponsService.get(Number(req.params.id));
  new ApiResponse(200, { coupon }).send(res);
});

const create = asyncHandler(async (req, res) => {
  const coupon = await couponsService.create(req.body);
  await logAdminActivity(req, {
    action: 'COUPON_CREATE',
    entityType: 'Coupon',
    entityId: coupon.id,
    details: { code: coupon.code },
  });
  new ApiResponse(201, { coupon }, 'Coupon created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const coupon = await couponsService.update(Number(req.params.id), req.body);
  await logAdminActivity(req, { action: 'COUPON_UPDATE', entityType: 'Coupon', entityId: coupon.id });
  new ApiResponse(200, { coupon }, 'Coupon updated').send(res);
});

const toggleActive = asyncHandler(async (req, res) => {
  const coupon = await couponsService.toggleActive(Number(req.params.id));
  await logAdminActivity(req, {
    action: 'COUPON_TOGGLE',
    entityType: 'Coupon',
    entityId: coupon.id,
    details: { isActive: coupon.isActive },
  });
  new ApiResponse(200, { coupon }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await couponsService.remove(Number(req.params.id));
  await logAdminActivity(req, { action: 'COUPON_DELETE', entityType: 'Coupon', entityId: req.params.id });
  new ApiResponse(200, null, 'Coupon deleted').send(res);
});

module.exports = { list, get, create, update, toggleActive, remove };
