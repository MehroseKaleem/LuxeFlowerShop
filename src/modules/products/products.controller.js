const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const productsService = require('./products.service');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productsService.listPublic(req.query);
  new ApiResponse(200, { products: items }, 'Success', meta).send(res);
});

const getBySlug = asyncHandler(async (req, res) => {
  const product = await productsService.getBySlugPublic(req.params.slug);
  new ApiResponse(200, { product }).send(res);
});

const featured = asyncHandler(async (req, res) => {
  const products = await productsService.getFeatured(Number(req.query.limit) || 8);
  new ApiResponse(200, { products }).send(res);
});

const related = asyncHandler(async (req, res) => {
  const products = await productsService.getRelated(req.params.slug, Number(req.query.limit) || 8);
  new ApiResponse(200, { products }).send(res);
});

module.exports = { list, getBySlug, featured, related };
