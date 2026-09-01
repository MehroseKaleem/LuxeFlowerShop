const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const productsService = require('./products.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productsService.adminList(req.query);
  new ApiResponse(200, { products: items }, 'Success', meta).send(res);
});

const get = asyncHandler(async (req, res) => {
  const product = await productsService.adminGet(Number(req.params.id));
  new ApiResponse(200, { product }).send(res);
});

const create = asyncHandler(async (req, res) => {
  const product = await productsService.adminCreate(req.body, req.files);
  await logAdminActivity(req, { action: 'PRODUCT_CREATE', entityType: 'Product', entityId: product.id });
  new ApiResponse(201, { product }, 'Product created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const product = await productsService.adminUpdate(Number(req.params.id), req.body);
  await logAdminActivity(req, { action: 'PRODUCT_UPDATE', entityType: 'Product', entityId: product.id });
  new ApiResponse(200, { product }, 'Product updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await productsService.adminDelete(Number(req.params.id));
  await logAdminActivity(req, { action: 'PRODUCT_DELETE', entityType: 'Product', entityId: req.params.id });
  new ApiResponse(200, null, 'Product deleted').send(res);
});

const addImages = asyncHandler(async (req, res) => {
  const images = await productsService.addImages(Number(req.params.id), req.files);
  new ApiResponse(201, { images }, 'Images added').send(res);
});

const removeImage = asyncHandler(async (req, res) => {
  await productsService.removeImage(Number(req.params.id), Number(req.params.imageId));
  new ApiResponse(200, null, 'Image removed').send(res);
});

const setPrimaryImage = asyncHandler(async (req, res) => {
  await productsService.setPrimaryImage(Number(req.params.id), Number(req.params.imageId));
  new ApiResponse(200, null, 'Primary image updated').send(res);
});

const addVariant = asyncHandler(async (req, res) => {
  const variant = await productsService.addVariant(Number(req.params.id), req.body);
  new ApiResponse(201, { variant }, 'Variant added').send(res);
});

const updateVariant = asyncHandler(async (req, res) => {
  const variant = await productsService.updateVariant(
    Number(req.params.id),
    Number(req.params.variantId),
    req.body,
  );
  new ApiResponse(200, { variant }, 'Variant updated').send(res);
});

const deleteVariant = asyncHandler(async (req, res) => {
  await productsService.deleteVariant(Number(req.params.id), Number(req.params.variantId));
  new ApiResponse(200, null, 'Variant deleted').send(res);
});

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  addImages,
  removeImage,
  setPrimaryImage,
  addVariant,
  updateVariant,
  deleteVariant,
};
