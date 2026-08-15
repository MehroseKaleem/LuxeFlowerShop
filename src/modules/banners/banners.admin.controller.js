const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const bannersService = require('./banners.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await bannersService.adminList(req.query);
  new ApiResponse(200, { banners: items }, 'Success', meta).send(res);
});

const create = asyncHandler(async (req, res) => {
  const banner = await bannersService.adminCreate(req.body, req.file);
  await logAdminActivity(req, { action: 'BANNER_CREATE', entityType: 'Banner', entityId: banner.id });
  new ApiResponse(201, { banner }, 'Banner created').send(res);
});

const update = asyncHandler(async (req, res) => {
  const banner = await bannersService.adminUpdate(Number(req.params.id), req.body, req.file);
  await logAdminActivity(req, { action: 'BANNER_UPDATE', entityType: 'Banner', entityId: banner.id });
  new ApiResponse(200, { banner }, 'Banner updated').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await bannersService.adminDelete(Number(req.params.id));
  await logAdminActivity(req, { action: 'BANNER_DELETE', entityType: 'Banner', entityId: req.params.id });
  new ApiResponse(200, null, 'Banner deleted').send(res);
});

module.exports = { list, create, update, remove };
