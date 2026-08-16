const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const reviewsService = require('./reviews.service');

const listForProduct = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewsService.listForProduct(req.params.slug, req.query);
  new ApiResponse(200, { reviews: items }, 'Success', meta).send(res);
});

const featured = asyncHandler(async (req, res) => {
  const reviews = await reviewsService.featured(req.query);
  new ApiResponse(200, { reviews }, 'Success').send(res);
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewsService.create(req.user.id, req.body);
  new ApiResponse(201, { review }, 'Review submitted and pending approval').send(res);
});

const updateOwn = asyncHandler(async (req, res) => {
  const review = await reviewsService.updateOwn(req.user.id, Number(req.params.id), req.body);
  new ApiResponse(200, { review }, 'Review updated and pending re-approval').send(res);
});

const deleteOwn = asyncHandler(async (req, res) => {
  await reviewsService.deleteOwn(req.user.id, Number(req.params.id));
  new ApiResponse(200, null, 'Review deleted').send(res);
});

module.exports = { listForProduct, featured, create, updateOwn, deleteOwn };
