const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const categoriesService = require('./categories.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await categoriesService.adminList(req.query);
  new ApiResponse(200, { categories: items }, 'Success', meta).send(res);
});

const get = asyncHandler(async (req, res) => {
  const category = await categoriesService.adminGet(Number(req.params.id));
  new ApiResponse(200, { category }).send(res);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoriesService.adminCreate(req.body, req.file);
  await logAdminActivity(req, { action: 'CATEGORY_CREATE', entityType: 'Category', entityId: category.id });
  new ApiResponse(201, { category }, 'Category created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoriesService.adminUpdate(Number(req.params.id), req.body, req.file);
  await logAdminActivity(req, { action: 'CATEGORY_UPDATE', entityType: 'Category', entityId: category.id });
  new ApiResponse(200, { category }, 'Category updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await categoriesService.adminDelete(Number(req.params.id));
  await logAdminActivity(req, { action: 'CATEGORY_DELETE', entityType: 'Category', entityId: req.params.id });
  new ApiResponse(200, null, 'Category deleted').send(res);
});

module.exports = { list, get, create, update, remove };
