const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const sanitizeUser = require('../../utils/sanitizeUser');
const usersService = require('./users.service');

const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(req.user.id, req.body);
  new ApiResponse(200, { user: sanitizeUser(user) }, 'Profile updated').send(res);
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');
  const user = await usersService.updateAvatar(req.user.id, req.file.url);
  new ApiResponse(200, { user: sanitizeUser(user) }, 'Avatar updated').send(res);
});

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await usersService.listAddresses(req.user.id);
  new ApiResponse(200, { addresses }).send(res);
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await usersService.createAddress(req.user.id, req.body);
  new ApiResponse(201, { address }, 'Address added').send(res);
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await usersService.updateAddress(req.user.id, Number(req.params.id), req.body);
  new ApiResponse(200, { address }, 'Address updated').send(res);
});

const deleteAddress = asyncHandler(async (req, res) => {
  await usersService.deleteAddress(req.user.id, Number(req.params.id));
  new ApiResponse(200, null, 'Address deleted').send(res);
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await usersService.setDefaultAddress(req.user.id, Number(req.params.id));
  new ApiResponse(200, { address }, 'Default address updated').send(res);
});

module.exports = {
  updateProfile,
  uploadAvatar,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
