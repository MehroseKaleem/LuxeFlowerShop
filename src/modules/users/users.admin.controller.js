const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const usersService = require('./users.service');
const { logAdminActivity } = require('../../utils/adminActivityLog');

const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await usersService.adminListUsers(req.query);
  new ApiResponse(200, { users: items }, 'Success', meta).send(res);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.adminGetUser(Number(req.params.id));
  new ApiResponse(200, { user }).send(res);
});

const setActive = asyncHandler(async (req, res) => {
  const user = await usersService.adminSetActive(Number(req.params.id), req.body.isActive);
  await logAdminActivity(req, {
    action: 'USER_STATUS_UPDATE',
    entityType: 'User',
    entityId: req.params.id,
    details: { isActive: req.body.isActive },
  });
  new ApiResponse(200, { user }, 'User status updated').send(res);
});

const setRole = asyncHandler(async (req, res) => {
  const user = await usersService.adminSetRole(Number(req.params.id), req.body.role);
  await logAdminActivity(req, {
    action: 'USER_ROLE_UPDATE',
    entityType: 'User',
    entityId: req.params.id,
    details: { role: req.body.role },
  });
  new ApiResponse(200, { user }, 'User role updated').send(res);
});

module.exports = { listUsers, getUser, setActive, setRole };
