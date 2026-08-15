const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const bannersService = require('./banners.service');

const list = asyncHandler(async (req, res) => {
  const banners = await bannersService.listPublic(req.query.position);
  new ApiResponse(200, { banners }).send(res);
});

module.exports = { list };
