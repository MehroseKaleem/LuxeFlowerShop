const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const wishlistService = require('./wishlist.service');

const list = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.list(req.user.id);
  new ApiResponse(200, { wishlist }).send(res);
});

const add = asyncHandler(async (req, res) => {
  await wishlistService.add(req.user.id, Number(req.body.productId));
  new ApiResponse(201, null, 'Added to wishlist').send(res);
});

const remove = asyncHandler(async (req, res) => {
  await wishlistService.remove(req.user.id, Number(req.params.productId));
  new ApiResponse(200, null, 'Removed from wishlist').send(res);
});

module.exports = { list, add, remove };
