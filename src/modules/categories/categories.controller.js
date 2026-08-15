const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const categoriesService = require('./categories.service');

const list = asyncHandler(async (req, res) => {
  const categories = await categoriesService.listPublic();
  new ApiResponse(200, { categories }).send(res);
});

const getBySlug = asyncHandler(async (req, res) => {
  const category = await categoriesService.getBySlug(req.params.slug);
  new ApiResponse(200, { category }).send(res);
});

module.exports = { list, getBySlug };
