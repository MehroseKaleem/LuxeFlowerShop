const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const settingsService = require('./settings.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllPublic();
  new ApiResponse(200, { settings }).send(res);
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.adminSetMany(req.body);
  await logAdminActivity(req, { action: 'SETTINGS_UPDATE', entityType: 'Setting', details: req.body });
  new ApiResponse(200, { settings }, 'Settings updated').send(res);
});

module.exports = { getSettings, updateSettings };
