const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const newsletterService = require('./newsletter.service');

const subscribe = asyncHandler(async (req, res) => {
  await newsletterService.subscribe(req.body.email);
  new ApiResponse(201, null, 'Subscribed successfully').send(res);
});

const unsubscribe = asyncHandler(async (req, res) => {
  await newsletterService.unsubscribe(req.body.email);
  new ApiResponse(200, null, 'Unsubscribed successfully').send(res);
});

const adminList = asyncHandler(async (req, res) => {
  const { items, meta } = await newsletterService.adminList(req.query);
  new ApiResponse(200, { subscribers: items }, 'Success', meta).send(res);
});

module.exports = { subscribe, unsubscribe, adminList };
