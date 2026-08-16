const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const contactService = require('./contact.service');

const create = asyncHandler(async (req, res) => {
  await contactService.create(req.body);
  new ApiResponse(201, null, 'Your message has been received. We will get back to you soon.').send(res);
});

const adminList = asyncHandler(async (req, res) => {
  const { items, meta } = await contactService.adminList(req.query);
  new ApiResponse(200, { messages: items }, 'Success', meta).send(res);
});

const adminMarkRead = asyncHandler(async (req, res) => {
  const message = await contactService.adminMarkRead(Number(req.params.id));
  new ApiResponse(200, { message }, 'Marked as read').send(res);
});

const adminDelete = asyncHandler(async (req, res) => {
  await contactService.adminDelete(Number(req.params.id));
  new ApiResponse(200, null, 'Message deleted').send(res);
});

const adminReply = asyncHandler(async (req, res) => {
  const message = await contactService.adminReply(Number(req.params.id), req.body.message);
  new ApiResponse(200, { message }, 'Reply sent').send(res);
});

module.exports = { create, adminList, adminMarkRead, adminDelete, adminReply };
