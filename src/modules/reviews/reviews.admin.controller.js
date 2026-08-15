const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const reviewsService = require('./reviews.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewsService.adminList(req.query);
  new ApiResponse(200, { reviews: items }, 'Success', meta).send(res);
});

const approve = asyncHandler(async (req, res) => {
  const review = await reviewsService.adminApprove(Number(req.params.id));
  await logAdminActivity(req, { action: 'REVIEW_APPROVE', entityType: 'Review', entityId: review.id });
  new ApiResponse(200, { review }, 'Review approved').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await reviewsService.adminDelete(Number(req.params.id));
  await logAdminActivity(req, { action: 'REVIEW_DELETE', entityType: 'Review', entityId: req.params.id });
  new ApiResponse(200, null, 'Review deleted').send(res);
});

module.exports = { list, approve, remove };
