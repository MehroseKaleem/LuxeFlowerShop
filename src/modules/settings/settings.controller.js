const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const settingsService = require('./settings.service');

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllPublic();
  new ApiResponse(200, { settings }).send(res);
});

module.exports = { getPublicSettings };
